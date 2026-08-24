package com.example.coop_vsit_hub.individual_guest_management.model;

import com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType;
import com.example.coop_vsit_hub.individual_guest_management.enums.VipTier;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Master Register of Individual VIP Guests and Visiting Delegations.
 * Mapped to table 'individual_guests'.
 */
@Entity
@Table(name = "individual_guests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndividualGuest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "first_name", length = 50, nullable = false)
    private String firstName;

    @Column(name = "middle_name", length = 50)
    private String middleName;

    @Column(name = "last_name", length = 50, nullable = false)
    private String lastName;

    @Column(length = 100, nullable = false, unique = true)
    private String email;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(name = "id_number", length = 50)
    private String idNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "id_type", length = 30, nullable = false)
    @Builder.Default
    private IdentityDocumentType idType = IdentityDocumentType.NATIONAL_ID;

    @Column(name = "guest_title", length = 100)
    private String guestTitle;

    @Column(name = "organization_affiliation", length = 150)
    private String organizationAffiliation;

    @Builder.Default
    @Column(name = "country_of_residence", length = 100, nullable = false)
    private String countryOfResidence = "Ethiopia";

    @Enumerated(EnumType.STRING)
    @Column(name = "vip_tier", length = 30, nullable = false)
    @Builder.Default
    private VipTier vipTier = VipTier.STANDARD;

    @Builder.Default
    @Column(name = "relationship_score", nullable = false)
    private int relationshipScore = 50;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public String getFullName() {
        if (middleName != null && !middleName.isBlank()) {
            return firstName + " " + middleName + " " + lastName;
        }
        return firstName + " " + lastName;
    }
}
