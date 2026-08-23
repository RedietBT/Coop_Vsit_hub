package com.example.coop_vsit_hub.user_and_auth.controller;

import com.example.coop_vsit_hub.user_and_auth.dto.*;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.user_and_auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Administrative User Management REST API Controller.
 * Restricted exclusively to system administrators (ROLE_ADMIN).
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "1. Authentication & User Management", description = "Bank staff authentication, registration, JWT refresh, and administrative user management")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Search & Filter Users (Paginated)", description = "Retrieve paginated staff users with multi-field search and criteria filters. Admin only.")
    public ResponseEntity<PageResponse<UserDetailResponse>> getAllUsers(
            @Parameter(description = "Search across names, username, email, phone")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by department")
            @RequestParam(required = false) String department,
            @Parameter(description = "Filter by assigned role")
            @RequestParam(required = false) RoleName role,
            @Parameter(description = "Filter by active status")
            @RequestParam(required = false) Boolean isEnabled,
            @Parameter(description = "Filter by account lock status")
            @RequestParam(required = false) Boolean isAccountNonLocked,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return ResponseEntity.ok(userService.getAllUsers(search, department, role, isEnabled, isAccountNonLocked, page, size, sortBy, sortDirection));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Get User by ID", description = "Retrieve comprehensive details for a specific user. Admin only.")
    public ResponseEntity<UserDetailResponse> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Get User Statistics & Counts", description = "Retrieve executive summary metrics and distributions across roles and departments. Admin only.")
    public ResponseEntity<UserStatsResponse> getUserStatistics() {
        return ResponseEntity.ok(userService.getUserStatistics());
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "List All System Roles", description = "Retrieve the catalog of predefined CoopBank authorization roles and descriptions. Admin only.")
    public ResponseEntity<List<RoleResponse>> getAllRoles() {
        return ResponseEntity.ok(userService.getAllRoles());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Update User Profile", description = "Update staff personal, email, and departmental details. Admin only.")
    public ResponseEntity<UserDetailResponse> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request,
            Principal principal
    ) {
        String adminUsername = principal != null ? principal.getName() : "ADMIN";
        return ResponseEntity.ok(userService.updateUser(id, request, adminUsername));
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Assign User Roles", description = "Assign or replace the set of authorization roles for a user. Revokes active tokens. Admin only.")
    public ResponseEntity<UserDetailResponse> updateUserRoles(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRolesRequest request,
            Principal principal
    ) {
        String adminUsername = principal != null ? principal.getName() : "ADMIN";
        return ResponseEntity.ok(userService.updateUserRoles(id, request, adminUsername));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Update Account Status / Unlock", description = "Enable/disable access or unlock locked accounts (resets failed login attempts). Admin only.")
    public ResponseEntity<UserDetailResponse> updateUserStatus(
            @PathVariable UUID id,
            @RequestBody UpdateUserStatusRequest request,
            Principal principal
    ) {
        String adminUsername = principal != null ? principal.getName() : "ADMIN";
        return ResponseEntity.ok(userService.updateUserStatus(id, request, adminUsername));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Delete User Account", description = "Permanently remove a user account with admin self-deletion safeguards. Admin only.")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable UUID id,
            Principal principal
    ) {
        String adminUsername = principal != null ? principal.getName() : "ADMIN";
        userService.deleteUser(id, adminUsername);
        return ResponseEntity.ok(Map.of(
                "message", "User account successfully deleted.",
                "deletedUserId", id.toString()
        ));
    }
}
