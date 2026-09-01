package com.example.coop_vsit_hub.staff_tracking.service;

import com.example.coop_vsit_hub.individual_guest_management.dto.IndividualGuestSummaryResponse;
import com.example.coop_vsit_hub.organization_management.dto.OrganizationSummaryResponse;
import com.example.coop_vsit_hub.staff_tracking.dto.TrackedStaffOverviewResponse;
import com.example.coop_vsit_hub.visit_management.dto.VisitSummaryResponse;

import java.util.List;
import java.util.UUID;

public interface StaffTrackingService {

    TrackedStaffOverviewResponse getStaffTrackedOverview(String staffIdentifier);

    List<VisitSummaryResponse> getStaffTrackedVisits(String staffIdentifier);

    List<OrganizationSummaryResponse> getStaffTrackedOrganizations(String staffIdentifier);

    List<IndividualGuestSummaryResponse> getStaffTrackedGuests(String staffIdentifier);

    boolean linkBookingToVisit(UUID bookingId, UUID visitId, String staffIdentifier);
}
