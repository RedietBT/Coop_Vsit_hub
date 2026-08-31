package com.example.coop_vsit_hub.individual_guest_management.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * VIP Tiering classification for individual guests and VIP delegations.
 */
public enum VipTier {
    VIP_TIER_1, // C-Level Executives, Board Members, Ministers, Foreign Envoys
    VIP_TIER_2, // Directors, Senior Vice Presidents, General Managers
    STANDARD,   // General Delegates, Technical Consultants, Auditors
    DIPLOMAT;   // Embassy Officials, Multilateral Organization Representatives

    @JsonCreator
    public static VipTier fromString(String value) {
        if (value == null || value.isBlank()) {
            return STANDARD;
        }
        String upper = value.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        if (upper.equals("TIER_1") || upper.equals("TIER1") || upper.equals("VIP_TIER_1") || upper.equals("VIP") || upper.equals("VVIP")) {
            return VIP_TIER_1;
        }
        if (upper.equals("TIER_2") || upper.equals("TIER2") || upper.equals("VIP_TIER_2")) {
            return VIP_TIER_2;
        }
        if (upper.equals("DIPLOMAT") || upper.equals("DIPLOMATIC")) {
            return DIPLOMAT;
        }
        return STANDARD;
    }
}
