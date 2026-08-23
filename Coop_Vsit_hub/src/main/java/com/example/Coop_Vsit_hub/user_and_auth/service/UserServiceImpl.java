package com.example.coop_vsit_hub.user_and_auth.service;

import com.example.coop_vsit_hub.user_and_auth.dto.*;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditEventType;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditStatus;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.user_and_auth.model.Role;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.RefreshTokenRepository;
import com.example.coop_vsit_hub.user_and_auth.repository.RoleRepository;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
import com.example.coop_vsit_hub.user_and_auth.repository.UserSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of administrative user management workflows.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLoggerService auditLoggerService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserDetailResponse> getAllUsers(
            String search,
            String department,
            RoleName role,
            Boolean isEnabled,
            Boolean isAccountNonLocked,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        log.info("Fetching users with search='{}', department='{}', role={}, isEnabled={}, isAccountNonLocked={}, page={}, size={}",
                search, department, role, isEnabled, isAccountNonLocked, page, size);

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortProperty = (sortBy != null && !sortBy.isBlank()) ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProperty));

        Specification<User> spec = UserSpecification.filterUsers(search, department, role, isEnabled, isAccountNonLocked);
        Page<User> userPage = userRepository.findAll(spec, pageable);

        Page<UserDetailResponse> dtoPage = userPage.map(UserDetailResponse::from);
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetailResponse getUserById(UUID id) {
        log.info("Fetching user details for id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));
        return UserDetailResponse.from(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserStatsResponse getUserStatistics() {
        log.info("Computing user statistics & system aggregates");

        long total = userRepository.count();
        long active = userRepository.countByIsEnabled(true);
        long inactive = userRepository.countByIsEnabled(false);
        long locked = userRepository.countByIsAccountNonLocked(false);
        long unverified = userRepository.countByIsEmailVerified(false);
        long mustChangePassword = userRepository.countByMustChangePassword(true);

        Map<String, Long> roleDistribution = new LinkedHashMap<>();
        for (Object[] row : userRepository.countUsersByRole()) {
            RoleName roleName = (RoleName) row[0];
            Long count = (Long) row[1];
            roleDistribution.put(roleName.name(), count);
        }

        Map<String, Long> departmentDistribution = new LinkedHashMap<>();
        for (Object[] row : userRepository.countUsersByDepartment()) {
            String dept = (String) row[0];
            Long count = (Long) row[1];
            departmentDistribution.put(dept, count);
        }

        return UserStatsResponse.builder()
                .totalUsers(total)
                .activeUsers(active)
                .inactiveUsers(inactive)
                .lockedUsers(locked)
                .unverifiedUsers(unverified)
                .mustChangePasswordUsers(mustChangePassword)
                .usersByRole(roleDistribution)
                .usersByDepartment(departmentDistribution)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        log.info("Fetching all system roles");
        return roleRepository.findAll().stream()
                .sorted(Comparator.comparing(r -> r.getName().name()))
                .map(RoleResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserDetailResponse updateUser(UUID id, UpdateUserRequest request, String adminUsername) {
        log.info("Administrator '{}' updating user profile for ID: {}", adminUsername, id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        String newEmail = request.getEmail().trim().toLowerCase();
        if (!user.getEmail().equalsIgnoreCase(newEmail)) {
            if (userRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Email '" + newEmail + "' is already registered to another user.");
            }
            user.setEmail(newEmail);
        }

        user.setFirstName(request.getFirstName().trim());
        user.setMiddleName(request.getMiddleName() != null && !request.getMiddleName().isBlank() ? request.getMiddleName().trim() : null);
        user.setLastName(request.getLastName().trim());
        user.setDepartment(request.getDepartment() != null ? request.getDepartment().trim() : null);
        user.setPhoneNumber(request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank() ? request.getPhoneNumber().trim() : null);

        User saved = userRepository.save(user);

        auditLoggerService.logEvent(
                saved,
                saved.getUsername(),
                AuditEventType.USER_UPDATED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "ADMIN_PANEL",
                String.format("User profile updated by admin '%s'", adminUsername)
        );

        return UserDetailResponse.from(saved);
    }

    @Override
    @Transactional
    public UserDetailResponse updateUserRoles(UUID id, UpdateUserRolesRequest request, String adminUsername) {
        log.info("Administrator '{}' updating roles for user ID: {} to: {}", adminUsername, id, request.getRoles());

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        // Prevent admin from removing their own admin role
        if (user.getUsername().equalsIgnoreCase(adminUsername) && !request.getRoles().contains(RoleName.ROLE_ADMIN)) {
            throw new IllegalArgumentException("You cannot remove ROLE_ADMIN from your own active administrator account.");
        }

        Set<Role> resolvedRoles = new HashSet<>();
        for (RoleName roleName : request.getRoles()) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalArgumentException("Role not recognized in system: " + roleName));
            resolvedRoles.add(role);
        }

        user.setRoles(resolvedRoles);
        User saved = userRepository.save(user);

        // Revoke active sessions so user must re-authenticate with updated claims
        refreshTokenRepository.revokeAllUserTokens(saved);

        auditLoggerService.logEvent(
                saved,
                saved.getUsername(),
                AuditEventType.USER_ROLES_UPDATED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "ADMIN_PANEL",
                String.format("User roles updated to %s by admin '%s'", request.getRoles(), adminUsername)
        );

        return UserDetailResponse.from(saved);
    }

    @Override
    @Transactional
    public UserDetailResponse updateUserStatus(UUID id, UpdateUserStatusRequest request, String adminUsername) {
        log.info("Administrator '{}' updating status for user ID: {}", adminUsername, id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        // Self-lock / Self-disable prevention
        if (user.getUsername().equalsIgnoreCase(adminUsername)) {
            if (request.getIsEnabled() != null && !request.getIsEnabled()) {
                throw new IllegalArgumentException("You cannot disable your own active administrator account.");
            }
            if (request.getIsAccountNonLocked() != null && !request.getIsAccountNonLocked()) {
                throw new IllegalArgumentException("You cannot lock your own active administrator account.");
            }
        }

        if (request.getIsEnabled() != null) {
            user.setEnabled(request.getIsEnabled());
            if (!request.getIsEnabled()) {
                // Revoke tokens if account is disabled
                refreshTokenRepository.revokeAllUserTokens(user);
            }
        }

        if (request.getIsAccountNonLocked() != null) {
            user.setAccountNonLocked(request.getIsAccountNonLocked());
            if (request.getIsAccountNonLocked()) {
                // If unlocking account, reset failed login attempts and lock time
                user.setFailedLoginAttempts(0);
                user.setLockTime(null);
            }
        }

        User saved = userRepository.save(user);

        auditLoggerService.logEvent(
                saved,
                saved.getUsername(),
                AuditEventType.USER_STATUS_UPDATED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "ADMIN_PANEL",
                String.format("User status updated (enabled: %s, non-locked: %s) by admin '%s'",
                        saved.isEnabled(), saved.isAccountNonLocked(), adminUsername)
        );

        return UserDetailResponse.from(saved);
    }

    @Override
    @Transactional
    public void deleteUser(UUID id, String adminUsername) {
        log.info("Administrator '{}' attempting to delete user ID: {}", adminUsername, id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        // Prevent administrator from deleting their own active account
        if (user.getUsername().equalsIgnoreCase(adminUsername)) {
            throw new IllegalArgumentException("You cannot delete your own active administrator account.");
        }

        // Revoke active sessions first
        refreshTokenRepository.revokeAllUserTokens(user);

        // Delete user
        userRepository.delete(user);

        auditLoggerService.logEvent(
                null,
                user.getUsername(),
                AuditEventType.USER_DELETED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "ADMIN_PANEL",
                String.format("User '%s' (ID: %s) was permanently deleted by admin '%s'",
                        user.getUsername(), id, adminUsername)
        );

        log.info("User '{}' (ID: {}) successfully deleted by admin '{}'", user.getUsername(), id, adminUsername);
    }
}
