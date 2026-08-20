package com.example.coop_vsit_hub.user_and_auth.enums;

/**
 * Security Audit Event Types for CoopBank Security Compliance.
 */
public enum AuditEventType {
    LOGIN_SUCCESS,
    LOGIN_FAILED,
    ACCOUNT_LOCKED,
    ACCOUNT_UNLOCKED,
    TOKEN_REFRESH,
    LOGOUT,
    PASSWORD_CHANGE,
    UNAUTHORIZED_ACCESS
}
