package com.example.coop_vsit_hub.room_booking_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelBookingRequest {

    private String cancellationReason;
}
