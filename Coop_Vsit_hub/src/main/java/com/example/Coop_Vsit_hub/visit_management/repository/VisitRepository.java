package com.example.coop_vsit_hub.visit_management.repository;

import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VisitRepository extends JpaRepository<Visit, UUID>, JpaSpecificationExecutor<Visit> {

    Optional<Visit> findByVisitCode(String visitCode);

    Optional<Visit> findByVisitorBadgeNumber(String visitorBadgeNumber);

    boolean existsByVisitCode(String visitCode);

    boolean existsByVisitorBadgeNumber(String visitorBadgeNumber);

    long countByVisitCodeStartingWith(String prefix);

    long countByVisitorBadgeNumberStartingWith(String prefix);

    long countByStatus(VisitStatus status);

    long countByPriorityLevel(VisitPriority priorityLevel);

    /**
     * Finds overlapping visits in the same room to prevent double-booking.
     * Ignores CANCELLED, REJECTED, and DRAFT visits.
     */
    @Query("SELECT v FROM Visit v WHERE LOWER(v.locationRoom) = LOWER(:room) " +
           "AND v.status NOT IN (com.example.coop_vsit_hub.visit_management.enums.VisitStatus.CANCELLED, " +
           "                     com.example.coop_vsit_hub.visit_management.enums.VisitStatus.REJECTED, " +
           "                     com.example.coop_vsit_hub.visit_management.enums.VisitStatus.DRAFT) " +
           "AND (v.scheduledStartTime < :endTime AND v.scheduledEndTime > :startTime) " +
           "AND (:excludeId IS NULL OR v.id != :excludeId)")
    List<Visit> findOverlappingRoomVisits(
            @Param("room") String room,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("excludeId") UUID excludeId
    );

    /**
     * Sum of total active opportunity pipeline value across active / approved visits.
     */
    @Query("SELECT COALESCE(SUM(v.opportunityValue), 0) FROM Visit v " +
           "WHERE v.status NOT IN (com.example.coop_vsit_hub.visit_management.enums.VisitStatus.CANCELLED, " +
           "                     com.example.coop_vsit_hub.visit_management.enums.VisitStatus.REJECTED, " +
           "                     com.example.coop_vsit_hub.visit_management.enums.VisitStatus.DRAFT)")
    BigDecimal sumActivePipelineValue();

    @Query("SELECT v.status, COUNT(v) FROM Visit v GROUP BY v.status")
    List<Object[]> countVisitsByStatusGroup();

    @Query("SELECT v.priorityLevel, COUNT(v) FROM Visit v GROUP BY v.priorityLevel")
    List<Object[]> countVisitsByPriorityGroup();

    @Query("SELECT COALESCE(v.requestingDepartment, 'Unassigned'), COUNT(v) FROM Visit v GROUP BY v.requestingDepartment")
    List<Object[]> countVisitsByDepartmentGroup();

    @Query("SELECT v FROM Visit v WHERE v.scheduledStartTime >= :now AND v.status IN (com.example.coop_vsit_hub.visit_management.enums.VisitStatus.APPROVED, com.example.coop_vsit_hub.visit_management.enums.VisitStatus.SCHEDULED) ORDER BY v.scheduledStartTime ASC")
    List<Visit> findUpcomingScheduledVisits(@Param("now") Instant now);
}
