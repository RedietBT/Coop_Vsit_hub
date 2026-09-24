package com.example.coop_vsit_hub.user_and_auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Generic Paginated Response Container for REST APIs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;

    @JsonProperty("isFirst")
    private boolean isFirst;

    @JsonProperty("isLast")
    private boolean isLast;

    private boolean hasNext;
    private boolean hasPrevious;

    @JsonProperty("isFirst")
    public boolean isFirst() {
        return isFirst;
    }

    @JsonProperty("isFirst")
    public void setFirst(boolean isFirst) {
        this.isFirst = isFirst;
    }

    @JsonProperty("first")
    public boolean getFirst() {
        return isFirst;
    }

    @JsonProperty("isLast")
    public boolean isLast() {
        return isLast;
    }

    @JsonProperty("isLast")
    public void setLast(boolean isLast) {
        this.isLast = isLast;
    }

    @JsonProperty("last")
    public boolean getLast() {
        return isLast;
    }

    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}

