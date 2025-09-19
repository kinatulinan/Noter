package com.Noter.Noter.dto;

import jakarta.validation.constraints.NotBlank;

public class NoteUpdateRequest {
    
    @NotBlank(message = "Note text is required")
    private String text;
    
    public NoteUpdateRequest() {}
    
    public NoteUpdateRequest(String text) {
        this.text = text;
    }
    
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
}
