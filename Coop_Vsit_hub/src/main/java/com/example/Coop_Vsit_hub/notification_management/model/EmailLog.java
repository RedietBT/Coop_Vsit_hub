package com.example.coop_vsit_hub.notification_management.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/** One row per guest email attempt. */
@Entity
@Table(name = "email_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_code", length = 50)
    private String bookingCode;

    @Column(name = "room_name", length = 120)
    private String roomName;

    @Column(name = "meeting_title", length = 255)
    private String meetingTitle;

    @Column(name = "recipient_name", length = 150)
    private String recipientName;

    @Column(name = "recipient_email", length = 200, nullable = false)
    private String recipientEmail;

    /** INVITATION, RESCHEDULE or CANCELLATION. */
    @Column(name = "email_type", length = 30, nullable = false)
    private String emailType;

    /** SENT or FAILED. */
    @Column(name = "status", length = 20, nullable = false)
    private String status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "triggered_by", length = 150)
    private String triggeredBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
