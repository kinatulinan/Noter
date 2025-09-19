package com.Noter.Noter.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoteCreateRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content,
        @NotBlank @Email String authorEmail,
        String authorName, // optional; if null we'll derive from email
        String blockchainTxHash, // optional blockchain transaction hash
        Long blockchainNoteId, // optional blockchain note ID
        Boolean isBlockchainNote // optional flag for blockchain notes
) {}

