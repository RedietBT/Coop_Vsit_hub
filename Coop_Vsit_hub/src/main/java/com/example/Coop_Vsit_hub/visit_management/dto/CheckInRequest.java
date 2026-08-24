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

    @Schema(description = "Optional custom badge code. If left blank, system auto-generates sequential badge e.g. COOPV2026080001", example = "")
    private String customBadgeNumber;

    @Schema(description = "Government ID / Passport / Driver License verified by security desk", example = "EP2948194")
    private String verifiedIdNumber;

    @Schema(description = "Front desk check-in notes or security clearances", example = "Visitor cleared security screening, badge issued.")
    private String checkInNotes;
}
