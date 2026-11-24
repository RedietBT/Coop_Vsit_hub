package com.example.coop_vsit_hub.notification_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateDto {
    private String key;
    private String label;
    private String description;
    /** true when an admin has saved changes (otherwise built-in defaults are in use). */
    private boolean customized;
    private String subject;
    private String headline;
    private String intro;
    private String footerNote;
    private String signature;
    private String logoUrl;
    private String accentColor;
    /** Placeholders usable in subject / headline / intro / footer note, e.g. {{hostName}}. */
    private List<String> placeholders;
}
