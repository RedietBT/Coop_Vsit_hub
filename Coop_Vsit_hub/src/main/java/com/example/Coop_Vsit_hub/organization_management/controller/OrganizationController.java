package com.example.coop_vsit_hub.organization_management.controller;

import com.example.coop_vsit_hub.organization_management.dto.*;
import com.example.coop_vsit_hub.organization_management.service.OrganizationService;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
 * REST API Controller for Guest & Partner Organizations Intelligence.
 */
@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "3. Organizations Intelligence", description = "Guest corporate partner profiling, relationship health scoring, and portfolio analytics")
@SecurityRequirement(name = "bearerAuth")
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List Guest Organizations (Search & Filter)", description = "Retrieve paginated list of guest and partner organizations with dynamic multi-field filtering.")
    public ResponseEntity<PageResponse<OrganizationSummaryResponse>> getAllOrganizations(
            @Parameter(description = "Keyword search across name, category, country, contact person, industry")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by category (e.g. Strategic Partners, Regulators, Fintech)")
            @RequestParam(required = false) String category,
            @Parameter(description = "Filter by market country of origin")
            @RequestParam(required = false) String marketCountry,
            @Parameter(description = "Filter by industry sector")
            @RequestParam(required = false) String industrySector,
            @Parameter(description = "Minimum relationship score (0-100)")
            @RequestParam(required = false) Integer minScore,
            @Parameter(description = "Maximum relationship score (0-100)")
            @RequestParam(required = false) Integer maxScore,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "relationshipScore") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return ResponseEntity.ok(organizationService.getAllOrganizations(
                search, category, marketCountry, industrySector, minScore, maxScore, page, size, sortBy, sortDirection
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Fetch Organization by ID", description = "Fetch complete organization intelligence profile including visit history and active pipeline financial value.")
    public ResponseEntity<OrganizationDetailResponse> getOrganizationById(@PathVariable UUID id) {
        return ResponseEntity.ok(organizationService.getOrganizationById(id));
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Portfolio Intelligence & Analytics", description = "Retrieve aggregated portfolio metrics: average relationship score, category breakdown, and country distribution.")
    public ResponseEntity<OrganizationPortfolioStatsResponse> getPortfolioStatistics() {
        return ResponseEntity.ok(organizationService.getPortfolioStatistics());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).RELATIONSHIP_MANAGER, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Register New Guest Organization", description = "Registers a new partner or guest organization with relationship score and contact metadata.")
    public ResponseEntity<OrganizationDetailResponse> createOrganization(
            @Valid @RequestBody CreateOrganizationRequest request,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : "STAFF";
        OrganizationDetailResponse response = organizationService.createOrganization(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).RELATIONSHIP_MANAGER, T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Update Organization Profile", description = "Updates partner organization profile, category, relationship score, and executive contacts.")
    public ResponseEntity<OrganizationDetailResponse> updateOrganization(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrganizationRequest request,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : "STAFF";
        return ResponseEntity.ok(organizationService.updateOrganization(id, request, username));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Delete Organization", description = "Removes an organization from the register (safeguarded against deleting organizations with active visits).")
    public ResponseEntity<Map<String, String>> deleteOrganization(
            @PathVariable UUID id,
            Principal principal
    ) {
        String username = principal != null ? principal.getName() : "ADMIN";
        organizationService.deleteOrganization(id, username);
        return ResponseEntity.ok(Map.of(
                "message", "Organization successfully deleted.",
                "deletedOrganizationId", id.toString()
        ));
    }
}
