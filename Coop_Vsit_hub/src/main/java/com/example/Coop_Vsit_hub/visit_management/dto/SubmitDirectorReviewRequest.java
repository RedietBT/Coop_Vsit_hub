package com.example.coop_vsit_hub.visit_management.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitDirectorReviewRequest {

    @NotNull(message = "Director rating is mandatory (1 to 5).")
    @Min(value = 1, message = "Rating must be at least 1.")
    @Max(value = 5, message = "Rating cannot exceed 5.")
    @Schema(description = "Executive evaluation rating between 1 and 5", example = "5")
    private Integer rating;

    @NotBlank(message = "Meeting outcome is mandatory.")
    @Schema(description = "Outcome of the hosted visit (e.g., PARTNERSHIP_AGREED, DEAL_CLOSED, FOLLOW_UP_REQUIRED, EXPLORATORY_POSITIVE, UNSUCCESSFUL)", example = "PARTNERSHIP_AGREED")
    private String outcome;

    @Schema(description = "Executive notes, observations, or follow-up action items from the meeting", example = "Productive discussion on corporate treasury integration. Follow-up meeting scheduled for next week.")
    private String reviewNotes;
}
