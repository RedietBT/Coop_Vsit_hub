package com.example.coop_vsit_hub.notification_management.service;

import com.example.coop_vsit_hub.notification_management.model.EmailLog;
import com.example.coop_vsit_hub.notification_management.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailLogService {

    private final EmailLogRepository repository;

    /** Never throws: a logging problem must not break a booking. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String bookingCode, String roomName, String meetingTitle, String recipientName,
                       String recipientEmail, String emailType, boolean sent, String error, String triggeredBy) {
        try {
            repository.save(EmailLog.builder()
                    .bookingCode(bookingCode)
                    .roomName(roomName)
                    .meetingTitle(meetingTitle)
                    .recipientName(recipientName)
                    .recipientEmail(recipientEmail)
                    .emailType(emailType)
                    .status(sent ? "SENT" : "FAILED")
                    .errorMessage(sent ? null : error)
                    .triggeredBy(triggeredBy)
                    .build());
        } catch (Exception e) {
            log.warn("Could not write email log entry for {}: {}", recipientEmail, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<EmailLog> search(String status, String search, int page, int size) {
        String s = "%" + (search == null ? "" : search.trim().toLowerCase()) + "%";
        String st = status == null ? "" : status.trim().toUpperCase();
        return repository.search(st, s, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt")));
    }
}
