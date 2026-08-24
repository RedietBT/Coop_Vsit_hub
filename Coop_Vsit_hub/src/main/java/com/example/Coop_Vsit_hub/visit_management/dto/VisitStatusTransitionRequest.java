package com.example.coop_vsit_hub.visit_management.dto;

import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitStatusTransitionRequest {

    @NotNull(message = "Target status is mandatory.")
    @Schema(description = "New lifecycle state (e.g. APPROVED, REJECTED, UNDER_REVIEW, SCHEDULED, CANCELLED)", example = "APPROVED")
    private VisitStatus status;

    @Schema(description = "Optional approver feedback, approval notes, or rejection reason", example = "Approved with executive catering allocated in Boardroom 4A.")
    private String decisionNotes;
}
