package com.example.coop_vsit_hub.user_and_auth.controller;

import com.example.coop_vsit_hub.user_and_auth.dto.AuditLogResponse;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditEventType;
import com.example.coop_vsit_hub.user_and_auth.model.AuditLog;
import com.example.coop_vsit_hub.user_and_auth.repository.AuditLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API Controller for Security & System Audit Logs.
 * Exclusively restricted to System Administrators (ROLE_ADMIN).
 */
@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "1.1 Security & Audit Logs", description = "System activity audit trail, authentication logs, and compliance records")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @Operation(summary = "Search & Filter System Audit Logs (Paginated)", description = "Retrieves security audit logs with username search, event type filtering, and pagination. Admin only.")
    public ResponseEntity<PageResponse<AuditLogResponse>> getAuditLogs(
            @Parameter(description = "Keyword search across username")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by audit event type")
            @RequestParam(required = false) AuditEventType eventType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        Sort sort = "asc".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), sort);
        Page<AuditLog> logPage;

        if (StringUtils.hasText(search)) {
            logPage = auditLogRepository.findByUsernameContainingIgnoreCase(search.trim(), pageable);
        } else if (eventType != null) {
            logPage = auditLogRepository.findByEventType(eventType, pageable);
        } else {
            logPage = auditLogRepository.findAll(pageable);
        }

        Page<AuditLogResponse> dtoPage = logPage.map(AuditLogResponse::from);
        return ResponseEntity.ok(PageResponse.from(dtoPage));
    }
}
