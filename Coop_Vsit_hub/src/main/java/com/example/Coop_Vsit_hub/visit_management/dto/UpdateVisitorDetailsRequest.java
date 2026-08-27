package com.example.coop_vsit_hub.visit_management.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Front Desk / Lobby Visitor Demographic Registration Request.
 * All demographic fields are optional for quick reception processing.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVisitorDetailsRequest {

    @Schema(example = "Yusuf")
    private String firstName;

    @Schema(example = "Hassen")
    private String middleName;

    @Schema(example = "Hassen")
    private String surname;

    @Schema(example = "ET-ID-887722")
    private String idNumber;

    @Schema(example = "0910149192")
    private String phone;

    @Schema(example = "yusuf.hassen@example.com")
    private String email;

    @Schema(example = "1990-05-15")
    private LocalDate dateOfBirth;

    @Schema(example = "2022-01-10")
    private LocalDate issuedDate;

    @Schema(example = "2027-01-10")
    private LocalDate expiredDate;

    @Schema(example = "Male")
    private String gender;

    @Schema(example = "Ethiopian")
    private String citizenship;

    @Schema(example = "Oromia")
    private String region;

    @Schema(example = "Finfinnee Special Zone")
    private String zone;

    @Schema(example = "Bole")
    private String woreda;

    @Schema(example = "National ID")
    private String idType;

    @Schema(example = "data:image/jpeg;base64,...")
    private String idPhotoUrl;
}
