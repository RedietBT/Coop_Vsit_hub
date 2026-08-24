package com.example.coop_vsit_hub.visit_management.repository;

import com.example.coop_vsit_hub.visit_management.enums.GuestCategory;
import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.enums.VisitType;
import com.example.coop_vsit_hub.visit_management.model.Organization;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Dynamic JPA Query Specification for Visit filtering, full-text search, and date ranges.
 */
public class VisitSpecification {

    public static Specification<Visit> filterVisits(
            String search,
            VisitStatus status,
            VisitPriority priority,
            VisitType visitType,
            GuestCategory guestCategory,
            String department,
            String locationRoom,
            UUID requesterId,
            UUID sponsorId,
            UUID approverId,
            Instant fromDate,
            Instant toDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Keyword search (Code, Title, Room, Badge, Dept, Org Name, Individual Guest Names)
            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase().trim() + "%";

                Predicate codeMatch = cb.like(cb.lower(root.get("visitCode")), pattern);
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate deptMatch = cb.like(cb.lower(root.get("requestingDepartment")), pattern);
                Predicate roomMatch = cb.like(cb.lower(root.get("locationRoom")), pattern);
                Predicate badgeMatch = cb.like(cb.lower(root.get("visitorBadgeNumber")), pattern);
                Predicate guestFirstMatch = cb.like(cb.lower(root.get("individualGuestFirstName")), pattern);
                Predicate guestLastMatch = cb.like(cb.lower(root.get("individualGuestLastName")), pattern);
                Predicate guestEmailMatch = cb.like(cb.lower(root.get("individualGuestEmail")), pattern);

                // Join organization for org name match
                Join<Visit, Organization> orgJoin = root.join("guestOrganization", JoinType.LEFT);
                Predicate orgNameMatch = cb.like(cb.lower(orgJoin.get("name")), pattern);

                predicates.add(cb.or(codeMatch, titleMatch, deptMatch, roomMatch, badgeMatch,
                        guestFirstMatch, guestLastMatch, guestEmailMatch, orgNameMatch));
            }

            // 2. Status filter
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // 3. Priority filter
            if (priority != null) {
                predicates.add(cb.equal(root.get("priorityLevel"), priority));
            }

            // 4. Visit Type filter
            if (visitType != null) {
                predicates.add(cb.equal(root.get("visitType"), visitType));
            }

            // 5. Guest Category filter
            if (guestCategory != null) {
                predicates.add(cb.equal(root.get("guestCategory"), guestCategory));
            }

            // 6. Department filter
            if (StringUtils.hasText(department)) {
                predicates.add(cb.equal(cb.lower(root.get("requestingDepartment")), department.toLowerCase().trim()));
            }

            // 7. Location Room filter
            if (StringUtils.hasText(locationRoom)) {
                predicates.add(cb.equal(cb.lower(root.get("locationRoom")), locationRoom.toLowerCase().trim()));
            }

            // 8. Staff User Association filters
            if (requesterId != null) {
                predicates.add(cb.equal(root.get("requester").get("id"), requesterId));
            }
            if (sponsorId != null) {
                predicates.add(cb.equal(root.get("sponsor").get("id"), sponsorId));
            }
            if (approverId != null) {
                predicates.add(cb.equal(root.get("approver").get("id"), approverId));
            }

            // 9. Date Range filters (matches scheduledStartTime)
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("scheduledStartTime"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("scheduledStartTime"), toDate));
            }

            if (query != null) {
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
