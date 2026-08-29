package com.example.coop_vsit_hub.visit_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Detailed room booking audit record for Super Administrator Dashboard.
 * Includes complete identity, host staff profile, and meeting agenda details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRoomBookingResponse {
    private UUID visitId;
    private String visitCode;
    private String roomName;
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private String date;
    private String timeRange;
    private String title;
    private String purpose;
    private String guestDisplayName;
    private Integer visitorCount;
    private String status;

    // Detailed staff requester metadata
    private UUID bookedById;
    private String bookedByName;
    private String bookedByEmail;
    private String bookedByDepartment;
    private String bookedByPhone;
}
