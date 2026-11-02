package com.example.coop_vsit_hub.room_booking_management.dto;

import com.example.coop_vsit_hub.master_data.dto.MeetingRoomDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicRoomScheduleResponse {
    private String date; // YYYY-MM-DD (Africa/Addis_Ababa)
    private Instant serverTime;
    private String selectedRoomName;
    private List<MeetingRoomDto> rooms;
    private List<PublicBookingItem> bookings;
    private int totalBookingsToday;
    private int roomsInUse;
    private int roomsAvailable;
    private int totalExpectedAttendees;
}

