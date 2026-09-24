package com.example.coop_vsit_hub.user_and_auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserStatusRequest {

    @JsonProperty("isEnabled")
    @JsonAlias({"enabled", "isEnabled"})
    @Schema(description = "Enable or disable account access", example = "true")
    private Boolean isEnabled;

    @JsonProperty("isAccountNonLocked")
    @JsonAlias({"accountNonLocked", "isAccountNonLocked"})
    @Schema(description = "Unlock or lock account (setting true clears failed login counter)", example = "true")
    private Boolean isAccountNonLocked;

    @JsonProperty("isEnabled")
    public Boolean getIsEnabled() {
        return isEnabled;
    }

    @JsonProperty("isEnabled")
    public void setIsEnabled(Boolean isEnabled) {
        this.isEnabled = isEnabled;
    }

    @JsonProperty("enabled")
    public void setEnabled(Boolean enabled) {
        if (this.isEnabled == null) {
            this.isEnabled = enabled;
        }
    }

    @JsonProperty("isAccountNonLocked")
    public Boolean getIsAccountNonLocked() {
        return isAccountNonLocked;
    }

    @JsonProperty("isAccountNonLocked")
    public void setIsAccountNonLocked(Boolean isAccountNonLocked) {
        this.isAccountNonLocked = isAccountNonLocked;
    }

    @JsonProperty("accountNonLocked")
    public void setAccountNonLocked(Boolean accountNonLocked) {
        if (this.isAccountNonLocked == null) {
            this.isAccountNonLocked = accountNonLocked;
        }
    }
}
