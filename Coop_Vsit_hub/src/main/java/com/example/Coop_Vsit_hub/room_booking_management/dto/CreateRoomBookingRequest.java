package com.example.coop_vsit_hub.room_booking_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomBookingRequest {

    private String roomName;
    private String meetingTitle;
    private String hostDepartment;
    private String guestOrganizationName;
    private String guestName;
    private Integer expectedAttendees;
    private String meetingAgenda;
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
}
