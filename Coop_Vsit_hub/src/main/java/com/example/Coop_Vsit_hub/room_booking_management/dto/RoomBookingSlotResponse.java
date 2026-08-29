package com.example.coop_vsit_hub.room_booking_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomBookingSlotResponse {
    private UUID id;
    private String bookingCode;
    private String roomName;
    private String meetingTitle;
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private String bookedByName;
    private String guestOrganizationName;
    private String guestName;
}
