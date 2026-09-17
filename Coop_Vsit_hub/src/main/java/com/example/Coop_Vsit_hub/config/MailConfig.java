package com.example.coop_vsit_hub.config;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Mail configuration that provides a real SMTP JavaMailSender when spring.mail.host
 * is configured, or a no-op fallback when SMTP is unavailable (e.g. Render cloud
 * cannot reach the bank's internal mail relay at 10.12.150.151).
 * This prevents the app from crashing at startup when SMTP is unreachable.
 */
@Configuration
@Slf4j
public class MailConfig {

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private String smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private String starttlsEnable;

    @Bean
    @ConditionalOnMissingBean(JavaMailSender.class)
    public JavaMailSender javaMailSender() {
        if (mailHost == null || mailHost.isBlank()) {
            log.warn("spring.mail.host is not configured — email sending will be disabled. " +
                     "Set SPRING_MAIL_HOST env variable to enable email notifications.");
            return noOpMailSender();
        }

        try {
            JavaMailSenderImpl sender = new JavaMailSenderImpl();
            sender.setHost(mailHost);
            sender.setPort(mailPort);

            if (mailUsername != null && !mailUsername.isBlank()) {
                sender.setUsername(mailUsername);
            }
            if (mailPassword != null && !mailPassword.isBlank()) {
                sender.setPassword(mailPassword);
            }

            Properties props = sender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", smtpAuth);
            props.put("mail.smtp.starttls.enable", starttlsEnable);
            props.put("mail.smtp.connectiontimeout", "5000");
            props.put("mail.smtp.timeout", "5000");
            props.put("mail.smtp.writetimeout", "5000");

            log.info("JavaMailSender configured with host: {}:{}", mailHost, mailPort);
            return sender;
        } catch (Exception e) {
            log.warn("Failed to configure JavaMailSender ({}). Email sending will be disabled.", e.getMessage());
            return noOpMailSender();
        }
    }

    /**
     * No-op mail sender that logs a warning instead of crashing when SMTP is unavailable.
     * Used on Render cloud where the bank's internal SMTP relay is not reachable.
     */
    private JavaMailSender noOpMailSender() {
        return new JavaMailSender() {
            @Override
            public MimeMessage createMimeMessage() {
                return new MimeMessage((Session) null);
            }

            @Override
            public MimeMessage createMimeMessage(java.io.InputStream contentStream) throws MailException {
                return new MimeMessage((Session) null);
            }

            @Override
            public void send(MimeMessage mimeMessage) throws MailException {
                log.warn("Email sending skipped — SMTP not configured (no-op mail sender active).");
            }

            @Override
            public void send(MimeMessage... mimeMessages) throws MailException {
                log.warn("Email sending skipped — SMTP not configured (no-op mail sender active).");
            }

            @Override
            public void send(SimpleMailMessage simpleMessage) throws MailException {
                log.warn("Email sending skipped — SMTP not configured (no-op mail sender active).");
            }

            @Override
            public void send(SimpleMailMessage... simpleMessages) throws MailException {
                log.warn("Email sending skipped — SMTP not configured (no-op mail sender active).");
            }
        };
    }
}
