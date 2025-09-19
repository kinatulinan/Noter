package com.Noter.Noter.controller;

import com.Noter.Noter.dto.NoteCreateRequest;
import com.Noter.Noter.dto.NoteResponse;
import com.Noter.Noter.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blockchain")
@CrossOrigin(origins = "http://localhost:5173")
public class BlockchainController {

    private final NoteService noteService;

    public BlockchainController(NoteService noteService) {
        this.noteService = noteService;
    }

    @PostMapping("/notes")
    public ResponseEntity<NoteResponse> storeBlockchainNote(@Valid @RequestBody NoteCreateRequest req) {
        // Validate blockchain-specific fields
        if (req.blockchainTxHash() == null || req.blockchainTxHash().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        var created = noteService.create(req);
        return ResponseEntity.created(URI.create("/api/blockchain/notes/" + created.id())).body(created);
    }

    @GetMapping("/notes/user/{email}")
    public List<NoteResponse> getUserBlockchainNotes(@PathVariable String email) {
        return noteService.list().stream()
                .filter(note -> note.authorEmail().equalsIgnoreCase(email))
                .filter(note -> Boolean.TRUE.equals(note.isBlockchainNote()))
                .toList();
    }

    @GetMapping("/verify/{txHash}")
    public ResponseEntity<Map<String, Object>> verifyTransaction(@PathVariable String txHash) {
        // In a real implementation, this would verify the transaction on the blockchain
        // For now, we'll simulate verification
        var notes = noteService.list().stream()
                .filter(note -> txHash.equals(note.blockchainTxHash()))
                .toList();

        if (notes.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var response = Map.of(
                "verified", true,
                "transactionHash", txHash,
                "noteCount", notes.size(),
                "notes", notes
        );

        return ResponseEntity.ok(response);
    }
}