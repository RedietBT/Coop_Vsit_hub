package com.example.coop_vsit_hub.feedback_management.dto;

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
public class FeedbackVerifyResponse {

    private boolean valid;
    private UUID visitId;
    private String visitCode;
    private String visitTitle;
    private String guestDisplayName;
    private Instant visitDate;
    private boolean alreadySubmitted;
    private boolean expired;
    private String message;
}
