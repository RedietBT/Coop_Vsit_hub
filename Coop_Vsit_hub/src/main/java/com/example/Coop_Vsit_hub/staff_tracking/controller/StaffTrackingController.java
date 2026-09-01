package com.example.coop_vsit_hub.staff_tracking.controller;

import com.example.coop_vsit_hub.individual_guest_management.dto.IndividualGuestSummaryResponse;
import com.example.coop_vsit_hub.organization_management.dto.OrganizationSummaryResponse;
import com.example.coop_vsit_hub.staff_tracking.dto.TrackedStaffOverviewResponse;
import com.example.coop_vsit_hub.staff_tracking.service.StaffTrackingService;
import com.example.coop_vsit_hub.visit_management.dto.VisitSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Staff Personal Tracker API", description = "Endpoints for staff members to track their own meetings, visitors, and linked organizations/guests")
public class StaffTrackingController {

    private final StaffTrackingService staffTrackingService;

    @GetMapping("/overview")
    @Operation(summary = "Get Staff Tracking Overview", description = "Returns summary statistics, matched visits, organizations, and individual guests for the current staff user.")
    public ResponseEntity<TrackedStaffOverviewResponse> getOverview(
            Principal principal,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = principal != null ? principal.getName() : (userDetails != null ? userDetails.getUsername() : "admin");
        TrackedStaffOverviewResponse response = staffTrackingService.getStaffTrackedOverview(username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-visits")
    @Operation(summary = "Get Staff Tracked Visits", description = "Returns visits matched to the current staff user's room bookings or sponsorships.")
    public ResponseEntity<List<VisitSummaryResponse>> getMyVisits(
            Principal principal,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = principal != null ? principal.getName() : (userDetails != null ? userDetails.getUsername() : "admin");
        List<VisitSummaryResponse> visits = staffTrackingService.getStaffTrackedVisits(username);
        return ResponseEntity.ok(visits);
    }

    @GetMapping("/my-organizations")
    @Operation(summary = "Get Staff Tracked Organizations", description = "Returns organizations linked to the current staff user's meetings and visits.")
    public ResponseEntity<List<OrganizationSummaryResponse>> getMyOrganizations(
            Principal principal,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = principal != null ? principal.getName() : (userDetails != null ? userDetails.getUsername() : "admin");
        List<OrganizationSummaryResponse> orgs = staffTrackingService.getStaffTrackedOrganizations(username);
        return ResponseEntity.ok(orgs);
    }

    @GetMapping("/my-guests")
    @Operation(summary = "Get Staff Tracked Individual Guests", description = "Returns individual guests linked to the current staff user's meetings and visits.")
    public ResponseEntity<List<IndividualGuestSummaryResponse>> getMyGuests(
            Principal principal,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = principal != null ? principal.getName() : (userDetails != null ? userDetails.getUsername() : "admin");
        List<IndividualGuestSummaryResponse> guests = staffTrackingService.getStaffTrackedGuests(username);
        return ResponseEntity.ok(guests);
    }

    @PostMapping("/link-booking")
    @Operation(summary = "Explicitly Link Room Booking to Visit", description = "Allows staff to connect a room booking to a visit entry.")
    public ResponseEntity<Boolean> linkBooking(
            @RequestBody Map<String, UUID> request,
            Principal principal,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID bookingId = request.get("bookingId");
        UUID visitId = request.get("visitId");
        String username = principal != null ? principal.getName() : (userDetails != null ? userDetails.getUsername() : "admin");

        if (bookingId == null || visitId == null) {
            return ResponseEntity.badRequest().body(false);
        }

        boolean linked = staffTrackingService.linkBookingToVisit(bookingId, visitId, username);
        return ResponseEntity.ok(linked);
    }
}
