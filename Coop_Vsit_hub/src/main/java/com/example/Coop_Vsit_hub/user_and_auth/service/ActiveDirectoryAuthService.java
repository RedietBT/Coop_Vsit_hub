package com.example.coop_vsit_hub.user_and_auth.service;

import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.user_and_auth.model.Role;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.RoleRepository;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.PartialResultException;
import javax.naming.directory.*;
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

    @Value("${coopbank.ad.username:}")
    private String adUsername;

    @Value("${coopbank.ad.password:}")
    private String adPassword;

    @Value("${coopbank.ad.enabled:false}")
    private boolean adEnabled;

    @Value("${coopbank.ad.ssl.trust-all:false}")
    private boolean trustAllSsl;

    @jakarta.annotation.PostConstruct
    public void init() {
        if (trustAllSsl) {
            System.setProperty("com.sun.jndi.ldap.object.disableEndpointIdentification", "true");
            log.warn("LDAP endpoint identification disabled for internal bank LDAPS compatibility.");
        }
    }

    public boolean isAdEnabled() {
        return adEnabled;
    }

    private String resolveBindUser(String rawUser) {
        if (!org.springframework.util.StringUtils.hasText(rawUser)) {
            return rawUser;
        }
        String trimmed = rawUser.trim();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        if (trimmed.contains("@") || trimmed.contains("=")) {
            return trimmed;
        }
        return trimmed + "@" + (org.springframework.util.StringUtils.hasText(adDomain) ? adDomain : "coopbank.local");
    }

    private String resolveBindPassword(String rawPassword) {
        if (!org.springframework.util.StringUtils.hasText(rawPassword)) {
            return rawPassword;
        }
        String trimmed = rawPassword.trim();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.substring(1, trimmed.length() - 1);
        }
        return rawPassword;
    }

    private DirContext createDirContext(String principal, String password) throws NamingException {
        Hashtable<String, Object> env = new Hashtable<>();
        env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
        String providerUrl = adUrl.endsWith("/") ? adUrl + adBaseDn : adUrl + "/" + adBaseDn;
        env.put(Context.PROVIDER_URL, providerUrl);
        env.put(Context.SECURITY_AUTHENTICATION, "simple");
        env.put(Context.SECURITY_PRINCIPAL, principal);
        env.put(Context.SECURITY_CREDENTIALS, password);
        if (adUrl.toLowerCase().startsWith("ldaps://")) {
            env.put(Context.SECURITY_PROTOCOL, "ssl");
            if (trustAllSsl) {
                env.put("java.naming.ldap.factory.socket", "com.example.coop_vsit_hub.user_and_auth.security.TrustAllSSLSocketFactory");
            }
        }
        env.put(Context.REFERRAL, "ignore");
        return new InitialDirContext(env);
    }

    private static String escapeLdapFilter(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            switch (c) {
                case '\\' -> sb.append("\\5c");
                case '*' -> sb.append("\\2a");
                case '(' -> sb.append("\\28");
                case ')' -> sb.append("\\29");
                case '\0' -> sb.append("\\00");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

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

        if (!adEnabled) {
            throw new IllegalStateException("Active Directory authentication is currently disabled in system configuration.");
        }

        String bindUser = resolveBindUser(org.springframework.util.StringUtils.hasText(adUsername) ? adUsername : cleanIdentifier);
        String bindPass = resolveBindPassword(org.springframework.util.StringUtils.hasText(adUsername) ? adPassword : password);

        DirContext ctx = null;
        try {
            // 1. Connect and search for the user profile
            ctx = createDirContext(bindUser, bindPass);

            SearchControls sc = new SearchControls();
            sc.setSearchScope(SearchControls.SUBTREE_SCOPE);
            sc.setCountLimit(2);
            String[] fields = {
                "sAMAccountName", "mail", "userPrincipalName", "givenName", "sn",
                "displayName", "department", "telephoneNumber", "userAccountControl", "distinguishedName",
                "title", "memberOf"
            };
            sc.setReturningAttributes(fields);

            String escapedUser = escapeLdapFilter(username);
            String escapedId = escapeLdapFilter(cleanIdentifier);
            String filter = "(&(objectClass=user)(|(sAMAccountName=" + escapedUser + ")(userPrincipalName=" + escapedId + ")(mail=" + escapedId + ")))";

            NamingEnumeration<SearchResult> answer = ctx.search("", filter, sc);
            SearchResult sr = null;
            while (true) {
                try {
                    if (!answer.hasMore()) {
                        break;
                    }
                } catch (PartialResultException pre) {
                    log.debug("Active Directory referral ignored during authentication search: {}", pre.getMessage());
                    break;
                }
                try {
                    sr = answer.next();
                    if (sr != null) {
                        break;
                    }
                } catch (PartialResultException pre) {
                    log.debug("Active Directory referral ignored during authentication next: {}", pre.getMessage());
                    break;
                }
            }

            if (sr == null) {
                log.warn("Staff user '{}' not found in Active Directory.", cleanIdentifier);
                throw new IllegalArgumentException("Invalid CoopBank Active Directory credentials.");
            }

            Attributes attrs = sr.getAttributes();
            AdStaffProfile staffProfile = mapStaffProfile(attrs);
            String userFullDn = sr.getNameInNamespace();

            // 2. If using service account bind, verify user's password by performing a user bind
            if (org.springframework.util.StringUtils.hasText(adUsername)) {
                try {
                    DirContext userCtx = createDirContext(userFullDn, password);
                    userCtx.close();
                } catch (NamingException e) {
                    log.warn("Active Directory password verification failed for staff: {}", username);
                    throw new IllegalArgumentException("Invalid CoopBank Active Directory password.");
                }
            }

            log.info("Active Directory authentication successful for staff: {} ({})", staffProfile.getUsername(), staffProfile.getEmail());

            // 1. Check if user is already registered in the Hub (by admin or previous login)
            User existingUser = userRepository.findByUsername(staffProfile.getUsername())
                    .or(() -> (staffProfile.getEmail() != null) ? userRepository.findByEmail(staffProfile.getEmail().toLowerCase()) : Optional.empty())
                    .orElse(null);

            RoleName assignedRole = null;
            if (existingUser != null && existingUser.getRoles() != null && !existingUser.getRoles().isEmpty()) {
                // User already has assigned system roles (e.g. Relationship Manager, Security Desk, Approver, etc.)
                log.info("Staff '{}' authenticated with existing system roles: {}", staffProfile.getUsername(), existingUser.getRoles());
            } else {
                // Auto-provisioning direct AD user (Directors / Department Secretaries)
                assignedRole = resolveRoleFromAdProfile(staffProfile);
                if (assignedRole == null) {
                    log.warn("Access Denied: Staff user '{}' does not have an assigned system role (Title: {}, Dept: {})",
                            staffProfile.getUsername(), staffProfile.getTitle(), staffProfile.getDepartment());
                    throw new IllegalArgumentException("Access Denied: Your account has not been assigned a role in CoopBank Visit Hub. Please contact the System Administrator.");
                }
            }

            return syncStaffUser(
                    staffProfile.getUsername(),
                    staffProfile.getEmail(),
                    staffProfile.getFirstName(),
                    staffProfile.getLastName(),
                    staffProfile.getDepartment(),
                    staffProfile.getPhone(),
                    password,
                    assignedRole
            );

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            if (root instanceof NamingException ne && ne.getRootCause() != null) {
                root = ne.getRootCause();
            }
            String rootMsg = (root != null && root.getMessage() != null && !root.getMessage().equals(e.getMessage())) ? " (Root cause: " + root.getMessage() + ")" : "";
            log.error("Active Directory connection error to {}: {}{}", adUrl, e.getMessage(), rootMsg, e);
            throw new IllegalStateException("CoopBank Active Directory service (" + adUrl + ") connection failed: " + e.getMessage() + rootMsg, e);
        } finally {
            if (ctx != null) {
                try { ctx.close(); } catch (Exception ignored) {}
            }
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

        if (!org.springframework.util.StringUtils.hasText(adUsername) || !org.springframework.util.StringUtils.hasText(adPassword)) {
            log.warn("AD lookup attempted but coopbank.ad.username or coopbank.ad.password is not configured.");
            return Map.of("error", "AD lookup failed: AD service account credentials (coopbank.ad.username / coopbank.ad.password) are missing in application.properties.", "adUrl", adUrl);
        }

        DirContext ctx = null;
        try {
            ctx = createDirContext(resolveBindUser(adUsername), resolveBindPassword(adPassword));

            SearchControls sc = new SearchControls();
            sc.setSearchScope(SearchControls.SUBTREE_SCOPE);
            sc.setCountLimit(10);
            String[] fields = {
                "sAMAccountName", "mail", "userPrincipalName", "givenName", "sn",
                "displayName", "department", "telephoneNumber", "userAccountControl", "distinguishedName",
                "title", "memberOf"
            };
            sc.setReturningAttributes(fields);

            String escapedSam = escapeLdapFilter(samName);
            String escapedClean = escapeLdapFilter(clean);
            String filter = "(&(objectClass=user)(|(sAMAccountName=" + escapedSam + ")(userPrincipalName=" + escapedClean + ")(mail=" + escapedClean + ")))";

            NamingEnumeration<SearchResult> answer = ctx.search("", filter, sc);
            List<Map<String, Object>> results = new ArrayList<>();
            while (true) {
                try {
                    if (!answer.hasMore()) {
                        break;
                    }
                } catch (PartialResultException pre) {
                    log.debug("Active Directory referral ignored during user lookup hasMore: {}", pre.getMessage());
                    break;
                }
                SearchResult sr;
                try {
                    sr = answer.next();
                } catch (PartialResultException pre) {
                    log.debug("Active Directory referral ignored during user lookup next: {}", pre.getMessage());
                    break;
                }
                Attributes attrs = sr.getAttributes();
                Map<String, Object> entry = new LinkedHashMap<>();
                for (String f : fields) {
                    if (attrs.get(f) != null && attrs.get(f).get() != null) {
                        entry.put(f, attrs.get(f).get().toString());
                    }
                }
                results.add(entry);
            }

            if (results.isEmpty()) {
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

            // Build clean staff object for registration form autofill
            String firstName = (String) adAttrs.get("givenName");
            String lastName  = (String) adAttrs.get("sn");
            String displayName = (String) adAttrs.get("displayName");
            if ((firstName == null || firstName.isBlank()) && displayName != null) {
                String[] parts = displayName.split("\\s+");
                firstName = parts[0];
                if (parts.length > 1 && (lastName == null || lastName.isBlank())) {
                    lastName = parts[parts.length - 1];
                }
            }

            Map<String, Object> staff = new LinkedHashMap<>();
            staff.put("username", sam);
            staff.put("email", email != null ? email : (sam + "@" + adDomain));
            staff.put("firstName", firstName != null ? firstName : sam);
            staff.put("lastName", lastName != null ? lastName : "Staff");
            staff.put("department", adAttrs.get("department"));
            staff.put("phoneNumber", adAttrs.get("telephoneNumber"));
            staff.put("title", adAttrs.get("title"));
            staff.put("isAdUser", true);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("found", true);
            result.put("staff", staff);
            result.put("adAttributes", adAttrs);
            result.put("existsInLocalDb", inDb);
            return result;

        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            if (root instanceof NamingException ne && ne.getRootCause() != null) {
                root = ne.getRootCause();
            }
            String rootMsg = (root != null && root.getMessage() != null && !root.getMessage().equals(e.getMessage())) ? " (Root cause: " + root.getMessage() + ")" : "";
            log.error("AD lookup error for '{}': {}{}", clean, e.getMessage(), rootMsg, e);
            return Map.of("error", "AD lookup failed: " + e.getMessage() + rootMsg, "adUrl", adUrl);
        } finally {
            if (ctx != null) {
                try { ctx.close(); } catch (Exception ignored) {}
            }
        }
    }

    private User syncStaffUser(String username, String email, String firstName, String lastName, String department, String phone, String rawPassword) {
        return syncStaffUser(username, email, firstName, lastName, department, phone, rawPassword, RoleName.ROLE_DIRECTOR);
    }

    private User syncStaffUser(String username, String email, String firstName, String lastName, String department, String phone, String rawPassword, RoleName targetRole) {
        String safeEmail = (email != null && !email.isBlank()) ? email.toLowerCase().trim() : (username + "@" + adDomain).toLowerCase();
        String safeFirst = (firstName != null && !firstName.isBlank()) ? firstName.trim() : username;
        String safeLast = (lastName != null && !lastName.isBlank()) ? lastName.trim() : "Staff";
        String safeDept = (department != null && !department.isBlank()) ? department.trim() : "Digital Banking & Payments";
        RoleName effectiveRole = (targetRole != null) ? targetRole : RoleName.ROLE_DIRECTOR;

        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(safeEmail))
                .orElse(null);

        if (user == null) {
            Role assignedRole = roleRepository.findByName(effectiveRole)
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name(effectiveRole)
                            .description("CoopBank " + effectiveRole.name())
                            .build()));

            Set<Role> roles = new HashSet<>();
            roles.add(assignedRole);

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

            log.info("Auto-provisioned new user profile in Hub with role {}: {}", effectiveRole, username);
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

            // Preserve existing admin-assigned roles!
            // Only assign effectiveRole if the user currently has no roles assigned
            if ((user.getRoles() == null || user.getRoles().isEmpty()) && effectiveRole != null) {
                Role assignedRole = roleRepository.findByName(effectiveRole)
                        .orElseGet(() -> roleRepository.save(Role.builder()
                                .name(effectiveRole)
                                .description("CoopBank " + effectiveRole.name())
                                .build()));
                Set<Role> roles = new HashSet<>();
                roles.add(assignedRole);
                user.setRoles(roles);
                log.info("Assigned initial role {} to user: {}", effectiveRole, username);
            }
        }

        return userRepository.save(user);
    }

    /**
     * Resolves appropriate Hub role from Active Directory job title or group membership.
     * Restricts portal entry strictly to Directors and Department Secretaries.
     */
    private RoleName resolveRoleFromAdProfile(AdStaffProfile profile) {
        String title = (profile.getTitle() != null) ? profile.getTitle().toLowerCase() : "";
        String memberOf = (profile.getMemberOf() != null) ? profile.getMemberOf().toLowerCase() : "";

        if (title.contains("director") || title.contains("chief") || title.contains("vice president")
                || title.contains("vp") || title.contains("head") || memberOf.contains("director")) {
            return RoleName.ROLE_DIRECTOR;
        }

        if (title.contains("secretary") || title.contains("assistant") || title.contains("admin")
                || memberOf.contains("secretary")) {
            return RoleName.ROLE_SECRETARY;
        }

        if (title.contains("security") || memberOf.contains("security")) {
            return RoleName.ROLE_SECURITY_DESK;
        }

        return null;
    }

    private AdStaffProfile mapStaffProfile(Attributes attrs) throws NamingException {
        String samAccountName = getAttr(attrs, "sAMAccountName");
        String mail = getAttr(attrs, "mail");
        String givenName = getAttr(attrs, "givenName");
        String sn = getAttr(attrs, "sn");
        String displayName = getAttr(attrs, "displayName");
        String department = getAttr(attrs, "department");
        String telephoneNumber = getAttr(attrs, "telephoneNumber");
        String title = getAttr(attrs, "title");
        String memberOf = getAttr(attrs, "memberOf");

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
                .title(title)
                .memberOf(memberOf)
                .build();
    }

    private String getAttr(Attributes attrs, String name) throws NamingException {
        if (attrs.get(name) != null && attrs.get(name).get() != null) {
            return attrs.get(name).get().toString();
        }
        return null;
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
        private String title;
        private String memberOf;
    }
}
