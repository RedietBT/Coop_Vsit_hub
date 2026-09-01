package com.example.coop_vsit_hub.staff_tracking.controller;

import com.example.coop_vsit_hub.common.dto.ApiResponse;
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
    public ResponseEntity<ApiResponse<TrackedStaffOverviewResponse>> getOverview(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "admin";
        TrackedStaffOverviewResponse response = staffTrackingService.getStaffTrackedOverview(username);
        return ResponseEntity.ok(ApiResponse.success(response, "Staff tracking overview loaded successfully"));
    }

    @GetMapping("/my-visits")
    @Operation(summary = "Get Staff Tracked Visits", description = "Returns visits matched to the current staff user's room bookings or sponsorships.")
    public ResponseEntity<ApiResponse<List<VisitSummaryResponse>>> getMyVisits(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "admin";
        List<VisitSummaryResponse> visits = staffTrackingService.getStaffTrackedVisits(username);
        return ResponseEntity.ok(ApiResponse.success(visits, "Tracked visits loaded successfully"));
    }

    @GetMapping("/my-organizations")
    @Operation(summary = "Get Staff Tracked Organizations", description = "Returns organizations linked to the current staff user's meetings and visits.")
    public ResponseEntity<ApiResponse<List<OrganizationSummaryResponse>>> getMyOrganizations(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "admin";
        List<OrganizationSummaryResponse> orgs = staffTrackingService.getStaffTrackedOrganizations(username);
        return ResponseEntity.ok(ApiResponse.success(orgs, "Tracked organizations loaded successfully"));
    }

    @GetMapping("/my-guests")
    @Operation(summary = "Get Staff Tracked Individual Guests", description = "Returns individual guests linked to the current staff user's meetings and visits.")
    public ResponseEntity<ApiResponse<List<IndividualGuestSummaryResponse>>> getMyGuests(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "admin";
        List<IndividualGuestSummaryResponse> guests = staffTrackingService.getStaffTrackedGuests(username);
        return ResponseEntity.ok(ApiResponse.success(guests, "Tracked guests loaded successfully"));
    }

    @PostMapping("/link-booking")
    @Operation(summary = "Explicitly Link Room Booking to Visit", description = "Allows staff to connect a room booking to a visit entry.")
    public ResponseEntity<ApiResponse<Boolean>> linkBooking(
            @RequestBody Map<String, UUID> request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID bookingId = request.get("bookingId");
        UUID visitId = request.get("visitId");
        String username = userDetails != null ? userDetails.getUsername() : "admin";

        if (bookingId == null || visitId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("bookingId and visitId are required"));
        }

        boolean linked = staffTrackingService.linkBookingToVisit(bookingId, visitId, username);
        return ResponseEntity.ok(ApiResponse.success(linked, linked ? "Successfully linked booking to visit" : "Failed to link booking"));
    }
}
