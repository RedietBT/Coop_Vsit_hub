package com.example.coop_vsit_hub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.autoconfigure.data.ldap.LdapRepositoriesAutoConfiguration;

@SpringBootApplication(exclude = {LdapRepositoriesAutoConfiguration.class})
public class CoopVsitHubApplication {

	public static void main(String[] args) {
		SpringApplication.run(CoopVsitHubApplication.class, args);
	}

}
