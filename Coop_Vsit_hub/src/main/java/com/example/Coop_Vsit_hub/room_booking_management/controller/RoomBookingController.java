package com.example.coop_vsit_hub.room_booking_management.controller;

import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
import com.example.coop_vsit_hub.room_booking_management.dto.CreateRoomBookingRequest;
import com.example.coop_vsit_hub.room_booking_management.dto.RoomBookingResponse;
import com.example.coop_vsit_hub.room_booking_management.dto.RoomBookingSlotResponse;
import com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus;
import com.example.coop_vsit_hub.room_booking_management.service.RoomBookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/room-bookings")
@RequiredArgsConstructor
@Tag(name = "Room Booking Management", description = "Dedicated Meeting Room & Boardroom Reservations API")
public class RoomBookingController {

    private final RoomBookingService roomBookingService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create Room Booking", description = "Books a meeting room with instant confirmation and sends alert to System Admin.")
    public ResponseEntity<RoomBookingResponse> createBooking(
            @RequestBody CreateRoomBookingRequest request,
            Principal principal
    ) {
        User currentUser = null;
        if (principal != null) {
            currentUser = userRepository.findByUsername(principal.getName()).orElse(null);
        }
        RoomBookingResponse response = roomBookingService.createBooking(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List Room Bookings", description = "Paginated list of room bookings with search and filters.")
    public ResponseEntity<Page<RoomBookingResponse>> getBookings(
            @RequestParam(required = false) String roomName,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) RoomBookingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "scheduledStartTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        Sort sort = sortDirection.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<RoomBookingResponse> result = roomBookingService.getBookings(roomName, search, status, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/slots")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get Room Reserved Slots", description = "Fetches booked time slots for an interactive calendar.")
    public ResponseEntity<List<RoomBookingSlotResponse>> getRoomSlots(
            @RequestParam String roomName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate
    ) {
        Instant start = fromDate != null ? fromDate : Instant.now().minusSeconds(86400 * 30);
        Instant end = toDate != null ? toDate : Instant.now().plusSeconds(86400 * 90);
        return ResponseEntity.ok(roomBookingService.getRoomSlots(roomName, start, end));
    }

    @GetMapping("/date")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get Active Bookings For Date", description = "Fetches confirmed room bookings for a specific date range for Front Desk smart linking.")
    public ResponseEntity<List<RoomBookingResponse>> getActiveBookingsForDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate
    ) {
        return ResponseEntity.ok(roomBookingService.getActiveBookingsForDate(fromDate, toDate));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RoomBookingResponse> getBookingById(@PathVariable UUID id) {
        return ResponseEntity.ok(roomBookingService.getBookingById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER')")
    @Operation(summary = "Cancel Room Booking", description = "Cancels a room reservation.")
    public ResponseEntity<RoomBookingResponse> cancelBooking(
            @PathVariable UUID id,
            Principal principal
    ) {
        User currentUser = null;
        if (principal != null) {
            currentUser = userRepository.findByUsername(principal.getName()).orElse(null);
        }
        return ResponseEntity.ok(roomBookingService.cancelBooking(id, currentUser));
    }
}
