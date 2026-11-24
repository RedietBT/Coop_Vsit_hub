package com.example.coop_vsit_hub.notification_management.repository;

import com.example.coop_vsit_hub.notification_management.model.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, String> {
}
