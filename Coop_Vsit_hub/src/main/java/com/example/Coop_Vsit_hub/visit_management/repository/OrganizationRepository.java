package com.example.coop_vsit_hub.visit_management.repository;

import com.example.coop_vsit_hub.visit_management.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID>, JpaSpecificationExecutor<Organization> {

    Optional<Organization> findByName(String name);

    Optional<Organization> findByNameIgnoreCase(String name);

    boolean existsByName(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    boolean existsByNameAndIdNot(String name, UUID id);

    boolean existsByContactPhone(String contactPhone);

    boolean existsByContactPhoneAndIdNot(String contactPhone, UUID id);

    boolean existsByContactEmailIgnoreCase(String contactEmail);

    boolean existsByContactEmailIgnoreCaseAndIdNot(String contactEmail, UUID id);

    List<Organization> findByCategory(String category);

    List<Organization> findByMarketCountry(String marketCountry);

    @Query("SELECT COALESCE(AVG(o.relationshipScore), 0.0) FROM Organization o")
    Double getAverageRelationshipScore();

    @Query("SELECT o.category, COUNT(o) FROM Organization o GROUP BY o.category")
    List<Object[]> countOrganizationsByCategory();

    @Query("SELECT o.marketCountry, COUNT(o) FROM Organization o GROUP BY o.marketCountry")
    List<Object[]> countOrganizationsByCountry();

    @Query("SELECT o.industrySector, COUNT(o) FROM Organization o WHERE o.industrySector IS NOT NULL GROUP BY o.industrySector")
    List<Object[]> countOrganizationsByIndustrySector();
}
