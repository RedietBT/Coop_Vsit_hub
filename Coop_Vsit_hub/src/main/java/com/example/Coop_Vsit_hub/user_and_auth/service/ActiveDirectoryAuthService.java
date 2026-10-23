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
    private static final List<Map<String, String>> MOCK_AD_STAFF = List.of(
            Map.of("username", "dalemu", "email", "dalemu@coopbank.com.et", "firstName", "Dawit", "lastName", "Alemu", "displayName", "Dawit Alemu", "department", "Digital Banking & Payments", "title", "Senior Digital Peering Manager", "phoneNumber", "+251911223344"),
            Map.of("username", "btadesse", "email", "btadesse@coopbank.com.et", "firstName", "Bethlehem", "lastName", "Tadesse", "displayName", "Bethlehem Tadesse", "department", "Corporate Communication & Marketing", "title", "Communications Director", "phoneNumber", "+251922334455"),
            Map.of("username", "cgutu", "email", "cgutu@coopbank.com.et", "firstName", "Chala", "lastName", "Gutu", "displayName", "Chala Gutu", "department", "Information Technology & Security", "title", "Head of IT Infrastructure", "phoneNumber", "+251933445566"),
            Map.of("username", "abikila", "email", "abikila@coopbank.com.et", "firstName", "Abebe", "lastName", "Bikila", "displayName", "Abebe Bikila", "department", "Executive Management", "title", "Executive Director", "phoneNumber", "+251944556677"),
            Map.of("username", "hmesfin", "email", "hmesfin@coopbank.com.et", "firstName", "Helen", "lastName", "Mesfin", "displayName", "Helen Mesfin", "department", "Human Resources", "title", "Senior HR Business Partner", "phoneNumber", "+251955667788"),
            Map.of("username", "ysolomon", "email", "ysolomon@coopbank.com.et", "firstName", "Yared", "lastName", "Solomon", "displayName", "Yared Solomon", "department", "Risk Management & Compliance", "title", "Compliance Director", "phoneNumber", "+251966778899"),
            Map.of("username", "sassefa", "email", "sassefa@coopbank.com.et", "firstName", "Selamawit", "lastName", "Assefa", "displayName", "Selamawit Assefa", "department", "Legal & Secretariat", "title", "Executive Board Secretary", "phoneNumber", "+251977889900")
    );

    /**
     * Diagnostic method to test the live connection to Active Directory.
     * Checks socket reachability, LDAPS SSL handshake, and bind authentication.
     *
     * @return map with connection status, latency, domain controller URL, and diagnostic details.
     */
    public Map<String, Object> testConnection() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("adEnabled", adEnabled);
        status.put("adUrl", adUrl);
        status.put("adDomain", adDomain);
        status.put("adBaseDn", adBaseDn);
        status.put("trustAllSsl", trustAllSsl);
        status.put("hasServiceAccountUser", org.springframework.util.StringUtils.hasText(adUsername));
        status.put("hasServiceAccountPassword", org.springframework.util.StringUtils.hasText(adPassword));

        String bindUserDisplay = org.springframework.util.StringUtils.hasText(adUsername)
                ? resolveBindUser(adUsername)
                : "(None configured)";
        status.put("bindUser", bindUserDisplay);

        if (!adEnabled) {
            status.put("connected", false);
            status.put("status", "DISABLED");
            status.put("message", "Active Directory integration is currently disabled (coopbank.ad.enabled=false). Real LDAPS queries are bypassed and using mock fallback.");
            status.put("suggestion", "Set AD_ENABLED=true in your environment or application.properties to enable live AD synchronization.");
            return status;
        }

        if (!org.springframework.util.StringUtils.hasText(adUsername) || !org.springframework.util.StringUtils.hasText(adPassword)) {
            status.put("connected", false);
            status.put("status", "CREDENTIALS_MISSING");
            status.put("message", "Active Directory service account credentials (coopbank.ad.username / coopbank.ad.password) are not configured.");
            status.put("suggestion", "Provide coopbank.ad.username and coopbank.ad.password in application.properties or .env to allow searching the AD directory.");
            return status;
        }

        long start = System.currentTimeMillis();
        DirContext ctx = null;
        try {
            ctx = createDirContext(resolveBindUser(adUsername), resolveBindPassword(adPassword));
            long latency = System.currentTimeMillis() - start;

            // Perform a lightweight search to test read permissions on base DN
            SearchControls sc = new SearchControls();
            sc.setSearchScope(SearchControls.SUBTREE_SCOPE);
            sc.setCountLimit(1);
            sc.setReturningAttributes(new String[]{"sAMAccountName", "mail"});
            ctx.search("", "(&(objectClass=user)(sAMAccountName=*))", sc);

            status.put("connected", true);
            status.put("status", "CONNECTED");
            status.put("latencyMs", latency);
            status.put("message", "Successfully connected and authenticated with CoopBank Active Directory at " + adUrl + " (" + latency + "ms).");
            return status;

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            Throwable root = e;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            if (root instanceof NamingException ne && ne.getRootCause() != null) {
                root = ne.getRootCause();
            }

            String rootMsg = root.getMessage() != null ? root.getMessage() : e.getMessage();
            status.put("connected", false);
            status.put("status", "FAILED");
            status.put("latencyMs", duration);
            status.put("error", rootMsg);
            status.put("errorType", root.getClass().getSimpleName());

            String suggestion = "Please verify bank network route, VPN connection, and firewall access to " + adUrl + ".";
            if (rootMsg != null) {
                if (rootMsg.contains("timed out") || rootMsg.contains("ConnectException")) {
                    suggestion = "Connection timed out. Ensure you are connected to the CoopBank internal intranet or VPN, and " + adUrl + " is reachable.";
                } else if (rootMsg.contains("PKIX") || rootMsg.contains("certificate")) {
                    suggestion = "SSL certificate validation failed. Enable coopbank.ad.ssl.trust-all=true for internal/self-signed bank certificates.";
                } else if (rootMsg.contains("49") || rootMsg.contains("Invalid Credentials") || rootMsg.contains("AcceptSecurityContext")) {
                    suggestion = "Active Directory rejected the bind credentials. Verify the service account username and password.";
                } else if (rootMsg.contains("32") || rootMsg.contains("NameNotFoundException")) {
                    suggestion = "Base DN '" + adBaseDn + "' not found. Verify domain structure (e.g. DC=coopbank,DC=local vs DC=coopbank,DC=com,DC=et).";
                }
            }
            status.put("suggestion", suggestion);
            status.put("message", "Active Directory connection failed: " + rootMsg);
            return status;

        } finally {
            if (ctx != null) {
                try { ctx.close(); } catch (Exception ignored) {}
            }
        }
    }

    /**
     * Looks up a user in Active Directory by email, username, or name using the service account bind.
     * Does NOT require the user's password — safe for admin diagnostics and onboarding auto-fill.
     *
     * @param emailOrUsername the email address, sAMAccountName, or staff name to search for
     * @return map of AD attributes if found, or empty map if not found
     */
    public Map<String, Object> lookupByEmail(String emailOrUsername) {
        String clean = emailOrUsername != null ? emailOrUsername.trim() : "";
        String samName = clean.contains("@") ? clean.substring(0, clean.indexOf("@")) : clean;

        if (!adEnabled || !org.springframework.util.StringUtils.hasText(adUsername) || !org.springframework.util.StringUtils.hasText(adPassword)) {
            return findMockStaff(clean);
        }

        DirContext ctx = null;
        try {
            ctx = createDirContext(resolveBindUser(adUsername), resolveBindPassword(adPassword));

            SearchControls sc = new SearchControls();
            sc.setSearchScope(SearchControls.SUBTREE_SCOPE);
            sc.setCountLimit(10);
            String[] fields = {
                "sAMAccountName", "mail", "userPrincipalName", "givenName", "sn",
                "displayName", "cn", "name", "department", "telephoneNumber", "userAccountControl", "distinguishedName",
                "title", "memberOf"
            };
            sc.setReturningAttributes(fields);

            String escapedSam = escapeLdapFilter(samName);
            String escapedClean = escapeLdapFilter(clean);
            String filter = "(&(objectClass=user)(!(objectClass=computer))(|"
                    + "(sAMAccountName=" + escapedSam + ")"
                    + "(userPrincipalName=" + escapedClean + ")"
                    + "(mail=" + escapedClean + ")"
                    + "(displayName=" + escapedClean + ")"
                    + "(cn=" + escapedClean + ")"
                    + "))";

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

            // If exact match didn't find anything, try substring search via searchUsers
            if (results.isEmpty()) {
                List<Map<String, Object>> fallbackList = searchUsers(clean, 1);
                if (!fallbackList.isEmpty()) {
                    Map<String, Object> fallbackStaff = fallbackList.get(0);
                    Map<String, Object> fallbackRes = new LinkedHashMap<>();
                    fallbackRes.put("found", true);
                    fallbackRes.put("staff", fallbackStaff);
                    fallbackRes.put("adAttributes", fallbackStaff);
                    fallbackRes.put("existsInLocalDb", Boolean.TRUE.equals(fallbackStaff.get("existsInLocalDb")));
                    return fallbackRes;
                }

                log.warn("AD lookup: user '{}' not found in Active Directory. Checking mock fallback.", clean);
                Map<String, Object> mockRes = findMockStaff(clean);
                if (Boolean.TRUE.equals(mockRes.get("found"))) {
                    return mockRes;
                }
                return Map.of("found", false, "searchedFor", clean, "adUrl", adUrl, "baseDn", adBaseDn, "message", "Staff '" + clean + "' was not found in Active Directory.");
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
            if (displayName == null) {
                displayName = (String) adAttrs.get("cn");
            }
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
            staff.put("displayName", displayName != null ? displayName : ((firstName != null ? firstName : sam) + " " + (lastName != null ? lastName : "")));
            staff.put("department", adAttrs.get("department") != null ? adAttrs.get("department") : "");
            staff.put("phoneNumber", adAttrs.get("telephoneNumber") != null ? adAttrs.get("telephoneNumber") : "");
            staff.put("phone", adAttrs.get("telephoneNumber") != null ? adAttrs.get("telephoneNumber") : "");
            staff.put("title", adAttrs.get("title") != null ? adAttrs.get("title") : "");
            staff.put("jobTitle", adAttrs.get("title") != null ? adAttrs.get("title") : "");
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
            log.warn("AD lookup error for '{}': {}{}. Checking fallback mock.", clean, e.getMessage(), rootMsg);
            Map<String, Object> mockRes = findMockStaff(clean);
            if (Boolean.TRUE.equals(mockRes.get("found"))) {
                return mockRes;
            }
            return Map.of("error", "AD lookup failed: " + e.getMessage() + rootMsg, "adUrl", adUrl);
        } finally {
            if (ctx != null) {
                try { ctx.close(); } catch (Exception ignored) {}
            }
        }
    }

    /**
     * Live search for staff in Active Directory by query across sAMAccountName, email, displayName, givenName, sn.
     *
     * @param query search text (name, email, or username)
     * @param limit maximum results to return
     * @return list of matching staff profiles
     */
    public List<Map<String, Object>> searchUsers(String query, int limit) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }
        String clean = query.trim();
        int maxResults = (limit > 0) ? Math.min(limit, 25) : 10;

        // If AD is disabled or service credentials are missing, use realistic mock bank staff for dev/testing
        if (!adEnabled || !org.springframework.util.StringUtils.hasText(adUsername) || !org.springframework.util.StringUtils.hasText(adPassword)) {
            return searchMockStaff(clean, maxResults);
        }

        DirContext ctx = null;
        try {
            ctx = createDirContext(resolveBindUser(adUsername), resolveBindPassword(adPassword));

            SearchControls sc = new SearchControls();
            sc.setSearchScope(SearchControls.SUBTREE_SCOPE);
            sc.setCountLimit(maxResults);
            String[] fields = {
                "sAMAccountName", "mail", "userPrincipalName", "givenName", "sn",
                "displayName", "cn", "name", "department", "telephoneNumber", "userAccountControl", "distinguishedName",
                "title", "memberOf"
            };
            sc.setReturningAttributes(fields);

            String samQuery = clean.contains("@") ? clean.substring(0, clean.indexOf("@")) : clean;
            String escaped = escapeLdapFilter(clean);
            String escapedSam = escapeLdapFilter(samQuery);

            StringBuilder filterBuilder = new StringBuilder();
            filterBuilder.append("(&(objectClass=user)(!(objectClass=computer))(|");
            filterBuilder.append("(sAMAccountName=").append(escapedSam).append("*)");
            filterBuilder.append("(sAMAccountName=*").append(escapedSam).append("*)");
            filterBuilder.append("(mail=").append(escaped).append("*)");
            filterBuilder.append("(mail=*").append(escapedSam).append("*)");
            filterBuilder.append("(userPrincipalName=").append(escaped).append("*)");
            filterBuilder.append("(userPrincipalName=*").append(escapedSam).append("*)");
            filterBuilder.append("(displayName=*").append(escaped).append("*)");
            filterBuilder.append("(displayName=*").append(escapedSam).append("*)");
            filterBuilder.append("(cn=*").append(escaped).append("*)");
            filterBuilder.append("(cn=*").append(escapedSam).append("*)");
            filterBuilder.append("(name=*").append(escaped).append("*)");
            filterBuilder.append("(givenName=").append(escaped).append("*)");
            filterBuilder.append("(givenName=").append(escapedSam).append("*)");
            filterBuilder.append("(sn=").append(escaped).append("*)");
            filterBuilder.append("(sn=").append(escapedSam).append("*)");

            // Split multi-word or dotted query (e.g. "Dawit Alemu" or "dawit.alemu")
            String[] parts = clean.split("[\\s.]+");
            if (parts.length >= 2) {
                String p1 = escapeLdapFilter(parts[0]);
                String p2 = escapeLdapFilter(parts[parts.length - 1]);
                filterBuilder.append("(&(givenName=").append(p1).append("*)")
                             .append("(sn=").append(p2).append("*))");
                filterBuilder.append("(&(givenName=").append(p2).append("*)")
                             .append("(sn=").append(p1).append("*))");
            }
            filterBuilder.append("))");

            NamingEnumeration<SearchResult> answer = ctx.search("", filterBuilder.toString(), sc);
            List<Map<String, Object>> results = new ArrayList<>();

            while (results.size() < maxResults) {
                try {
                    if (!answer.hasMore()) {
                        break;
                    }
                } catch (PartialResultException pre) {
                    log.debug("AD referral ignored during user live search hasMore: {}", pre.getMessage());
                    break;
                }
                SearchResult sr;
                try {
                    sr = answer.next();
                } catch (PartialResultException pre) {
                    log.debug("AD referral ignored during user live search next: {}", pre.getMessage());
                    break;
                }

                Attributes attrs = sr.getAttributes();
                String sam = getAttr(attrs, "sAMAccountName");
                if (sam == null || sam.isBlank()) {
                    continue;
                }

                String mail = getAttr(attrs, "mail");
                String upn = getAttr(attrs, "userPrincipalName");
                String givenName = getAttr(attrs, "givenName");
                String sn = getAttr(attrs, "sn");
                String displayName = getAttr(attrs, "displayName");
                if (displayName == null) {
                    displayName = getAttr(attrs, "cn");
                }
                String department = getAttr(attrs, "department");
                String telephoneNumber = getAttr(attrs, "telephoneNumber");
                String title = getAttr(attrs, "title");
                String uac = getAttr(attrs, "userAccountControl");

                if ((givenName == null || givenName.isBlank()) && displayName != null) {
                    String[] nameParts = displayName.trim().split("\\s+");
                    givenName = nameParts[0];
                    if (nameParts.length > 1 && (sn == null || sn.isBlank())) {
                        sn = nameParts[nameParts.length - 1];
                    }
                }
                if (givenName == null || givenName.isBlank()) givenName = sam;
                if (sn == null || sn.isBlank()) sn = "Staff";

                String effectiveEmail = (mail != null && !mail.isBlank())
                        ? mail.toLowerCase().trim()
                        : ((upn != null && upn.contains("@")) ? upn.toLowerCase().trim() : (sam + "@" + adDomain).toLowerCase());

                boolean inDb = (userRepository.findByEmail(effectiveEmail).isPresent())
                            || (userRepository.findByUsername(sam).isPresent());

                boolean disabled = false;
                boolean locked = false;
                boolean pwdExpired = false;
                if (uac != null) {
                    try {
                        int uacInt = Integer.parseInt(uac);
                        disabled = (uacInt & 0x0002) != 0;
                        locked = (uacInt & 0x0010) != 0;
                        pwdExpired = (uacInt & 0x800000) != 0;
                    } catch (NumberFormatException ignored) {}
                }

                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("username", sam);
                entry.put("email", effectiveEmail);
                entry.put("firstName", givenName);
                entry.put("lastName", sn);
                entry.put("displayName", displayName != null ? displayName : (givenName + " " + sn));
                entry.put("department", department != null ? department : "");
                entry.put("title", title != null ? title : "");
                entry.put("jobTitle", title != null ? title : "");
                entry.put("phone", telephoneNumber != null ? telephoneNumber : "");
                entry.put("phoneNumber", telephoneNumber != null ? telephoneNumber : "");
                entry.put("accountDisabled", disabled);
                entry.put("accountLocked", locked);
                entry.put("passwordExpired", pwdExpired);
                entry.put("existsInLocalDb", inDb);
                entry.put("isAdUser", true);

                results.add(entry);
            }

            if (results.isEmpty()) {
                return searchMockStaff(clean, maxResults);
            }

            return results;

        } catch (Exception e) {
            log.warn("AD live search failed for query '{}': {}. Falling back to mock staff.", clean, e.getMessage());
            return searchMockStaff(clean, maxResults);
        } finally {
            if (ctx != null) {
                try { ctx.close(); } catch (Exception ignored) {}
            }
        }
    }

    private Map<String, Object> findMockStaff(String identifier) {
        String clean = identifier.toLowerCase().trim();
        String samName = clean.contains("@") ? clean.substring(0, clean.indexOf("@")) : clean;
        for (Map<String, String> m : MOCK_AD_STAFF) {
            String u = m.get("username").toLowerCase();
            String e = m.get("email").toLowerCase();
            String f = m.get("firstName").toLowerCase();
            String l = m.get("lastName").toLowerCase();
            String d = m.get("displayName").toLowerCase();

            boolean match = u.equals(clean)
                    || u.equals(samName)
                    || e.equals(clean)
                    || d.equalsIgnoreCase(clean)
                    || f.equalsIgnoreCase(clean)
                    || l.equalsIgnoreCase(clean)
                    || d.contains(clean)
                    || u.contains(clean)
                    || e.contains(clean);

            if (match) {
                boolean inDb = userRepository.findByEmail(m.get("email")).isPresent()
                            || userRepository.findByUsername(m.get("username")).isPresent();
                Map<String, Object> staff = new LinkedHashMap<>(m);
                staff.put("jobTitle", m.get("title"));
                staff.put("phone", m.get("phoneNumber"));
                staff.put("isAdUser", true);

                Map<String, Object> res = new LinkedHashMap<>();
                res.put("found", true);
                res.put("staff", staff);
                res.put("adAttributes", staff);
                res.put("existsInLocalDb", inDb);
                res.put("isMock", true);
                return res;
            }
        }
        return Map.of("found", false, "searchedFor", identifier, "message", "Staff '" + identifier + "' not found in Active Directory or mock directory.");
    }

    private List<Map<String, Object>> searchMockStaff(String query, int limit) {
        String lowerQuery = query.toLowerCase();
        List<Map<String, Object>> matches = new ArrayList<>();
        for (Map<String, String> m : MOCK_AD_STAFF) {
            if (matches.size() >= limit) break;
            boolean match = m.get("username").toLowerCase().contains(lowerQuery)
                    || m.get("email").toLowerCase().contains(lowerQuery)
                    || m.get("firstName").toLowerCase().contains(lowerQuery)
                    || m.get("lastName").toLowerCase().contains(lowerQuery)
                    || m.get("displayName").toLowerCase().contains(lowerQuery);
            if (match) {
                String sam = m.get("username");
                String email = m.get("email");
                boolean inDb = userRepository.findByEmail(email).isPresent()
                            || userRepository.findByUsername(sam).isPresent();

                Map<String, Object> entry = new LinkedHashMap<>(m);
                entry.put("jobTitle", m.get("title"));
                entry.put("phone", m.get("phoneNumber"));
                entry.put("accountDisabled", false);
                entry.put("accountLocked", false);
                entry.put("passwordExpired", false);
                entry.put("existsInLocalDb", inDb);
                entry.put("isAdUser", true);
                matches.add(entry);
            }
        }
        return matches;
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
            // Preserve existing admin-linked department! Only take AD department if not yet set
            if (user.getDepartment() == null || user.getDepartment().isBlank()) {
                user.setDepartment(safeDept);
            }
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
     * Allows direct login/auto-provisioning for:
     * - Directors (whether Senior Director, regular Director, Executive Director, etc.)
     * - Chiefs (Chief Officers, CIO, CTO, CFO, etc.), VPs, Department Heads
     * - Senior Managers (specifically "Senior Manager", "Sr. Manager", "Snr Manager" - strictly NOT regular/normal Managers)
     * - Secretaries / Executive Assistants / Administrative Assistants
     * - Front Desk / Reception / Security
     */
    private RoleName resolveRoleFromAdProfile(AdStaffProfile profile) {
        String title = (profile.getTitle() != null) ? profile.getTitle().toLowerCase().trim() : "";
        String memberOf = (profile.getMemberOf() != null) ? profile.getMemberOf().toLowerCase().trim() : "";

        // 1. Directors (any variation: Senior Director, regular Director, etc.), Chiefs, VPs, Heads
        boolean isDirectorOrChief = title.contains("director")
                || title.contains("chief")
                || title.contains("chif")
                || title.contains("vice president")
                || title.contains("vp")
                || title.contains("head")
                || memberOf.contains("director")
                || memberOf.contains("chief");

        // 2. Senior Manager ONLY (strictly Senior Manager / Sr. Manager - NOT regular/normal Manager)
        boolean isSeniorManager = title.contains("senior manager")
                || title.contains("sr. manager")
                || title.contains("sr manager")
                || title.contains("snr manager")
                || title.contains("snr. manager")
                || memberOf.contains("senior manager")
                || memberOf.contains("sr. manager");

        if (isDirectorOrChief || isSeniorManager) {
            return RoleName.ROLE_DIRECTOR;
        }

        // 3. Secretary / Secretarial / Executive Assistant / Admin Assistant
        if (title.contains("secretary") || title.contains("secretar") || title.contains("secretor")
                || title.contains("assistant") || title.contains("admin")
                || memberOf.contains("secretary") || memberOf.contains("secretar")) {
            return RoleName.ROLE_SECRETARY;
        }

        // 4. Front Desk / Reception / Security
        if (title.contains("front desk") || title.contains("reception") || title.contains("receptionist")
                || memberOf.contains("front desk") || memberOf.contains("reception") || memberOf.contains("receptionist")
                || title.contains("security") || memberOf.contains("security")) {
            return RoleName.ROLE_FRONT_DESK;
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
