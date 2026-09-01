package com.example.coop_vsit_hub.staff_tracking.dto;

import com.example.coop_vsit_hub.individual_guest_management.dto.IndividualGuestSummaryResponse;
import com.example.coop_vsit_hub.organization_management.dto.OrganizationSummaryResponse;
import com.example.coop_vsit_hub.visit_management.dto.VisitSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * High-level response DTO for a Staff Member's personal tracked visits, organizations, and guests.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackedStaffOverviewResponse {

    private String staffUsername;
    private String staffFullName;
    private String staffEmail;

    private long totalTrackedVisits;
    private long totalTrackedOrganizations;
    private long totalTrackedGuests;
    private long activeReservationsCount;

    private List<VisitSummaryResponse> visits;
    private List<OrganizationSummaryResponse> organizations;
    private List<IndividualGuestSummaryResponse> individualGuests;
}
