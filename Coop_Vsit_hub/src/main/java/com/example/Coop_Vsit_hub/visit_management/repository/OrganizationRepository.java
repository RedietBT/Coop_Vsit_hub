package com.example.coop_vsit_hub.visit_management.repository;

import com.example.coop_vsit_hub.visit_management.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    Optional<Organization> findByName(String name);

    boolean existsByName(String name);

    List<Organization> findByCategory(String category);

    List<Organization> findByMarketCountry(String marketCountry);
}
