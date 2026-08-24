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
public class CheckOutRequest {

    @Schema(description = "Front desk check-out notes (e.g. badge returned, escort completed)", example = "Badge returned, escort to main gate complete.")
    private String checkOutNotes;
}
