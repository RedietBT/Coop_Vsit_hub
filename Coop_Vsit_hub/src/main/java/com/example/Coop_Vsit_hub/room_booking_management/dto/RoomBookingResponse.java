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
public class RoomBookingResponse {

    private UUID id;
    private String bookingCode;
    private String roomName;
    private String meetingTitle;
    private String hostDepartment;
    private UUID bookedByUserId;
    private String bookedByName;
    private String bookedByUsername;
    private String bookedByEmail;
    private String guestOrganizationName;
    private String guestName;
    private Integer expectedAttendees;
    private String meetingAgenda;
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private RoomBookingStatus status;
    private UUID linkedVisitId;
    private String linkedVisitCode;
    private Instant createdAt;
    private Instant updatedAt;
}
