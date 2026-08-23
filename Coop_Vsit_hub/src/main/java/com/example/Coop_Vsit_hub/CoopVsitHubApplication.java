package com.example.coop_vsit_hub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.example.coop_vsit_hub")
@EnableJpaRepositories(basePackages = "com.example.coop_vsit_hub")
@EntityScan(basePackages = "com.example.coop_vsit_hub")
public class CoopVsitHubApplication {

	public static void main(String[] args) {
		SpringApplication.run(CoopVsitHubApplication.class, args);
	}

}
