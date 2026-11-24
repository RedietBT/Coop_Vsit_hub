package com.example.coop_vsit_hub.notification_management.controller;

import com.example.coop_vsit_hub.notification_management.model.EmailLog;
import com.example.coop_vsit_hub.notification_management.service.EmailLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/email-logs")
@RequiredArgsConstructor
@Tag(name = "Email Log", description = "Admin view of guest emails that were sent or failed")
public class EmailLogController {

    private final EmailLogService emailLogService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "List guest email log (Admin)")
    public ResponseEntity<Page<EmailLog>> list(
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(emailLogService.search(status, search, page, size));
    }
}
