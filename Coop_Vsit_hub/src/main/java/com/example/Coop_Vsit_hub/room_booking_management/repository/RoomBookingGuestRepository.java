package com.example.coop_vsit_hub.room_booking_management.repository;

import com.example.coop_vsit_hub.room_booking_management.model.RoomBookingGuest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomBookingGuestRepository extends JpaRepository<RoomBookingGuest, UUID> {
    List<RoomBookingGuest> findByBookingIdOrderByCreatedAtAsc(UUID bookingId);

    void deleteByBookingIdAndGuestEmailIgnoreCase(UUID bookingId, String guestEmail);
}
