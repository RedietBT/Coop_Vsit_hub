package com.example.coop_vsit_hub.individual_guest_management.repository;

import com.example.coop_vsit_hub.individual_guest_management.enums.VipTier;
import com.example.coop_vsit_hub.individual_guest_management.model.IndividualGuest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IndividualGuestRepository extends JpaRepository<IndividualGuest, UUID>, JpaSpecificationExecutor<IndividualGuest> {

    Optional<IndividualGuest> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, UUID id);

    Optional<IndividualGuest> findByIdNumber(String idNumber);

    Optional<IndividualGuest> findByFirstNameIgnoreCaseAndLastNameIgnoreCaseAndPhoneNumber(String firstName, String lastName, String phoneNumber);

    List<IndividualGuest> findByPhoneNumber(String phoneNumber);

    long countByVipTier(VipTier vipTier);

    @Query("SELECT COALESCE(AVG(g.relationshipScore), 0.0) FROM IndividualGuest g")
    Double getAverageRelationshipScore();

    @Query("SELECT g.vipTier, COUNT(g) FROM IndividualGuest g GROUP BY g.vipTier")
    List<Object[]> countGuestsByVipTierGroup();

    @Query("SELECT g.countryOfResidence, COUNT(g) FROM IndividualGuest g GROUP BY g.countryOfResidence")
    List<Object[]> countGuestsByCountryGroup();

    @Query("SELECT g.idType, COUNT(g) FROM IndividualGuest g GROUP BY g.idType")
    List<Object[]> countGuestsByIdTypeGroup();
}
