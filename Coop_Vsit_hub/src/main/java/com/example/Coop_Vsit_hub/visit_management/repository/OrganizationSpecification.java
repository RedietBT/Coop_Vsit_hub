package com.example.coop_vsit_hub.visit_management.repository;

import com.example.coop_vsit_hub.visit_management.model.Organization;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic JPA Query Specification for Guest Organizations.
 */
public class OrganizationSpecification {

    public static Specification<Organization> filterOrganizations(
            String search,
            String category,
            String marketCountry,
            String industrySector,
            Integer minScore,
            Integer maxScore
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Keyword search (Name, Category, Country, Contact, Email, Industry)
            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase().trim() + "%";

                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate catMatch = cb.like(cb.lower(root.get("category")), pattern);
                Predicate countryMatch = cb.like(cb.lower(root.get("marketCountry")), pattern);
                Predicate contactMatch = cb.like(cb.lower(root.get("contactPersonName")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("contactEmail")), pattern);
                Predicate sectorMatch = cb.like(cb.lower(root.get("industrySector")), pattern);

                predicates.add(cb.or(nameMatch, catMatch, countryMatch, contactMatch, emailMatch, sectorMatch));
            }

            // 2. Category filter
            if (StringUtils.hasText(category)) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.toLowerCase().trim()));
            }

            // 3. Country filter
            if (StringUtils.hasText(marketCountry)) {
                predicates.add(cb.equal(cb.lower(root.get("marketCountry")), marketCountry.toLowerCase().trim()));
            }

            // 4. Industry sector filter
            if (StringUtils.hasText(industrySector)) {
                predicates.add(cb.equal(cb.lower(root.get("industrySector")), industrySector.toLowerCase().trim()));
            }

            // 5. Relationship score range
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
