package com.example.coop_vsit_hub.room_booking_management.dto;

import com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus;
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
    private UUID bookedByUserId;
    private String bookedByName;
    private String bookedByEmail;
    private String hostDepartment;
    private Integer expectedAttendees;
    private String meetingAgenda;
    private String guestOrganizationName;
    private String guestName;
    private RoomBookingStatus status;
}
