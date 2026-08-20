package com.example.coop_vsit_hub.user_and_auth.enums;

/**
 * Roles for CoopBank DxValley Staff & Administrators.
 * Includes constant values for @PreAuthorize annotations.
 */
public enum RoleName {
    ROLE_ADMIN,
    ROLE_RELATIONSHIP_MANAGER,
    ROLE_BUSINESS_SPONSOR,
    ROLE_APPROVER,
    ROLE_SECURITY_DESK;

    public static final String ADMIN = "ROLE_ADMIN";
    public static final String RELATIONSHIP_MANAGER = "ROLE_RELATIONSHIP_MANAGER";
    public static final String BUSINESS_SPONSOR = "ROLE_BUSINESS_SPONSOR";
    public static final String APPROVER = "ROLE_APPROVER";
    public static final String SECURITY_DESK = "ROLE_SECURITY_DESK";
}
