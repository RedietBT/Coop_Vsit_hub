package com.example.coop_vsit_hub.visit_management.service;

import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import com.example.coop_vsit_hub.visit_management.dto.*;
import com.example.coop_vsit_hub.visit_management.enums.GuestCategory;
import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.enums.VisitType;

import java.time.Instant;
import java.util.UUID;

/**
 * Service contract for Visit Lifecycle Management.
 */
public interface VisitService {

    /**
     * Search and filter visits with dynamic criteria and pagination.
     */
    PageResponse<VisitSummaryResponse> getAllVisits(
            String search,
            VisitStatus status,
            VisitPriority priority,
            VisitType visitType,
            GuestCategory guestCategory,
            String department,
            String locationRoom,
            UUID requesterId,
            UUID sponsorId,
            UUID approverId,
            Instant fromDate,
            Instant toDate,
            int page,
            int size,
            String sortBy,
            String sortDirection
    );

    /**
     * Retrieve full visit details by UUID.
     */
    VisitDetailResponse getVisitById(UUID id);

    /**
     * Retrieve full visit details by human-readable Visit Code (e.g. VIS-202608-00001).
     */
    VisitDetailResponse getVisitByCode(String visitCode);

    /**
     * Compute executive statistics and financial pipeline metrics.
     */
    VisitStatsResponse getVisitStatistics();

    /**
     * Create a new visit request or save as draft.
     */
    VisitDetailResponse createVisit(CreateVisitRequest request, String requesterUsername);

    /**
     * Update visit details (allowed while in DRAFT or SUBMITTED state).
     */
    VisitDetailResponse updateVisit(UUID id, UpdateVisitRequest request, String requesterUsername);

    /**
     * Front desk / Lobby visitor demographic edit & registration.
     */
    VisitDetailResponse updateVisitorDetails(UUID id, UpdateVisitorDetailsRequest request, String securityUsername);

    /**
     * Transition visit lifecycle state (APPROVED, REJECTED, UNDER_REVIEW, SCHEDULED, CANCELLED).
     */
    VisitDetailResponse transitionVisitStatus(UUID id, VisitStatusTransitionRequest request, String approverUsername);

    /**
     * Front desk visitor check-in with automatic sequential badge generation (COOPVYYYYMM0000).
     */
    VisitDetailResponse checkInVisitor(UUID id, CheckInRequest request, String securityUsername);

    /**
     * Front desk visitor check-out (moves status to COMPLETED).
     */
    VisitDetailResponse checkOutVisitor(UUID id, CheckOutRequest request, String securityUsername);

    /**
     * Delete or cancel unapproved visit.
     */
    void deleteVisit(UUID id, String authenticatedUsername);

    /**
     * Legacy internal mapping helper if needed.
     */
    VisitDetailResponse bookPublicVisit(PublicBookingRequest request);

    /**
     * Retrieve privacy-safe booked time slots for a meeting room in a given time window.
     */
    java.util.List<RoomSlotResponse> getRoomAvailabilitySlots(String roomName, Instant fromDate, Instant toDate);

    /**
     * Retrieve comprehensive room booking audit roster for Super Admin dashboard.
     */
    java.util.List<AdminRoomBookingResponse> getAdminRoomBookings(String roomName, Instant fromDate, Instant toDate);
}
