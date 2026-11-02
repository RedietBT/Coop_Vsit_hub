package com.example.coop_vsit_hub.room_booking_management.controller;

import com.example.coop_vsit_hub.master_data.dto.MeetingRoomDto;
import com.example.coop_vsit_hub.master_data.entity.MeetingRoom;
import com.example.coop_vsit_hub.master_data.repository.MeetingRoomRepository;
import com.example.coop_vsit_hub.room_booking_management.dto.PublicBookingItem;
import com.example.coop_vsit_hub.room_booking_management.dto.PublicRoomScheduleResponse;
import com.example.coop_vsit_hub.room_booking_management.dto.RoomBookingSlotResponse;
import com.example.coop_vsit_hub.room_booking_management.service.RoomBookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Public REST API for unauthenticated Live Room Schedule & TV Display Dashboards.
 * Displays real-time meeting room reservations of the day, who booked them,
 * and current room occupancy without requiring staff credentials.
 */
@RestController
@RequestMapping("/api/v1/public/room-schedule")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public Room Display Dashboard", description = "Unauthenticated live meeting room booking and daily schedule display")
public class PublicRoomScheduleController {

    private final RoomBookingService roomBookingService;
    private final MeetingRoomRepository meetingRoomRepository;

    private static final ZoneId EAT_ZONE = ZoneId.of("Africa/Addis_Ababa");

    @GetMapping("/rooms")
    @Operation(summary = "List Active Meeting Rooms (Public)", description = "Returns active meeting rooms and spaces for the display board dropdown filter.")
    public ResponseEntity<List<MeetingRoomDto>> getPublicMeetingRooms() {
        List<MeetingRoom> rooms = meetingRoomRepository.findByIsActiveTrueOrderByNameAsc();
        return ResponseEntity.ok(rooms.stream().map(MeetingRoomDto::from).toList());
    }

    @GetMapping({"", "/", "/today"})
    @Operation(summary = "Live Daily Room Booking Schedule (Public)", description = "Returns confirmed room reservations for a given date with reserver info, room status, and occupancy counts.")
    public ResponseEntity<PublicRoomScheduleResponse> getPublicDailySchedule(
            @RequestParam(required = false) String roomName,
            @RequestParam(required = false) String date
    ) {
        LocalDate todayDate = LocalDate.now(EAT_ZONE);
        LocalDate targetDate;
        if (StringUtils.hasText(date)) {
            try {
                targetDate = LocalDate.parse(date.trim());
            } catch (Exception e) {
                targetDate = todayDate;
            }
        } else {
            targetDate = todayDate;
        }

        boolean isToday = targetDate.equals(todayDate);
        Instant fromDate = targetDate.atStartOfDay(EAT_ZONE).toInstant();
        Instant toDate = targetDate.plusDays(1).atStartOfDay(EAT_ZONE).toInstant();
        Instant now = Instant.now();

        List<MeetingRoom> allActiveRooms = meetingRoomRepository.findByIsActiveTrueOrderByNameAsc();
        List<MeetingRoomDto> roomDtos = allActiveRooms.stream().map(MeetingRoomDto::from).toList();

        final String cleanFilterRoom = (roomName != null && !roomName.isBlank() && !"all".equalsIgnoreCase(roomName.trim()))
                ? roomName.trim()
                : null;

        // Fetch room slots within this day window
        List<RoomBookingSlotResponse> slots = roomBookingService.getRoomSlots(cleanFilterRoom, fromDate, toDate);

        List<PublicBookingItem> items = new ArrayList<>(slots.stream().map(s -> {
            boolean isOngoing = s.getScheduledStartTime() != null && s.getScheduledEndTime() != null
                    && now.isAfter(s.getScheduledStartTime()) && now.isBefore(s.getScheduledEndTime());
            boolean isUpcoming = s.getScheduledStartTime() != null && now.isBefore(s.getScheduledStartTime());
            boolean isCompleted = (s.getScheduledEndTime() != null && now.isAfter(s.getScheduledEndTime()))
                    || (s.getStatus() != null && "COMPLETED".equalsIgnoreCase(s.getStatus().name()));

            return PublicBookingItem.builder()
                    .id(s.getId())
                    .bookingCode(s.getBookingCode())
                    .roomName(s.getRoomName())
                    .meetingTitle(s.getMeetingTitle())
                    .hostDepartment(StringUtils.hasText(s.getHostDepartment()) ? s.getHostDepartment().trim() : null)
                    .bookedByName(StringUtils.hasText(s.getBookedByName()) ? s.getBookedByName().trim() : null)
                    .bookedByEmail(s.getBookedByEmail())
                    .bookedByPhone(s.getBookedByPhone())
                    .guestName(s.getGuestName())
                    .guestOrganizationName(s.getGuestOrganizationName())
                    .expectedAttendees(s.getExpectedAttendees())
                    .meetingAgenda(s.getMeetingAgenda())
                    .requestedItems(s.getRequestedItems())
                    .scheduledStartTime(s.getScheduledStartTime())
                    .scheduledEndTime(s.getScheduledEndTime())
                    .status(isOngoing ? "IN_PROGRESS" : (isCompleted ? "COMPLETED" : "CONFIRMED"))
                    .isOngoing(isOngoing)
                    .isUpcoming(isUpcoming)
                    .isCompleted(isCompleted)
                    .engagementType(s.getEngagementType())
                    .build();
        }).toList());

        // Sort items chronologically by start time
        items.sort(Comparator.comparing(PublicBookingItem::getScheduledStartTime, Comparator.nullsLast(Comparator.naturalOrder())));

        // Calculate occupancy KPI summary
        Set<String> activeRoomNames;
        if (isToday) {
            // For today: rooms with ongoing meetings right now
            activeRoomNames = items.stream()
                    .filter(PublicBookingItem::isOngoing)
                    .map(b -> b.getRoomName() != null ? b.getRoomName().trim().toLowerCase() : "")
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toSet());
        } else {
            // For other dates: distinct rooms that have scheduled reservations
            activeRoomNames = items.stream()
                    .map(b -> b.getRoomName() != null ? b.getRoomName().trim().toLowerCase() : "")
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toSet());
        }

        int roomsInUse = activeRoomNames.size();
        int totalActiveRooms = allActiveRooms.size();
        int roomsAvailable = Math.max(0, totalActiveRooms - roomsInUse);
        int totalExpectedAttendees = items.stream()
                .mapToInt(b -> b.getExpectedAttendees() != null ? b.getExpectedAttendees() : 1)
                .sum();

        PublicRoomScheduleResponse response = PublicRoomScheduleResponse.builder()
                .date(targetDate.toString())
                .serverTime(now)
                .selectedRoomName(cleanFilterRoom)
                .rooms(roomDtos)
                .bookings(items)
                .totalBookingsToday(items.size())
                .roomsInUse(roomsInUse)
                .roomsAvailable(roomsAvailable)
                .totalExpectedAttendees(totalExpectedAttendees)
                .build();

        return ResponseEntity.ok(response);
    }
}
