package com.Noter.Noter.exception;

public class NoteNotFoundException extends RuntimeException {
    public NoteNotFoundException(Long id) {
        super("Note not found: " + id);
    }
}