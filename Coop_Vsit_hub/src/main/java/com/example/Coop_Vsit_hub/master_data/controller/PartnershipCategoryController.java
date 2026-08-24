package com.example.coop_vsit_hub.master_data.controller;

import com.example.coop_vsit_hub.master_data.dto.CreatePartnershipCategoryRequest;
import com.example.coop_vsit_hub.master_data.dto.PartnershipCategoryDto;
import com.example.coop_vsit_hub.master_data.dto.UpdatePartnershipCategoryRequest;
import com.example.coop_vsit_hub.master_data.service.MasterDataService;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/partnership-categories")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "6.1 Master Data - Partnership Categories", description = "Dynamic partnership classification management")
@SecurityRequirement(name = "bearerAuth")
public class PartnershipCategoryController {

    private final MasterDataService masterDataService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List All Partnership Categories", description = "Retrieve all partnership categories for dropdowns and filters.")
    public ResponseEntity<List<PartnershipCategoryDto>> getAllCategories(
            @RequestParam(defaultValue = "true") boolean activeOnly
    ) {
        return ResponseEntity.ok(masterDataService.getAllCategories(activeOnly));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get Category by ID", description = "Fetch single category metadata.")
    public ResponseEntity<PartnershipCategoryDto> getCategoryById(@PathVariable UUID id) {
        return ResponseEntity.ok(masterDataService.getCategoryById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Create Partnership Category (Admin)", description = "Admin creates a new partner classification category.")
    public ResponseEntity<PartnershipCategoryDto> createCategory(@Valid @RequestBody CreatePartnershipCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.createCategory(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Update Partnership Category (Admin)", description = "Admin updates category name, description, or active status.")
    public ResponseEntity<PartnershipCategoryDto> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePartnershipCategoryRequest request
    ) {
        return ResponseEntity.ok(masterDataService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Delete Partnership Category (Admin)", description = "Admin removes a partnership category.")
    public ResponseEntity<Map<String, String>> deleteCategory(@PathVariable UUID id) {
        masterDataService.deleteCategory(id);
        return ResponseEntity.ok(Map.of(
                "message", "Partnership category successfully deleted.",
                "deletedId", id.toString()
        ));
    }
}
