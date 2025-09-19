package com.Noter.Noter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoteUpdateRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content
) {}