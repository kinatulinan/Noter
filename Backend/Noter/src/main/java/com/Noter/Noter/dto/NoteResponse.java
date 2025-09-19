package com.Noter.Noter.dto;

import java.time.Instant;

public record NoteResponse(
        Long id,
        String title,
        String content,
        Instant createdAt,
        Instant updatedAt,
        String authorName,
        String authorEmail,
        String blockchainTxHash,
        Long blockchainNoteId,
        Boolean isBlockchainNote
) {}

