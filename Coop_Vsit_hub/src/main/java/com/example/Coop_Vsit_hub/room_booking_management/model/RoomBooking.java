package com.example.coop_vsit_hub.room_booking_management.model;

import com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Dedicated Room Booking Entity.
 * Represents meeting room and executive lounge reservations decoupled from visitor arrival lifecycles.
 */
@Entity
@Table(name = "room_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RoomBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_code", length = 50, nullable = false, unique = true)
    private String bookingCode;

    @Column(name = "room_name", length = 120, nullable = false)
    private String roomName;

    @Column(name = "meeting_title", length = 255, nullable = false)
    private String meetingTitle;

    @Column(name = "host_department", length = 120)
    private String hostDepartment;

    @Column(name = "booked_by_user_id")
    private UUID bookedByUserId;

    @Column(name = "booked_by_name", length = 150)
    private String bookedByName;

    @Column(name = "booked_by_username", length = 100)
    private String bookedByUsername;

    @Column(name = "booked_by_email", length = 150)
    private String bookedByEmail;

    @Column(name = "guest_organization_name", length = 150)
    private String guestOrganizationName;

    @Column(name = "guest_name", length = 150)
    private String guestName;

    @Builder.Default
    @Column(name = "expected_attendees")
    private Integer expectedAttendees = 1;

    @Column(name = "meeting_agenda", columnDefinition = "TEXT")
    private String meetingAgenda;

    @Column(name = "scheduled_start_time", nullable = false)
    private Instant scheduledStartTime;

    @Column(name = "scheduled_end_time", nullable = false)
    private Instant scheduledEndTime;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private RoomBookingStatus status = RoomBookingStatus.CONFIRMED;

    @Column(name = "linked_visit_id")
    private UUID linkedVisitId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
