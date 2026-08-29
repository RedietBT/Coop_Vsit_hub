package com.example.coop_vsit_hub.room_booking_management.service;

import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.room_booking_management.dto.CreateRoomBookingRequest;
import com.example.coop_vsit_hub.room_booking_management.dto.RoomBookingResponse;
import com.example.coop_vsit_hub.room_booking_management.dto.RoomBookingSlotResponse;
import com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface RoomBookingService {

    RoomBookingResponse createBooking(CreateRoomBookingRequest request, User currentUser);

    Page<RoomBookingResponse> getBookings(String roomName, String search, RoomBookingStatus status, Pageable pageable);

    List<RoomBookingSlotResponse> getRoomSlots(String roomName, Instant fromDate, Instant toDate);

    List<RoomBookingResponse> getActiveBookingsForDate(Instant fromDate, Instant toDate);

    RoomBookingResponse cancelBooking(UUID bookingId, User currentUser);

    RoomBookingResponse getBookingById(UUID bookingId);
}
