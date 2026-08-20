package com.example.coop_vsit_hub.user_and_auth.dto;

import lombok.*;

import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private UUID id;
    private String username;
    private String email;
    private String firstName;
    private String middleName;
    private String lastName;
    private String fullName;
    private String department;
    private String phoneNumber;
    private boolean isEnabled;
    private boolean isAccountNonLocked;
    private Set<String> roles;
}
