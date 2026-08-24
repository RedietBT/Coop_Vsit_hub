package com.example.coop_vsit_hub.feedback_management.dto;

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
public class SubmitFeedbackRequest {

    @NotBlank(message = "Survey token is required.")
    @Schema(description = "Single-use survey security token", example = "fb-9a8c7b6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4")
    private String token;

    @NotNull(message = "Hospitality rating is required (1-5 stars).")
    @Min(value = 1, message = "Hospitality rating must be between 1 and 5.")
    @Max(value = 5, message = "Hospitality rating must be between 1 and 5.")
    @Schema(description = "Reception & hospitality satisfaction (1-5)", example = "5")
    private Integer hospitalityRating;

    @NotNull(message = "Facility rating is required (1-5 stars).")
    @Min(value = 1, message = "Facility rating must be between 1 and 5.")
    @Max(value = 5, message = "Facility rating must be between 1 and 5.")
    @Schema(description = "DxValley facility & infrastructure quality (1-5)", example = "5")
    private Integer facilityRating;

    @NotNull(message = "Objective rating is required (1-5 stars).")
    @Min(value = 1, message = "Objective rating must be between 1 and 5.")
    @Max(value = 5, message = "Objective rating must be between 1 and 5.")
    @Schema(description = "Meeting objectives fulfillment (1-5)", example = "4")
    private Integer objectiveRating;

    @NotNull(message = "Net Promoter Score (NPS) is required (0-10).")
    @Min(value = 0, message = "NPS score must be between 0 and 10.")
    @Max(value = 10, message = "NPS score must be between 0 and 10.")
    @Schema(description = "Likelihood of recommending CoopBank DxValley partnership (0-10)", example = "10")
    private Integer npsScore;

    @Schema(description = "Qualitative guest feedback and suggestions", example = "Exceptional hospitality from the digital banking team. Looking forward to our integration launch!")
    private String comments;
}
