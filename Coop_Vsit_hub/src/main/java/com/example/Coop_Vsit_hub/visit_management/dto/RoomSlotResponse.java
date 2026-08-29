package com.example.coop_vsit_hub.visit_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Privacy-preserving room booking slot for public & staff calendar views.
 * Intentionally does NOT include requester names or personal identifying information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomSlotResponse {
    private String roomName;
    private Instant startTime;
    private Instant endTime;
    private String date; // YYYY-MM-DD in UTC/local
    private String timeFormatted; // e.g. "09:00 AM - 11:30 AM"
    private boolean booked;
}
