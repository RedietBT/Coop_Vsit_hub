package com.example.coop_vsit_hub.user_and_auth.repository;

import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.username = :identifier OR u.email = :identifier")
    Optional<User> findByUsernameOrEmail(@Param("identifier") String identifier);

    @Query("SELECT u FROM User u WHERE u.username = :identifier OR u.email = :identifier OR u.phoneNumber = :identifier")
    Optional<User> findByUsernameOrEmailOrPhoneNumber(@Param("identifier") String identifier);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    long countByIsEnabled(boolean isEnabled);

    long countByIsAccountNonLocked(boolean isAccountNonLocked);

    long countByIsEmailVerified(boolean isEmailVerified);

    long countByMustChangePassword(boolean mustChangePassword);

    @Query("SELECT r.name, COUNT(u) FROM User u JOIN u.roles r GROUP BY r.name")
    List<Object[]> countUsersByRole();

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findByRoleName(@Param("roleName") RoleName roleName);

    @Query("SELECT COALESCE(u.department, 'Unassigned'), COUNT(u) FROM User u GROUP BY u.department")
    List<Object[]> countUsersByDepartment();
}
