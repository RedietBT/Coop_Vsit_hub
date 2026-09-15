package com.example.coop_vsit_hub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.ldap.LdapRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.ldap.LdapAutoConfiguration;

@SpringBootApplication(exclude = {LdapRepositoriesAutoConfiguration.class, LdapAutoConfiguration.class})
public class CoopVsitHubApplication {

	public static void main(String[] args) {
		SpringApplication.run(CoopVsitHubApplication.class, args);
	}

}
