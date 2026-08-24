package com.example.coop_vsit_hub.master_data.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePartnershipCategoryRequest {

    @NotBlank(message = "Category name is required.")
    @Size(min = 2, max = 150, message = "Category name must be between 2 and 150 characters.")
    private String name;

    private String description;
}
