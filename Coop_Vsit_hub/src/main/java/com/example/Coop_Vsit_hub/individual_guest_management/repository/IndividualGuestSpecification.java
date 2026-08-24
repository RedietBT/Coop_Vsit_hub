package com.example.coop_vsit_hub.individual_guest_management.repository;

import com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType;
import com.example.coop_vsit_hub.individual_guest_management.enums.VipTier;
import com.example.coop_vsit_hub.individual_guest_management.model.IndividualGuest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic JPA Query Specification for Individual Guests.
 */
public class IndividualGuestSpecification {

    public static Specification<IndividualGuest> filterGuests(
            String search,
            VipTier vipTier,
            IdentityDocumentType idType,
            String country,
            String affiliation,
            Integer minScore,
            Integer maxScore
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Keyword search (Name, Email, Phone, ID Number, Title, Org, Country)
            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase().trim() + "%";

                Predicate firstMatch = cb.like(cb.lower(root.get("firstName")), pattern);
                Predicate middleMatch = cb.like(cb.lower(root.get("middleName")), pattern);
                Predicate lastMatch = cb.like(cb.lower(root.get("lastName")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), pattern);
                Predicate phoneMatch = cb.like(cb.lower(root.get("phoneNumber")), pattern);
                Predicate idNumMatch = cb.like(cb.lower(root.get("idNumber")), pattern);
                Predicate titleMatch = cb.like(cb.lower(root.get("guestTitle")), pattern);
                Predicate orgMatch = cb.like(cb.lower(root.get("organizationAffiliation")), pattern);
                Predicate countryMatch = cb.like(cb.lower(root.get("countryOfResidence")), pattern);

                predicates.add(cb.or(firstMatch, middleMatch, lastMatch, emailMatch, phoneMatch,
                        idNumMatch, titleMatch, orgMatch, countryMatch));
            }

            // 2. VIP Tier filter
            if (vipTier != null) {
                predicates.add(cb.equal(root.get("vipTier"), vipTier));
            }

            // 3. Identity Document Type filter
            if (idType != null) {
                predicates.add(cb.equal(root.get("idType"), idType));
            }

            // 4. Country filter
            if (StringUtils.hasText(country)) {
                predicates.add(cb.equal(cb.lower(root.get("countryOfResidence")), country.toLowerCase().trim()));
            }

            // 5. Affiliation filter
            if (StringUtils.hasText(affiliation)) {
                predicates.add(cb.like(cb.lower(root.get("organizationAffiliation")), "%" + affiliation.toLowerCase().trim() + "%"));
            }

            // 6. Relationship score range
            if (minScore != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("relationshipScore"), minScore));
            }
            if (maxScore != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("relationshipScore"), maxScore));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
