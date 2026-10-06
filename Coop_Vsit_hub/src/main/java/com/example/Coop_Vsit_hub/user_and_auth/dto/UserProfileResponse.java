package com.example.coop_vsit_hub.user_and_auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

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
}
