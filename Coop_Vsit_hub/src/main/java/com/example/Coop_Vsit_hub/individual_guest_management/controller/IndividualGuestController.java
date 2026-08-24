package com.example.coop_vsit_hub.individual_guest_management.controller;

import com.example.coop_vsit_hub.individual_guest_management.dto.*;
import com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType;
import com.example.coop_vsit_hub.individual_guest_management.enums.VipTier;
import com.example.coop_vsit_hub.individual_guest_management.service.IndividualGuestService;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

/**
 * REST API Controller for VIP & Individual Guest Intelligence.
 */
@RestController
@RequestMapping("/api/v1/guests")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "3.1 Individual Guests Intelligence", description = "VIP visitor profiles, government ID/passport verification, and relationship scoring")
@SecurityRequirement(name = "bearerAuth")
public class IndividualGuestController {

    private final IndividualGuestService guestService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List & Filter Individual Guests", description = "Search guest records with multi-criteria filtering, VIP tiers, and pagination.")
    public ResponseEntity<PageResponse<IndividualGuestSummaryResponse>> getAllIndividualGuests(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) VipTier vipTier,
            @RequestParam(required = false) IdentityDocumentType idType,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String affiliation,
            @RequestParam(required = false) Integer minScore,
            @RequestParam(required = false) Integer maxScore,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return ResponseEntity.ok(guestService.getAllIndividualGuests(
                search, vipTier, idType, country, affiliation, minScore, maxScore,
                page, size, sortBy, sortDirection
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Fetch Detailed Guest Profile", description = "Retrieve full individual guest profile including identity credentials, past visit history, and opportunity pipeline.")
    public ResponseEntity<IndividualGuestDetailResponse> getIndividualGuestById(@PathVariable UUID id) {
        return ResponseEntity.ok(guestService.getIndividualGuestById(id));
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Individual Guest Portfolio Metrics", description = "Aggregated intelligence metrics across VIP tiers, nationality/residence, and average relationship scores.")
    public ResponseEntity<IndividualGuestStatsResponse> getIndividualGuestStats() {
        return ResponseEntity.ok(guestService.getIndividualGuestStats());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).RELATIONSHIP_MANAGER, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Register New VIP / Individual Guest", description = "Adds a new VIP guest or independent consultant to the intelligence register.")
    public ResponseEntity<IndividualGuestDetailResponse> createIndividualGuest(
            @Valid @RequestBody CreateIndividualGuestRequest request,
            Principal principal
    ) {
        String createdBy = principal != null ? principal.getName() : "RM";
        IndividualGuestDetailResponse response = guestService.createIndividualGuest(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).RELATIONSHIP_MANAGER, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Update Individual Guest Profile", description = "Updates guest contact details, VIP tier, relationship health score, and security ID credentials.")
    public ResponseEntity<IndividualGuestDetailResponse> updateIndividualGuest(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIndividualGuestRequest request,
            Principal principal
    ) {
        String updatedBy = principal != null ? principal.getName() : "RM";
        return ResponseEntity.ok(guestService.updateIndividualGuest(id, request, updatedBy));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Delete Individual Guest Profile", description = "Removes guest profile from the register (safeguarded if active or historic visit records exist).")
    public ResponseEntity<Map<String, String>> deleteIndividualGuest(
            @PathVariable UUID id,
            Principal principal
    ) {
        String deletedBy = principal != null ? principal.getName() : "ADMIN";
        guestService.deleteIndividualGuest(id, deletedBy);
        return ResponseEntity.ok(Map.of(
                "message", "Individual guest record successfully deleted.",
                "deletedGuestId", id.toString()
        ));
    }
}
