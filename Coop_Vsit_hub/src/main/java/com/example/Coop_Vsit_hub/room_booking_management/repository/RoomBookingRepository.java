package com.example.coop_vsit_hub.room_booking_management.repository;

import com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus;
import com.example.coop_vsit_hub.room_booking_management.model.RoomBooking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomBookingRepository extends JpaRepository<RoomBooking, UUID>, JpaSpecificationExecutor<RoomBooking> {

    Optional<RoomBooking> findByBookingCode(String bookingCode);

    Optional<RoomBooking> findByLinkedVisitId(UUID linkedVisitId);

    Optional<RoomBooking> findTopByOrderByCreatedAtDesc();

    @Query("SELECT b FROM RoomBooking b WHERE " +
           "(:roomName IS NULL OR TRIM(:roomName) = '' OR " +
           " LOWER(TRIM(b.roomName)) = LOWER(TRIM(:roomName)) OR " +
           " LOWER(b.roomName) LIKE LOWER(CONCAT('%', TRIM(:roomName), '%')) OR " +
           " LOWER(TRIM(:roomName)) LIKE LOWER(CONCAT('%', TRIM(b.roomName), '%'))) " +
           "AND (b.status IS NULL OR b.status = :confirmedStatus) " +
           "AND b.scheduledStartTime < :endTime " +
           "AND b.scheduledEndTime > :startTime")
    List<RoomBooking> findOverlappingBookings(
            @Param("roomName") String roomName,
            @Param("confirmedStatus") RoomBookingStatus confirmedStatus,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime
    );

    @Query("SELECT b FROM RoomBooking b WHERE " +
           "(:roomName IS NULL OR TRIM(:roomName) = '' OR " +
           " LOWER(TRIM(b.roomName)) = LOWER(TRIM(:roomName)) OR " +
           " LOWER(b.roomName) LIKE LOWER(CONCAT('%', TRIM(:roomName), '%')) OR " +
           " LOWER(TRIM(:roomName)) LIKE LOWER(CONCAT('%', TRIM(b.roomName), '%'))) " +
           "AND (b.status IS NULL OR b.status != :cancelledStatus) " +
           "AND (:fromDate IS NULL OR b.scheduledEndTime >= :fromDate) " +
           "AND (:toDate IS NULL OR b.scheduledStartTime <= :toDate) " +
           "ORDER BY b.scheduledStartTime ASC")
    List<RoomBooking> findActiveRoomSlots(
            @Param("roomName") String roomName,
            @Param("cancelledStatus") RoomBookingStatus cancelledStatus,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate
    );

    @Query("SELECT b FROM RoomBooking b WHERE " +
           "(b.status IS NULL OR b.status != :cancelledStatus) " +
           "AND (b.scheduledStartTime <= :toDate AND b.scheduledEndTime >= :fromDate) " +
           "ORDER BY b.scheduledStartTime ASC")
    List<RoomBooking> findAllActiveForDateRange(
            @Param("cancelledStatus") RoomBookingStatus cancelledStatus,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate
    );

    @Modifying
    @Query("UPDATE RoomBooking b SET b.status = com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus.COMPLETED " +
           "WHERE b.status = com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus.CONFIRMED " +
           "AND b.scheduledEndTime IS NOT NULL AND b.scheduledEndTime <= :now")
    int markExpiredConfirmedBookingsCompleted(@Param("now") Instant now);

    List<RoomBooking> findByBookedByUserId(UUID bookedByUserId);

    Page<RoomBooking> findByBookedByUserId(UUID bookedByUserId, Pageable pageable);

    List<RoomBooking> findByBookedByUsernameIgnoreCaseOrBookedByEmailIgnoreCase(String username, String email);
}
