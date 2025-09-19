package com.Noter.Noter.dto;

import com.Noter.Noter.entity.Note;
import java.time.LocalDateTime;
import java.util.UUID;

public class NoteResponse {
    
    private UUID id;
    private String walletAddress;
    private String text;
    private LocalDateTime createdAt;
    
    public NoteResponse() {}
    
    public NoteResponse(Note note) {
        this.id = note.getId();
        this.walletAddress = note.getWalletAddress();
        this.text = note.getText();
        this.createdAt = note.getCreatedAt();
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getWalletAddress() {
        return walletAddress;
    }
    
    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }
    
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
