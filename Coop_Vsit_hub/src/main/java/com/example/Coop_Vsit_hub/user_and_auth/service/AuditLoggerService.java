package com.example.coop_vsit_hub.user_and_auth.service;

import com.example.coop_vsit_hub.user_and_auth.enums.AuditEventType;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditStatus;
import com.example.coop_vsit_hub.user_and_auth.model.AuditLog;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLoggerService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Persists a security audit event log entry for compliance.
     */
    @Transactional
    public void logEvent(User user, String username, AuditEventType eventType, AuditStatus status, String ipAddress, String userAgent, String details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .username(user != null ? user.getUsername() : username)
                    .userFullName(user != null ? user.getFullName() : null)
                    .eventType(eventType)
                    .status(status)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .details(details)
                    .build();

            auditLogRepository.save(auditLog);
            log.info("SECURITY AUDIT LOG [{}] - Event: {}, User: {}, Status: {}, IP: {}",
                    auditLog.getId(), eventType, username, status, ipAddress);
        } catch (Exception e) {
            log.error("Failed to write security audit log entry: {}", e.getMessage(), e);
        }
    }
}
