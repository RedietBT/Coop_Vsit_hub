package com.example.coop_vsit_hub.visit_management.controller;

import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.visit_management.dto.*;
import com.example.coop_vsit_hub.visit_management.enums.GuestCategory;
import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.enums.VisitType;
import com.example.coop_vsit_hub.visit_management.service.VisitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * REST API Controller for Visit Lifecycle Management.
 * Handles visit creation, approvals, security check-in/out, and executive metrics.
 */
@RestController
@RequestMapping("/api/v1/visits")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "2. Visits Lifecycle Management", description = "Executive visit requests, approvals, room conflict checks, and state transitions")
@SecurityRequirement(name = "bearerAuth")
public class VisitController {

    private final VisitService visitService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List All Visits (Search, Filter, & Pagination)", description = "Retrieve paginated visit requests with dynamic multi-criteria search and filters.")
    public ResponseEntity<PageResponse<VisitSummaryResponse>> getAllVisits(
            @Parameter(description = "Keyword search across code, title, room, badge, guest names, organization")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by lifecycle status")
            @RequestParam(required = false) VisitStatus status,
            @Parameter(description = "Filter by priority level")
            @RequestParam(required = false) VisitPriority priority,
            @Parameter(description = "Filter by visit type (INTERNAL, EXTERNAL, VIP_DELEGATION)")
            @RequestParam(required = false) VisitType visitType,
            @Parameter(description = "Filter by guest category (ORGANIZATION or INDIVIDUAL)")
            @RequestParam(required = false) GuestCategory guestCategory,
            @Parameter(description = "Filter by requesting department")
            @RequestParam(required = false) String department,
            @Parameter(description = "Filter by meeting room location")
            @RequestParam(required = false) String locationRoom,
            @Parameter(description = "Filter by requester staff UUID")
            @RequestParam(required = false) UUID requesterId,
            @Parameter(description = "Filter by sponsor executive UUID")
            @RequestParam(required = false) UUID sponsorId,
            @Parameter(description = "Filter by approver staff UUID")
            @RequestParam(required = false) UUID approverId,
            @Parameter(description = "Start date range filter (ISO-8601 UTC)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @Parameter(description = "End date range filter (ISO-8601 UTC)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "scheduledStartTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return ResponseEntity.ok(visitService.getAllVisits(
                search, status, priority, visitType, guestCategory, department, locationRoom,
                requesterId, sponsorId, approverId, fromDate, toDate, page, size, sortBy, sortDirection
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Fetch Detailed Visit Record by ID", description = "Fetch comprehensive visit details including guest contacts, sponsor, room, and status.")
    public ResponseEntity<VisitDetailResponse> getVisitById(@PathVariable UUID id) {
        return ResponseEntity.ok(visitService.getVisitById(id));
    }

    @GetMapping("/code/{visitCode}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Fetch Visit by Human-Readable Code", description = "Lookup a visit by its formatted reference identifier (e.g. VIS-2026-0001).")
    public ResponseEntity<VisitDetailResponse> getVisitByCode(@PathVariable String visitCode) {
        return ResponseEntity.ok(visitService.getVisitByCode(visitCode));
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Executive Visit Metrics & KPIs", description = "Retrieve aggregated financial pipeline ($M), status distribution, and upcoming visit counts.")
    public ResponseEntity<VisitStatsResponse> getVisitStatistics() {
        return ResponseEntity.ok(visitService.getVisitStatistics());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_RELATIONSHIP_MANAGER', 'ROLE_ADMIN')")
    @Operation(summary = "Create New Visit Request / Draft", description = "Submits a new executive visit request or saves a draft. Auto-generates human-readable VIS code.")
    public ResponseEntity<VisitDetailResponse> createVisit(
            @Valid @RequestBody CreateVisitRequest request,
            Principal principal
    ) {
        String requesterUsername = principal != null ? principal.getName() : "RM";
        VisitDetailResponse response = visitService.createVisit(request, requesterUsername);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RELATIONSHIP_MANAGER', 'ROLE_ADMIN')")
    @Operation(summary = "Update Visit Details", description = "Modifies visit details. Allowed only while visit is in DRAFT or SUBMITTED state.")
    public ResponseEntity<VisitDetailResponse> updateVisit(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVisitRequest request,
            Principal principal
    ) {
        String requesterUsername = principal != null ? principal.getName() : "RM";
        return ResponseEntity.ok(visitService.updateVisit(id, request, requesterUsername));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_APPROVER', 'ROLE_ADMIN', 'ROLE_SECURITY_DESK', 'ROLE_RELATIONSHIP_MANAGER')")
    @Operation(summary = "Transition Visit Status", description = "Approve, reject, schedule, or cancel visit with decision notes and cancellation reason.")
    public ResponseEntity<VisitDetailResponse> transitionVisitStatus(
            @PathVariable UUID id,
            @Valid @RequestBody VisitStatusTransitionRequest request,
            Principal principal
    ) {
        String approverUsername = principal != null ? principal.getName() : "APPROVER";
        return ResponseEntity.ok(visitService.transitionVisitStatus(id, request, approverUsername));
    }

    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasAnyAuthority('ROLE_SECURITY_DESK', 'ROLE_ADMIN')")
    @Operation(summary = "Security Desk Visitor Check-In", description = "Records visitor arrival timestamp, verifies ID, auto-generates badge (COOPVYYYYMM0000), and transitions state to IN_PROGRESS.")
    public ResponseEntity<VisitDetailResponse> checkInVisitor(
            @PathVariable UUID id,
            @RequestBody(required = false) CheckInRequest request,
            Principal principal
    ) {
        String securityUsername = principal != null ? principal.getName() : "SECURITY";
        CheckInRequest req = request != null ? request : new CheckInRequest();
        return ResponseEntity.ok(visitService.checkInVisitor(id, req, securityUsername));
    }

    @PostMapping("/{id}/check-out")
    @PreAuthorize("hasAnyAuthority('ROLE_SECURITY_DESK', 'ROLE_ADMIN')")
    @Operation(summary = "Security Desk Visitor Check-Out", description = "Records visitor departure timestamp and marks visit as COMPLETED.")
    public ResponseEntity<VisitDetailResponse> checkOutVisitor(
            @PathVariable UUID id,
            @RequestBody(required = false) CheckOutRequest request,
            Principal principal
    ) {
        String securityUsername = principal != null ? principal.getName() : "SECURITY";
        CheckOutRequest req = request != null ? request : new CheckOutRequest();
        return ResponseEntity.ok(visitService.checkOutVisitor(id, req, securityUsername));
    }

    @PutMapping("/{id}/visitor")
    @PreAuthorize("hasAnyAuthority('ROLE_SECURITY_DESK', 'ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER')")
    @Operation(summary = "Front Desk / Lobby Visitor Registration & Demographics", description = "Updates optional visitor demographic details (First/Last name, ID, phone, dates, address).")
    public ResponseEntity<VisitDetailResponse> updateVisitorDetails(
            @PathVariable UUID id,
            @RequestBody UpdateVisitorDetailsRequest request,
            Principal principal
    ) {
        String securityUsername = principal != null ? principal.getName() : "SECURITY";
        return ResponseEntity.ok(visitService.updateVisitorDetails(id, request, securityUsername));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RELATIONSHIP_MANAGER', 'ROLE_ADMIN')")
    @Operation(summary = "Delete / Cancel Visit", description = "Removes an unapproved visit request from the register.")
    public ResponseEntity<Map<String, String>> deleteVisit(
            @PathVariable UUID id,
            Principal principal
    ) {
        String authenticatedUsername = principal != null ? principal.getName() : "USER";
        visitService.deleteVisit(id, authenticatedUsername);
        return ResponseEntity.ok(Map.of(
                "message", "Visit request successfully deleted.",
                "deletedVisitId", id.toString()
        ));
    }

    @GetMapping("/room-slots")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get Privacy-Safe Room Booked Slots", description = "Returns reserved time slots for calendar view without exposing employee identities.")
    public ResponseEntity<java.util.List<RoomSlotResponse>> getRoomSlots(
            @RequestParam String roomName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate
    ) {
        return ResponseEntity.ok(visitService.getRoomAvailabilitySlots(roomName, fromDate, toDate));
    }

    @GetMapping("/room-bookings")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Super Admin Room Bookings Roster", description = "Returns complete detailed booking roster with staff identity, email, and meeting purpose.")
    public ResponseEntity<java.util.List<AdminRoomBookingResponse>> getAdminRoomBookings(
            @RequestParam(required = false) String roomName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate
    ) {
        return ResponseEntity.ok(visitService.getAdminRoomBookings(roomName, fromDate, toDate));
    }
}
