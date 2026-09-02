package com.example.coop_vsit_hub.user_and_auth.service;

import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.user_and_auth.model.Role;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.RoleRepository;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ldap.core.AttributesMapper;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.ldap.filter.AndFilter;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.filter.OrFilter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import java.util.*;

/**
 * Service for authenticating bank staff against Cooperative Bank of Oromia Active Directory (LDAPS).
 * Automatically provisions and synchronizes staff user accounts upon successful AD authentication.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActiveDirectoryAuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${coopbank.ad.domain:coopbank.local}")
    private String adDomain;

    @Value("${coopbank.ad.url:ldaps://10.1.72.10:636}")
    private String adUrl;

    @Value("${coopbank.ad.base-dn:DC=coopbank,DC=local}")
    private String adBaseDn;

    @Value("${coopbank.ad.username:CN=Business Process Model,OU=Coopbank Application Users,DC=coopbank,DC=local}")
    private String adUsername;

    @Value("${coopbank.ad.password:Lu01J3)£9R}~(rkv}")
    private String adPassword;

    @Value("${coopbank.ad.enabled:true}")
    private boolean adEnabled;

    /**
     * Authenticates staff credentials against CoopBank Active Directory.
     * On success, syncs/creates the local user profile and returns the User entity.
     */
    @Transactional
    public User authenticateStaff(String identifier, String password) {
        String cleanIdentifier = identifier != null ? identifier.trim() : "";
        log.info("Initiating Active Directory authentication for staff identifier: {}", cleanIdentifier);

        // Extract sAMAccountName / username
        String username = cleanIdentifier;
        if (username.contains("@")) {
            username = username.substring(0, username.indexOf("@"));
        }

        // Test staff account fallback for offline local development
        if ("staff_test".equalsIgnoreCase(username) && "CoopBankStaff2026!".equals(password)) {
            log.info("Offline development test staff account matched: staff_test");
            return syncStaffUser(
                    "staff_test",
                    "staff_test@coopbank.com.et",
                    "Alemayehu",
                    "Nigusu",
                    "Growth and Operations",
                    "+251967865704",
                    password
            );
        }

        if (!adEnabled) {
            throw new IllegalStateException("Active Directory authentication is currently disabled in system configuration.");
        }

        try {
            // Configure LDAP Context Source
            LdapContextSource contextSource = new LdapContextSource();
            contextSource.setUrl(adUrl);
            contextSource.setBase(adBaseDn);
            contextSource.setUserDn(adUsername);
            contextSource.setPassword(adPassword);
            
            // Allow self-signed internal bank certificates for secure LDAPS (port 636)
            Map<String, Object> environment = new HashMap<>();
            environment.put("java.naming.security.protocol", "ssl");
            environment.put("java.naming.ldap.factory.socket", "com.example.coop_vsit_hub.user_and_auth.security.TrustAllSSLSocketFactory");
            contextSource.setBaseEnvironmentProperties(environment);
            contextSource.afterPropertiesSet();

            LdapTemplate ldapTemplate = new LdapTemplate(contextSource);
            ldapTemplate.setIgnorePartialResultException(true);

            // Filter for Active Directory User
            AndFilter filter = new AndFilter();
            filter.and(new EqualsFilter("objectClass", "user"));

            OrFilter orFilter = new OrFilter();
            orFilter.or(new EqualsFilter("sAMAccountName", username));
            orFilter.or(new EqualsFilter("userPrincipalName", cleanIdentifier));
            orFilter.or(new EqualsFilter("mail", cleanIdentifier));
            filter.and(orFilter);

            List<AdStaffProfile> results = ldapTemplate.search("", filter.encode(), new AdAttributesMapper());

            if (results == null || results.isEmpty()) {
                log.warn("Staff user '{}' not found in Active Directory.", cleanIdentifier);
                throw new IllegalArgumentException("Invalid CoopBank Active Directory credentials.");
            }

            AdStaffProfile staffProfile = results.get(0);

            // Authenticate user password by attempting bind with user DN
            boolean authenticated = ldapTemplate.authenticate("", filter.encode(), password);
            if (!authenticated) {
                log.warn("Active Directory password verification failed for staff: {}", username);
                throw new IllegalArgumentException("Invalid CoopBank Active Directory password.");
            }

            log.info("Active Directory authentication successful for staff: {} ({})", staffProfile.getUsername(), staffProfile.getEmail());

            return syncStaffUser(
                    staffProfile.getUsername(),
                    staffProfile.getEmail(),
                    staffProfile.getFirstName(),
                    staffProfile.getLastName(),
                    staffProfile.getDepartment(),
                    staffProfile.getPhone(),
                    password
            );

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Active Directory connection error to {}: {}", adUrl, e.getMessage());
            throw new IllegalStateException("CoopBank Active Directory service (" + adUrl + ") is unreachable. Please verify network/VPN connectivity: " + e.getMessage());
        }
    }

    /**
     * Looks up a user in Active Directory by email (or sAMAccountName) using the service account bind.
     * Does NOT require the user's password — safe for admin diagnostics.
     *
     * @param emailOrUsername the email address or sAMAccountName to search for
     * @return map of AD attributes if found, or empty map if not found
     */
    public Map<String, Object> lookupByEmail(String emailOrUsername) {
        String clean = emailOrUsername != null ? emailOrUsername.trim() : "";
        String samName = clean.contains("@") ? clean.substring(0, clean.indexOf("@")) : clean;

        if (!adEnabled) {
            return Map.of("error", "Active Directory is disabled in configuration.");
        }

        try {
            LdapContextSource contextSource = new LdapContextSource();
            contextSource.setUrl(adUrl);
            contextSource.setBase(adBaseDn);
            contextSource.setUserDn(adUsername);
            contextSource.setPassword(adPassword);
            Map<String, Object> env = new HashMap<>();
            env.put("java.naming.security.protocol", "ssl");
            env.put("java.naming.ldap.factory.socket", "com.example.coop_vsit_hub.user_and_auth.security.TrustAllSSLSocketFactory");
            contextSource.setBaseEnvironmentProperties(env);
            contextSource.afterPropertiesSet();

            LdapTemplate ldapTemplate = new LdapTemplate(contextSource);
            ldapTemplate.setIgnorePartialResultException(true);

            AndFilter filter = new AndFilter();
            filter.and(new EqualsFilter("objectClass", "user"));
            OrFilter orFilter = new OrFilter();
            orFilter.or(new EqualsFilter("sAMAccountName", samName));
            orFilter.or(new EqualsFilter("userPrincipalName", clean));
            orFilter.or(new EqualsFilter("mail", clean));
            filter.and(orFilter);

            List<Map<String, Object>> results = ldapTemplate.search("", filter.encode(), (Attributes attrs) -> {
                Map<String, Object> entry = new LinkedHashMap<>();
                String[] fields = {"sAMAccountName", "mail", "userPrincipalName", "givenName", "sn",
                        "displayName", "department", "telephoneNumber", "userAccountControl", "distinguishedName"};
                for (String f : fields) {
                    try {
                        if (attrs.get(f) != null && attrs.get(f).get() != null) {
                            entry.put(f, attrs.get(f).get().toString());
                        }
                    } catch (NamingException ignored) {}
                }
                return entry;
            });

            if (results == null || results.isEmpty()) {
                log.warn("AD lookup: user '{}' not found in Active Directory.", clean);
                return Map.of("found", false, "searchedFor", clean, "adUrl", adUrl, "baseDn", adBaseDn);
            }

            Map<String, Object> adAttrs = results.get(0);

            // Decode userAccountControl flags for readability
            String uac = (String) adAttrs.get("userAccountControl");
            if (uac != null) {
                try {
                    int uacInt = Integer.parseInt(uac);
                    boolean disabled  = (uacInt & 0x0002) != 0;
                    boolean locked    = (uacInt & 0x0010) != 0;
                    boolean pwdExpired = (uacInt & 0x800000) != 0;
                    adAttrs = new LinkedHashMap<>(adAttrs);
                    adAttrs.put("accountDisabled",  disabled);
                    adAttrs.put("accountLocked",    locked);
                    adAttrs.put("passwordExpired",  pwdExpired);
                } catch (NumberFormatException ignored) {}
            }

            // Check if this user exists in the local DB
            String email = (String) adAttrs.get("mail");
            String sam   = (String) adAttrs.get("sAMAccountName");
            boolean inDb = (email != null && userRepository.findByEmail(email.toLowerCase()).isPresent())
                        || (sam   != null && userRepository.findByUsername(sam).isPresent());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("found", true);
            result.put("adAttributes", adAttrs);
            result.put("existsInLocalDb", inDb);
            return result;

        } catch (Exception e) {
            log.error("AD lookup error for '{}': {}", clean, e.getMessage());
            return Map.of("error", "AD lookup failed: " + e.getMessage(), "adUrl", adUrl);
        }
    }

    private User syncStaffUser(String username, String email, String firstName, String lastName, String department, String phone, String rawPassword) {
        String safeEmail = (email != null && !email.isBlank()) ? email.toLowerCase().trim() : (username + "@" + adDomain).toLowerCase();
        String safeFirst = (firstName != null && !firstName.isBlank()) ? firstName.trim() : username;
        String safeLast = (lastName != null && !lastName.isBlank()) ? lastName.trim() : "Staff";
        String safeDept = (department != null && !department.isBlank()) ? department.trim() : "Digital Banking & Payments";

        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(safeEmail))
                .orElse(null);

        if (user == null) {
            // Auto-provision new standard staff employee
            Role staffRole = roleRepository.findByName(RoleName.ROLE_EMPLOYEE)
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name(RoleName.ROLE_EMPLOYEE)
                            .description("CoopBank Staff Employee")
                            .build()));

            Set<Role> roles = new HashSet<>();
            roles.add(staffRole);

            user = User.builder()
                    .username(username)
                    .email(safeEmail)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .firstName(safeFirst)
                    .lastName(safeLast)
                    .department(safeDept)
                    .phoneNumber(phone)
                    .isEnabled(true)
                    .isAccountNonLocked(true)
                    .isEmailVerified(true)
                    .mustChangePassword(false)
                    .failedLoginAttempts(0)
                    .roles(roles)
                    .build();

            log.info("Auto-provisioned new staff profile in Hub for AD user: {}", username);
        } else {
            // Update staff metadata & synchronize password hash
            user.setFirstName(safeFirst);
            user.setLastName(safeLast);
            user.setDepartment(safeDept);
            if (phone != null && !phone.isBlank()) {
                user.setPhoneNumber(phone);
            }
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setEnabled(true);
            user.setAccountNonLocked(true);
            user.setEmailVerified(true);
            user.setMustChangePassword(false);
            user.setFailedLoginAttempts(0);

            // Ensure AD synced users strictly hold ROLE_EMPLOYEE if not a system admin
            boolean hasAdmin = user.getRoles() != null && user.getRoles().stream()
                    .anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
            if (!hasAdmin) {
                Role staffRole = roleRepository.findByName(RoleName.ROLE_EMPLOYEE)
                        .orElseGet(() -> roleRepository.save(Role.builder()
                                .name(RoleName.ROLE_EMPLOYEE)
                                .description("CoopBank Staff Employee")
                                .build()));
                Set<Role> roles = new HashSet<>();
                roles.add(staffRole);
                user.setRoles(roles);
            }
        }

        return userRepository.save(user);
    }

    private static class AdAttributesMapper implements AttributesMapper<AdStaffProfile> {
        @Override
        public AdStaffProfile mapFromAttributes(Attributes attrs) throws NamingException {
            String samAccountName = getAttr(attrs, "sAMAccountName");
            String mail = getAttr(attrs, "mail");
            String givenName = getAttr(attrs, "givenName");
            String sn = getAttr(attrs, "sn");
            String displayName = getAttr(attrs, "displayName");
            String department = getAttr(attrs, "department");
            String telephoneNumber = getAttr(attrs, "telephoneNumber");

            if (givenName == null && displayName != null) {
                String[] parts = displayName.split("\\s+");
                givenName = parts[0];
                if (parts.length > 1) {
                    sn = parts[parts.length - 1];
                }
            }

            return AdStaffProfile.builder()
                    .username(samAccountName)
                    .email(mail)
                    .firstName(givenName != null ? givenName : samAccountName)
                    .lastName(sn != null ? sn : "Staff")
                    .department(department)
                    .phone(telephoneNumber)
                    .build();
        }

        private String getAttr(Attributes attrs, String name) throws NamingException {
            if (attrs.get(name) != null && attrs.get(name).get() != null) {
                return attrs.get(name).get().toString();
            }
            return null;
        }
    }

    @lombok.Data
    @lombok.Builder
    private static class AdStaffProfile {
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private String department;
        private String phone;
    }
}
