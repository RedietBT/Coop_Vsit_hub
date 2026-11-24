package com.example.coop_vsit_hub.notification_management.service;

import com.example.coop_vsit_hub.notification_management.dto.EmailTemplateDto;
import com.example.coop_vsit_hub.notification_management.model.EmailTemplate;
import com.example.coop_vsit_hub.notification_management.repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Admin-editable content for the guest emails. Built-in defaults are used for any blank field.
 * Admin text is treated as plain text (HTML-escaped, line breaks kept), so it can never inject markup.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateService {

    public static final String INVITE = "GUEST_INVITE";
    public static final String RESCHEDULE = "GUEST_RESCHEDULE";
    public static final String CANCEL = "GUEST_CANCEL";
    public static final String BRANDING = "BRANDING";

    public static final List<String> PLACEHOLDERS = List.of(
            "guestName", "hostName", "hostDept", "hostEmail", "hostPhone", "meetingTitle", "roomName",
            "location", "startTime", "endTime", "previousStartTime", "bookingCode", "reason");

    private static final String DEFAULT_ACCENT = "#00adef";
    private static final String CANCEL_ACCENT = "#b91c1c";
    private static final String DEFAULT_SIGNATURE = "Kind regards,\nCooperative Bank of Oromia\nExecutive Visit Hub";
    private static final Pattern COLOR = Pattern.compile("^#[0-9a-fA-F]{6}$");

    private final EmailTemplateRepository repository;

    private static final Map<String, String[]> DEFAULTS = new LinkedHashMap<>();
    // order: subject, headline, intro, footerNote
    static {
        DEFAULTS.put(INVITE, new String[]{
                "Meeting Invitation: {{meetingTitle}} | {{startTime}}",
                "Meeting Invitation",
                "You have been invited to a meeting by {{hostName}} from {{hostDept}} at Cooperative Bank of Oromia. "
                        + "The details are below. Open the attached calendar file to add it to your calendar.",
                "Please arrive 10 minutes early and bring a valid ID; you will be registered at the front desk on arrival."});
        DEFAULTS.put(RESCHEDULE, new String[]{
                "Meeting Rescheduled: {{meetingTitle}} | {{startTime}}",
                "Meeting Rescheduled",
                "The time of your meeting with {{hostName}} from {{hostDept}} at Cooperative Bank of Oromia has changed. "
                        + "Please note the new time below. The attached calendar file will update the existing entry in your calendar.",
                "Please arrive 10 minutes early and bring a valid ID; you will be registered at the front desk on arrival."});
        DEFAULTS.put(CANCEL, new String[]{
                "Meeting Cancelled: {{meetingTitle}} | {{startTime}}",
                "Meeting Cancelled",
                "We regret to inform you that the meeting below with {{hostName}} from {{hostDept}} has been cancelled. "
                        + "The calendar entry attached to this email will remove it from your calendar.",
                "We apologise for any inconvenience. Please contact your host if you would like to reschedule."});
    }

    /** Fully resolved content ready to be placed in the email. */
    public record Rendered(String subject, String headline, String introHtml, String footerHtml,
                           String signatureHtml, String logoUrl, String accentColor) {}

    // ------------------------------------------------------------------ rendering

    @Transactional(readOnly = true)
    public Rendered render(String key, Map<String, String> values) {
        String[] d = DEFAULTS.get(key);
        EmailTemplate t = repository.findById(key).orElse(null);
        EmailTemplate b = repository.findById(BRANDING).orElse(null);

        String subject = pick(t != null ? t.getSubject() : null, d[0]);
        String headline = pick(t != null ? t.getHeadline() : null, d[1]);
        String intro = pick(t != null ? t.getIntro() : null, d[2]);
        String footer = pick(t != null ? t.getFooterNote() : null, d[3]);
        String signature = pick(b != null ? b.getSignature() : null, DEFAULT_SIGNATURE);

        String accent = CANCEL.equals(key) ? CANCEL_ACCENT : DEFAULT_ACCENT;
        if (!CANCEL.equals(key) && b != null && b.getAccentColor() != null && COLOR.matcher(b.getAccentColor()).matches()) {
            accent = b.getAccentColor();
        }
        String logo = b != null && isHttp(b.getLogoUrl()) ? b.getLogoUrl().trim() : null;

        // A missing department should not leave a dangling "from".
        boolean noDept = values.get("hostDept") == null || values.get("hostDept").isBlank();
        if (noDept) {
            intro = intro.replaceAll("\\s+from\\s+\\{\\{hostDept\\}\\}", "");
        }

        return new Rendered(
                oneLine(fill(subject, values, false, false)),
                oneLine(fill(headline, values, true, false)),
                fill(intro, values, true, true),
                fill(footer, values, true, true),
                fill(signature, values, true, true),
                logo,
                accent);
    }

    private static String pick(String custom, String fallback) {
        return custom != null && !custom.isBlank() ? custom.trim() : fallback;
    }

    private static String oneLine(String s) {
        return s.replaceAll("[\\r\\n]+", " ").trim();
    }

    private static String fill(String template, Map<String, String> values, boolean html, boolean bold) {
        String text = html ? HtmlUtils.htmlEscape(template) : template;
        for (String p : PLACEHOLDERS) {
            String raw = values.getOrDefault(p, "");
            String v = html ? HtmlUtils.htmlEscape(raw == null ? "" : raw) : (raw == null ? "" : raw);
            if (html && bold && ("hostName".equals(p) || "hostDept".equals(p)) && !v.isEmpty()) {
                v = "<strong>" + v + "</strong>";
            }
            text = text.replace("{{" + p + "}}", v);
        }
        if (html) {
            text = text.replace("\r\n", "\n").replace("\n", "<br/>");
        }
        return text;
    }

    private static boolean isHttp(String url) {
        if (url == null) return false;
        String l = url.trim().toLowerCase();
        return l.startsWith("https://") || l.startsWith("http://");
    }

    // ------------------------------------------------------------------ admin API

    @Transactional(readOnly = true)
    public List<EmailTemplateDto> listAll() {
        List<EmailTemplateDto> out = new ArrayList<>();
        out.add(toDto(INVITE, "Guest invitation", "Sent to guests when a meeting is booked or they are added later."));
        out.add(toDto(RESCHEDULE, "Guest reschedule", "Sent to guests when the meeting time changes."));
        out.add(toDto(CANCEL, "Guest cancellation", "Sent to guests when the meeting is cancelled or they are removed."));
        out.add(toDto(BRANDING, "Branding (all guest emails)", "Logo, accent colour and signature used in every guest email."));
        return out;
    }

    private EmailTemplateDto toDto(String key, String label, String description) {
        EmailTemplate t = repository.findById(key).orElse(null);
        EmailTemplateDto.EmailTemplateDtoBuilder b = EmailTemplateDto.builder()
                .key(key).label(label).description(description)
                .customized(t != null)
                .placeholders(BRANDING.equals(key) ? List.of() : PLACEHOLDERS);
        if (BRANDING.equals(key)) {
            b.signature(pick(t != null ? t.getSignature() : null, DEFAULT_SIGNATURE))
                    .logoUrl(t != null && t.getLogoUrl() != null ? t.getLogoUrl() : "")
                    .accentColor(t != null && t.getAccentColor() != null && !t.getAccentColor().isBlank()
                            ? t.getAccentColor() : DEFAULT_ACCENT);
        } else {
            String[] d = DEFAULTS.get(key);
            b.subject(pick(t != null ? t.getSubject() : null, d[0]))
                    .headline(pick(t != null ? t.getHeadline() : null, d[1]))
                    .intro(pick(t != null ? t.getIntro() : null, d[2]))
                    .footerNote(pick(t != null ? t.getFooterNote() : null, d[3]));
        }
        return b.build();
    }

    @Transactional
    public EmailTemplateDto save(String key, EmailTemplateDto in, String updatedBy) {
        if (!INVITE.equals(key) && !RESCHEDULE.equals(key) && !CANCEL.equals(key) && !BRANDING.equals(key)) {
            throw new IllegalArgumentException("Unknown email template: " + key);
        }
        EmailTemplate t = repository.findById(key).orElseGet(() -> EmailTemplate.builder().templateKey(key).build());
        if (BRANDING.equals(key)) {
            String logo = in.getLogoUrl() == null ? "" : in.getLogoUrl().trim();
            if (!logo.isEmpty() && !isHttp(logo)) {
                throw new IllegalArgumentException("Logo URL must start with http:// or https://");
            }
            String color = in.getAccentColor() == null ? "" : in.getAccentColor().trim();
            if (!color.isEmpty() && !COLOR.matcher(color).matches()) {
                throw new IllegalArgumentException("Accent colour must look like #00adef");
            }
            t.setLogoUrl(logo.isEmpty() ? null : logo);
            t.setAccentColor(color.isEmpty() ? null : color);
            t.setSignature(blankToNull(in.getSignature(), 1000));
        } else {
            t.setSubject(blankToNull(in.getSubject(), 300));
            t.setHeadline(blankToNull(in.getHeadline(), 200));
            t.setIntro(blankToNull(in.getIntro(), 3000));
            t.setFooterNote(blankToNull(in.getFooterNote(), 2000));
        }
        t.setUpdatedBy(updatedBy);
        repository.save(t);
        return listAll().stream().filter(x -> x.getKey().equals(key)).findFirst().orElseThrow();
    }

    @Transactional
    public void reset(String key) {
        if (repository.existsById(key)) {
            repository.deleteById(key);
        }
    }

    private static String blankToNull(String s, int max) {
        if (s == null || s.isBlank()) return null;
        String v = s.trim();
        if (v.length() > max) throw new IllegalArgumentException("Text is too long (max " + max + " characters).");
        return v;
    }
}
