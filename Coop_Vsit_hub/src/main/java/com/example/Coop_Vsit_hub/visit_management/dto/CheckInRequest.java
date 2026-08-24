package com.example.coop_vsit_hub.visit_management.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInRequest {

    @Schema(description = "(Optional) Custom badge code. If left blank or null, system auto-generates sequential badge e.g. COOPV2026080001", example = "")
    private String customBadgeNumber;

    @Schema(description = "(Optional) Government ID / Passport / Driver License verified by security desk", example = "")
    private String verifiedIdNumber;

    @Schema(description = "(Optional) Front desk check-in notes or security clearances", example = "Visitor cleared security screening.")
    private String checkInNotes;
}
