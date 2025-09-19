package com.Noter.Noter.controller;

import com.Noter.Noter.dto.NoteCreateRequest;
import com.Noter.Noter.dto.NoteResponse;
import com.Noter.Noter.dto.NoteUpdateRequest;
import com.Noter.Noter.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "http://localhost:5173")
public class NoteController {
    
    @Autowired
    private NoteService noteService;
    
    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            @RequestHeader("X-Wallet-Address") String walletAddress,
            @Valid @RequestBody NoteCreateRequest request) {
        NoteResponse note = noteService.createNote(walletAddress, request);
        return ResponseEntity.ok(note);
    }
    
    @GetMapping("/{walletAddress}")
    public ResponseEntity<List<NoteResponse>> getNotesByWalletAddress(@PathVariable String walletAddress) {
        List<NoteResponse> notes = noteService.getNotesByWalletAddress(walletAddress);
        return ResponseEntity.ok(notes);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(
            @PathVariable UUID id,
            @RequestHeader("X-Wallet-Address") String walletAddress,
            @Valid @RequestBody NoteUpdateRequest request) {
        NoteResponse note = noteService.updateNote(id, walletAddress, request);
        return ResponseEntity.ok(note);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNote(
            @PathVariable UUID id,
            @RequestHeader("X-Wallet-Address") String walletAddress) {
        noteService.deleteNote(id, walletAddress);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Note deleted successfully");
        return ResponseEntity.ok(response);
    }
}
