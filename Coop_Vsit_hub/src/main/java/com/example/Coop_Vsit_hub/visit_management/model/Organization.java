package com.example.coop_vsit_hub.visit_management.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Guest & Corporate Partner Organizations visiting CoopBank.
 */
@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 150, nullable = false, unique = true)
    private String name;

    @Builder.Default
    @Column(length = 100)
    private String category = "Partner Organization";

    @Builder.Default
    @Column(name = "market_country", length = 100, nullable = false)
    private String marketCountry = "Ethiopia";

    @Builder.Default
    @Column(name = "relationship_score", nullable = false)
    private int relationshipScore = 50;

    @Column(name = "contact_person_name", length = 100)
    private String contactPersonName;

    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(length = 150)
    private String website;

    @Column(name = "industry_sector", length = 100)
    private String industrySector;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
