package com.example.coop_vsit_hub.notification_management.repository;

import com.example.coop_vsit_hub.notification_management.model.EmailLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, UUID> {

    /** status "" = any; search is a lower-cased "%term%" pattern (never null). */
    @Query("select l from EmailLog l where (:status = '' or l.status = :status) and ("
            + "lower(l.recipientEmail) like :search or lower(coalesce(l.recipientName, '')) like :search "
            + "or lower(coalesce(l.bookingCode, '')) like :search or lower(coalesce(l.meetingTitle, '')) like :search "
            + "or lower(coalesce(l.roomName, '')) like :search)")
    Page<EmailLog> search(@Param("status") String status, @Param("search") String search, Pageable pageable);
}
