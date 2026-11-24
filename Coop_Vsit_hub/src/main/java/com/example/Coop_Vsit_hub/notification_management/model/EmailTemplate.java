package com.example.coop_vsit_hub.notification_management.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/** Admin overrides for the guest email content. Blank fields fall back to defaults. */
@Entity
@Table(name = "email_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTemplate {

    @Id
    @Column(name = "template_key", length = 40)
    private String templateKey;

    @Column(name = "subject", columnDefinition = "TEXT")
    private String subject;

    @Column(name = "headline", columnDefinition = "TEXT")
    private String headline;

    @Column(name = "intro", columnDefinition = "TEXT")
    private String intro;

    @Column(name = "footer_note", columnDefinition = "TEXT")
    private String footerNote;

    @Column(name = "signature", columnDefinition = "TEXT")
    private String signature;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "accent_color", length = 20)
    private String accentColor;

    @Column(name = "updated_by", length = 150)
    private String updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
