package com.example.coop_vsit_hub.user_and_auth.controller;

import com.example.coop_vsit_hub.user_and_auth.service.ActiveDirectoryAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Admin-only diagnostics endpoint for Active Directory troubleshooting.
 * Allows admins to verify whether a user account exists in AD and check its status
 * without needing the user's password (uses the service bind account).
 *
 * ⚠️  This endpoint is restricted to ROLE_ADMIN. Do not expose publicly.
 */
@RestController
@RequestMapping("/api/v1/admin/ad")
@RequiredArgsConstructor
@Tag(name = "AD Diagnostics (Admin)", description = "Active Directory lookup & diagnostics — Admin only")
@SecurityRequirement(name = "bearerAuth")
public class AdDiagnosticsController {

    private final ActiveDirectoryAuthService adAuthService;

    /**
     * Looks up a staff member in Active Directory by email or sAMAccountName.
     * Uses the service bind account — no user password required.
     *
     * <p>Response includes:
     * <ul>
     *   <li>{@code found} — whether the user exists in AD</li>
     *   <li>{@code adAttributes} — raw AD attributes (name, department, email, etc.)</li>
     *   <li>{@code accountDisabled} — true if the AD account is disabled</li>
     *   <li>{@code accountLocked} — true if the AD account is locked out</li>
     *   <li>{@code passwordExpired} — true if the AD password has expired</li>
     *   <li>{@code existsInLocalDb} — whether this user has already been provisioned locally</li>
     * </ul>
     *
     * @param email the staff email address or sAMAccountName to look up
     */
    @GetMapping("/lookup")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(
        summary = "Look up staff user in Active Directory",
        description = "Searches Active Directory for a user by email or username using the service bind account. " +
                      "Returns their AD attributes and account status flags (disabled, locked, password expired). " +
                      "Does NOT require the user's password. Restricted to ROLE_ADMIN."
    )
    public ResponseEntity<Map<String, Object>> lookupAdUser(
            @Parameter(description = "Staff email address (e.g. fname.lname@coopbank.com.et) or sAMAccountName")
            @RequestParam("email") String email) {

        Map<String, Object> result = adAuthService.lookupByEmail(email);
        return ResponseEntity.ok(result);
    }
}
