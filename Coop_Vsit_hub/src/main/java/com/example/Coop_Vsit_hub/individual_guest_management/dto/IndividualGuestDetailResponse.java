package com.example.coop_vsit_hub.individual_guest_management.dto;

import com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType;
import com.example.coop_vsit_hub.individual_guest_management.enums.VipTier;
import com.example.coop_vsit_hub.individual_guest_management.model.IndividualGuest;
import com.example.coop_vsit_hub.visit_management.dto.VisitSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Detailed profile of an individual guest with past visits and opportunity valuation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndividualGuestDetailResponse {

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
    private String notes;
    private long totalVisitsAttended;
    private long totalVisits;
    private long totalVisitsCompleted;
    private BigDecimal totalOpportunityPipelineValue;
    private String currency;
    private List<VisitSummaryResponse> recentVisits;
    private List<com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse> recentFeedbacks;
    private Instant createdAt;
    private Instant updatedAt;

    public static IndividualGuestDetailResponse from(
            IndividualGuest guest,
            long totalVisits,
            BigDecimal pipelineValue,
            List<VisitSummaryResponse> recentVisits
    ) {
        return from(guest, totalVisits, pipelineValue, recentVisits, List.of());
    }

    public static IndividualGuestDetailResponse from(
            IndividualGuest guest,
            long totalVisits,
            BigDecimal pipelineValue,
            List<VisitSummaryResponse> recentVisits,
            List<com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse> recentFeedbacks
    ) {
        double stars = Math.round((Math.max(20, guest.getRelationshipScore()) / 20.0) * 10.0) / 10.0;
        return IndividualGuestDetailResponse.builder()
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
                .notes(guest.getNotes())
                .totalVisitsAttended(totalVisits)
                .totalVisits(totalVisits)
                .totalVisitsCompleted(totalVisits)
                .totalOpportunityPipelineValue(pipelineValue != null ? pipelineValue : BigDecimal.ZERO)
                .currency("USD")
                .recentVisits(recentVisits)
                .recentFeedbacks(recentFeedbacks)
                .createdAt(guest.getCreatedAt())
                .updatedAt(guest.getUpdatedAt())
                .build();
    }
}
