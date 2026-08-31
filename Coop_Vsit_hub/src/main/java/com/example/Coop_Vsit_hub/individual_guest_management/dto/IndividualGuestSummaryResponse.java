package com.example.coop_vsit_hub.individual_guest_management.dto;

import com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType;
import com.example.coop_vsit_hub.individual_guest_management.enums.VipTier;
import com.example.coop_vsit_hub.individual_guest_management.model.IndividualGuest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Lightweight DTO for individual guest registers and selector dropdowns.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndividualGuestSummaryResponse {

    private UUID id;
    private String firstName;
    private String middleName;
    private String lastName;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String idNumber;
    private IdentityDocumentType idType;
    private String guestTitle;
    private String organizationAffiliation;
    private String countryOfResidence;
    private VipTier vipTier;
    private int relationshipScore;
    private Double starRating;
    private long totalVisits;
    private Instant createdAt;

    public static IndividualGuestSummaryResponse from(IndividualGuest guest) {
        return from(guest, 0);
    }

    public static IndividualGuestSummaryResponse from(IndividualGuest guest, long totalVisits) {
        double stars = Math.round((Math.max(20, guest.getRelationshipScore()) / 20.0) * 10.0) / 10.0;
        return IndividualGuestSummaryResponse.builder()
                .id(guest.getId())
                .firstName(guest.getFirstName())
                .middleName(guest.getMiddleName())
                .lastName(guest.getLastName())
                .fullName(guest.getFullName())
                .email(guest.getEmail())
                .phoneNumber(guest.getPhoneNumber())
                .idNumber(guest.getIdNumber())
                .idType(guest.getIdType())
                .guestTitle(guest.getGuestTitle())
                .organizationAffiliation(guest.getOrganizationAffiliation())
                .countryOfResidence(guest.getCountryOfResidence())
                .vipTier(guest.getVipTier())
                .relationshipScore(guest.getRelationshipScore())
                .starRating(stars)
                .totalVisits(totalVisits)
                .createdAt(guest.getCreatedAt())
                .build();
    }
}
