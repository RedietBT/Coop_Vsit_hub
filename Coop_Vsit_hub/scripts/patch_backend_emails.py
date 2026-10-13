import os

email_service_impl = "/home/elshadayz/Coop_Vsit_hub/Coop_Vsit_hub/src/main/java/com/example/Coop_Vsit_hub/user_and_auth/service/EmailServiceImpl.java"
room_booking_service_impl = "/home/elshadayz/Coop_Vsit_hub/Coop_Vsit_hub/src/main/java/com/example/Coop_Vsit_hub/room_booking_management/service/RoomBookingServiceImpl.java"

# 1. Update EmailServiceImpl.java
if os.path.exists(email_service_impl):
    with open(email_service_impl, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace raw toString with formatEmailDate in sendRoomBookingAdminNotification and sendRoomBookingSecretaryNotification
    old_target = """            String formattedStart = startTime != null ? startTime.toString() : "Scheduled Time";
            String formattedEnd = endTime != null ? endTime.toString() : "Scheduled Time";"""
    new_target = """            String formattedStart = formatEmailDate(startTime);
            String formattedEnd = formatEmailDate(endTime);"""
    
    if old_target in content:
        content = content.replace(old_target, new_target)
        with open(email_service_impl, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated EmailServiceImpl.java successfully.")
    else:
        print("EmailServiceImpl.java already updated or pattern not found.")

# 2. Update RoomBookingServiceImpl.java
if os.path.exists(room_booking_service_impl):
    with open(room_booking_service_impl, "r", encoding="utf-8") as f:
        content = f.read()

    old_admin_loop = """                    log.info("Sending room booking email notification for room '{}' to {} admin(s): {}",
                            saved.getRoomName(), adminEmails.size(), adminEmails);

                    for (String aEmail : adminEmails) {
                        try {
                            emailService.sendRoomBookingAdminNotification(
                                    aEmail,
                                    saved.getRoomName(),
                                    saved.getBookedByName(),
                                    saved.getHostDepartment(),
                                    saved.getBookingCode(),
                                    saved.getMeetingTitle(),
                                    saved.getGuestName(),
                                    saved.getGuestOrganizationName(),
                                    saved.getScheduledStartTime(),
                                    saved.getScheduledEndTime(),
                                    saved.getMeetingAgenda(),
                                    saved.getExpectedAttendees()
                            );
                        } catch (Exception e) {
                            log.warn("Failed to send admin room booking email to {} for {}: {}", aEmail, bookingCode, e.getMessage());
                        }
                    }

                    // 1. Dispatch booking confirmation to the booker
                    if (StringUtils.hasText(saved.getBookedByEmail())) {
                        try {
                            emailService.sendRoomBookingBookerConfirmation(
                                    saved.getBookedByEmail().trim(),
                                    saved.getBookedByName(),
                                    saved.getRoomName(),
                                    saved.getBookingCode(),
                                    saved.getMeetingTitle(),
                                    saved.getScheduledStartTime(),
                                    saved.getScheduledEndTime(),
                                    saved.getMeetingAgenda(),
                                    saved.getExpectedAttendees() != null ? saved.getExpectedAttendees() : 1,
                                    saved.getHostDepartment()
                            );
                        } catch (Exception e) {
                            log.warn("Failed to send booker confirmation for {}: {}", bookingCode, e.getMessage());
                        }
                    }"""

    new_admin_loop = """                    // Deduplicate email recipients: each individual receives exactly ONE email per booking
                    java.util.Set<String> alreadyEmailed = new java.util.HashSet<>();

                    // 1. Dispatch booking confirmation to the reserving staff member FIRST
                    if (StringUtils.hasText(saved.getBookedByEmail())) {
                        String bookerEmail = saved.getBookedByEmail().trim().toLowerCase();
                        try {
                            emailService.sendRoomBookingBookerConfirmation(
                                    saved.getBookedByEmail().trim(),
                                    saved.getBookedByName(),
                                    saved.getRoomName(),
                                    saved.getBookingCode(),
                                    saved.getMeetingTitle(),
                                    saved.getScheduledStartTime(),
                                    saved.getScheduledEndTime(),
                                    saved.getMeetingAgenda(),
                                    saved.getExpectedAttendees() != null ? saved.getExpectedAttendees() : 1,
                                    saved.getHostDepartment()
                            );
                            alreadyEmailed.add(bookerEmail);
                        } catch (Exception e) {
                            log.warn("Failed to send booker confirmation for {}: {}", bookingCode, e.getMessage());
                        }
                    }

                    // 2. Dispatch alert to System Admins (skipping booker if booker is an admin to prevent duplicate emails)
                    List<String> distinctAdminEmails = adminEmails.stream()
                            .filter(StringUtils::hasText)
                            .map(String::trim)
                            .filter(email -> !alreadyEmailed.contains(email.toLowerCase()))
                            .distinct()
                            .toList();

                    log.info("Sending room booking email notification for room '{}' to {} admin(s): {}",
                            saved.getRoomName(), distinctAdminEmails.size(), distinctAdminEmails);

                    for (String aEmail : distinctAdminEmails) {
                        try {
                            emailService.sendRoomBookingAdminNotification(
                                    aEmail,
                                    saved.getRoomName(),
                                    saved.getBookedByName(),
                                    saved.getHostDepartment(),
                                    saved.getBookingCode(),
                                    saved.getMeetingTitle(),
                                    saved.getGuestName(),
                                    saved.getGuestOrganizationName(),
                                    saved.getScheduledStartTime(),
                                    saved.getScheduledEndTime(),
                                    saved.getMeetingAgenda(),
                                    saved.getExpectedAttendees()
                            );
                            alreadyEmailed.add(aEmail.toLowerCase());
                        } catch (Exception e) {
                            log.warn("Failed to send admin room booking email to {} for {}: {}", aEmail, bookingCode, e.getMessage());
                        }
                    }"""

    if old_admin_loop in content:
        content = content.replace(old_admin_loop, new_admin_loop)
        # Also ensure concerned department staff loop checks alreadyEmailed
        old_concerned_check = """                        // Skip booker if they booked their own room to avoid duplicate emails
                        if (StringUtils.hasText(saved.getBookedByEmail()) && StringUtils.hasText(deptUser.getEmail())
                                && deptUser.getEmail().equalsIgnoreCase(saved.getBookedByEmail().trim())) {
                            continue;
                        }"""
        new_concerned_check = """                        // Skip recipient if they already received an email (booker or admin)
                        if (StringUtils.hasText(deptUser.getEmail()) && alreadyEmailed.contains(deptUser.getEmail().trim().toLowerCase())) {
                            continue;
                        }"""
        if old_concerned_check in content:
            content = content.replace(old_concerned_check, new_concerned_check)
        
        with open(room_booking_service_impl, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated RoomBookingServiceImpl.java successfully.")
    else:
        print("RoomBookingServiceImpl.java pattern not matched.")
