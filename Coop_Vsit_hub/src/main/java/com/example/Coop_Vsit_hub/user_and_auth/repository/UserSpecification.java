package com.example.coop_vsit_hub.user_and_auth.repository;

import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.user_and_auth.model.Role;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic Query Specification for User filtering and search.
 */
public class UserSpecification {

    public static Specification<User> filterUsers(
            String search,
            String department,
            RoleName role,
            Boolean isEnabled,
            Boolean isAccountNonLocked
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Keyword search across firstName, middleName, lastName, username, email, phoneNumber
            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                Predicate firstNameMatch = cb.like(cb.lower(root.get("firstName")), pattern);
                Predicate middleNameMatch = cb.like(cb.lower(root.get("middleName")), pattern);
                Predicate lastNameMatch = cb.like(cb.lower(root.get("lastName")), pattern);
                Predicate usernameMatch = cb.like(cb.lower(root.get("username")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), pattern);
                Predicate phoneMatch = cb.like(cb.lower(root.get("phoneNumber")), pattern);

                predicates.add(cb.or(firstNameMatch, middleNameMatch, lastNameMatch, usernameMatch, emailMatch, phoneMatch));
            }

            // 2. Department filter
            if (StringUtils.hasText(department)) {
                predicates.add(cb.equal(cb.lower(root.get("department")), department.toLowerCase().trim()));
            }

            // 3. Role filter
            if (role != null) {
                Join<User, Role> roleJoin = root.join("roles");
                predicates.add(cb.equal(roleJoin.get("name"), role));
            }

            // 4. Enabled status filter
            if (isEnabled != null) {
                predicates.add(cb.equal(root.get("isEnabled"), isEnabled));
            }

            // 5. Locked status filter
            if (isAccountNonLocked != null) {
                predicates.add(cb.equal(root.get("isAccountNonLocked"), isAccountNonLocked));
            }

            // Ensure distinct results when joining collections
            if (query != null) {
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
