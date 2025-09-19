package com.Noter.Noter.entity;

import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "notes")
public class NoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Store creator information directly (keeps things simple; no FK required)
    @Column(nullable = false, length = 150)
    private String authorEmail;

    @Column(nullable = false, length = 150)
    private String authorName;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)

    private Instant updatedAt;

    // Blockchain integration fields
    @Column(length = 66) // Ethereum transaction hash length
    private String blockchainTxHash;

    @Column
    private Long blockchainNoteId;

    @Column
    private Boolean isBlockchainNote = false;

    public NoteEntity() {}



    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getAuthorEmail() { return authorEmail; }
    public void setAuthorEmail(String authorEmail) { this.authorEmail = authorEmail; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    
    // Blockchain getters and setters
    public String getBlockchainTxHash() { return blockchainTxHash; }
    public void setBlockchainTxHash(String blockchainTxHash) { this.blockchainTxHash = blockchainTxHash; }
    public Long getBlockchainNoteId() { return blockchainNoteId; }
    public void setBlockchainNoteId(Long blockchainNoteId) { this.blockchainNoteId = blockchainNoteId; }
    public Boolean getIsBlockchainNote() { return isBlockchainNote; }
    public void setIsBlockchainNote(Boolean isBlockchainNote) { this.isBlockchainNote = isBlockchainNote; }
}
