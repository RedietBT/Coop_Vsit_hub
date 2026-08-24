package com.example.coop_vsit_hub.master_data.dto;

import com.example.coop_vsit_hub.master_data.entity.PartnershipCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnershipCategoryDto {
    private UUID id;
    private String name;
    private String description;
    private Boolean isActive;
    private Instant createdAt;

    public static PartnershipCategoryDto from(PartnershipCategory entity) {
        if (entity == null) return null;
        return PartnershipCategoryDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
