package com.example.coop_vsit_hub.user_and_auth.service;

import com.example.coop_vsit_hub.user_and_auth.dto.*;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;

import java.util.List;
import java.util.UUID;

/**
 * Service contract for administrative user management operations.
 */
public interface UserService {

    /**
     * Retrieve paginated, searchable, and filterable list of users.
     */
    PageResponse<UserDetailResponse> getAllUsers(
            String search,
            String department,
            RoleName role,
            Boolean isEnabled,
            Boolean isAccountNonLocked,
            int page,
            int size,
            String sortBy,
            String sortDirection
    );

    /**
     * Retrieve user profile details by UUID.
     */
    UserDetailResponse getUserById(UUID id);

    /**
     * Get aggregate statistics and counts across all users.
     */
    UserStatsResponse getUserStatistics();

    /**
     * Get all available standard roles in the system.
     */
    List<RoleResponse> getAllRoles();

    /**
     * Update user profile information (names, department, phone).
     */
    UserDetailResponse updateUser(UUID id, UpdateUserRequest request, String adminUsername);

    /**
     * Update/assign roles for a user.
     */
    UserDetailResponse updateUserRoles(UUID id, UpdateUserRolesRequest request, String adminUsername);

    /**
     * Update account status (enable/disable, lock/unlock).
     */
    UserDetailResponse updateUserStatus(UUID id, UpdateUserStatusRequest request, String adminUsername);

    /**
     * Delete user from system with safeguards.
     */
    void deleteUser(UUID id, String adminUsername);
}
