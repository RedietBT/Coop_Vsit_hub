package com.example.coop_vsit_hub.user_and_auth.dto;

import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRolesRequest {

    @JsonAlias({"roleNames", "roles"})
    @JsonProperty("roles")
    @Schema(example = "[\"ROLE_RELATIONSHIP_MANAGER\", \"ROLE_DIRECTOR\"]")
    private Set<RoleName> roles;

    @JsonAlias({"roles", "roleNames"})
    @JsonProperty("roleNames")
    private Set<RoleName> roleNames;

    public Set<RoleName> getRoles() {
        if (roles != null && !roles.isEmpty()) {
            return roles;
        }
        return roleNames;
    }
}
