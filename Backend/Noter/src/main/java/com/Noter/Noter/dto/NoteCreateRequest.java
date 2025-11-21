package com.Noter.Noter.dto;

import jakarta.validation.constraints.NotBlank;

public class NoteCreateRequest {
    
    @NotBlank(message = "Note text is required")
    private String text;
    
    public NoteCreateRequest() {}
    
    public NoteCreateRequest(String text) {
        this.text = text;
    }
    
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
}
