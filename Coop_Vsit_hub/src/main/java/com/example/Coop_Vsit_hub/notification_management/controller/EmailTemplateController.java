package com.example.coop_vsit_hub.notification_management.controller;

import com.example.coop_vsit_hub.notification_management.dto.EmailTemplateDto;
import com.example.coop_vsit_hub.notification_management.service.EmailTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/email-templates")
@RequiredArgsConstructor
@Tag(name = "Email Templates", description = "Admin-editable guest email content and branding")
public class EmailTemplateController {

    private final EmailTemplateService service;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "List guest email templates (Admin)")
    public ResponseEntity<List<EmailTemplateDto>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Update a guest email template (Admin)")
    public ResponseEntity<EmailTemplateDto> update(@PathVariable String key, @RequestBody EmailTemplateDto body,
                                                   Principal principal) {
        return ResponseEntity.ok(service.save(key, body, principal != null ? principal.getName() : "admin"));
    }

    @DeleteMapping("/{key}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Reset a guest email template to the defaults (Admin)")
    public ResponseEntity<Map<String, String>> reset(@PathVariable String key) {
        service.reset(key);
        return ResponseEntity.ok(Map.of("message", "Template reset to defaults."));
    }
}
