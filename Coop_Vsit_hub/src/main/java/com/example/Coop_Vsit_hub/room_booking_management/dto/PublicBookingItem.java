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
public class PublicBookingItem {
    private UUID id;
    private String bookingCode;
    private String roomName;
    private String meetingTitle;
    private String hostDepartment;
    private String bookedByName;
    private String bookedByEmail;
    private String bookedByPhone;
    private String guestName;
    private String guestOrganizationName;
    private Integer expectedAttendees;
    private String meetingAgenda;
    private String requestedItems;
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private String status;
    private boolean isOngoing;
    private boolean isUpcoming;
    private boolean isCompleted;
    private String engagementType;
}

