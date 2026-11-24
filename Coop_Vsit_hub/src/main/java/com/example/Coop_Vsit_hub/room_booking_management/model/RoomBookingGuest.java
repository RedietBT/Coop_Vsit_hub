package com.example.coop_vsit_hub.room_booking_management.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/** A guest (name + email) invited to a room booking. */
@Entity
@Table(name = "room_booking_guests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBookingGuest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(name = "guest_name", nullable = false, length = 150)
    private String guestName;

    @Column(name = "guest_email", nullable = false, length = 200)
    private String guestEmail;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
