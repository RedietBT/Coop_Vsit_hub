package com.example.coop_vsit_hub.user_and_auth.dto;

import com.example.coop_vsit_hub.user_and_auth.model.Role;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailResponse {

    private UUID id;
    private String username;
    private String email;
    private String firstName;
    private String middleName;
    private String lastName;
    private String fullName;
    private String department;
    private String phoneNumber;

    @JsonProperty("isEnabled")
    private boolean isEnabled;

    @JsonProperty("isAccountNonLocked")
    private boolean isAccountNonLocked;

    @JsonProperty("isEmailVerified")
    private boolean isEmailVerified;

    private boolean mustChangePassword;
    private int failedLoginAttempts;
    private Instant lockTime;
    private Instant passwordChangedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private Set<String> roles;

    @JsonProperty("isEnabled")
    public boolean isEnabled() {
        return isEnabled;
    }

    @JsonProperty("isEnabled")
    public void setEnabled(boolean isEnabled) {
        this.isEnabled = isEnabled;
    }

    @JsonProperty("enabled")
    public boolean getEnabled() {
        return isEnabled;
    }

    @JsonProperty("isAccountNonLocked")
    public boolean isAccountNonLocked() {
        return isAccountNonLocked;
    }

    @JsonProperty("isAccountNonLocked")
    public void setAccountNonLocked(boolean isAccountNonLocked) {
        this.isAccountNonLocked = isAccountNonLocked;
    }

    @JsonProperty("accountNonLocked")
    public boolean getAccountNonLocked() {
        return isAccountNonLocked;
    }

    @JsonProperty("isEmailVerified")
    public boolean isEmailVerified() {
        return isEmailVerified;
    }

    @JsonProperty("isEmailVerified")
    public void setEmailVerified(boolean isEmailVerified) {
        this.isEmailVerified = isEmailVerified;
    }

    @JsonProperty("emailVerified")
    public boolean getEmailVerified() {
        return isEmailVerified;
    }

    public static UserDetailResponse from(User user) {
        return UserDetailResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .middleName(user.getMiddleName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .department(user.getDepartment())
                .phoneNumber(user.getPhoneNumber())
                .isEnabled(user.isEnabled())
                .isAccountNonLocked(user.isAccountNonLocked())
                .isEmailVerified(user.isEmailVerified())
                .mustChangePassword(user.isMustChangePassword())
                .failedLoginAttempts(user.getFailedLoginAttempts())
                .lockTime(user.getLockTime())
                .passwordChangedAt(user.getPasswordChangedAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .map(Enum::name)
                        .collect(Collectors.toSet()))
                .build();
    }
}
