package com.Noter.Noter.service;

import com.Noter.Noter.dto.NoteCreateRequest;
import com.Noter.Noter.dto.NoteResponse;
import com.Noter.Noter.dto.NoteUpdateRequest;
import com.Noter.Noter.entity.Note;
import com.Noter.Noter.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NoteService {
    
    @Autowired
    private NoteRepository noteRepository;
    
    public NoteResponse createNote(String walletAddress, NoteCreateRequest request) {
        Note note = new Note(walletAddress, request.getText());
        Note savedNote = noteRepository.save(note);
        return new NoteResponse(savedNote);
    }
    
    public List<NoteResponse> getNotesByWalletAddress(String walletAddress) {
        List<Note> notes = noteRepository.findByWalletAddressOrderByCreatedAtDesc(walletAddress);
        return notes.stream()
                .map(NoteResponse::new)
                .collect(Collectors.toList());
    }
    
    public NoteResponse updateNote(UUID noteId, String walletAddress, NoteUpdateRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        
        if (!note.getWalletAddress().equals(walletAddress)) {
            throw new RuntimeException("You can only update your own notes");
        }
        
        note.setText(request.getText());
        Note updatedNote = noteRepository.save(note);
        return new NoteResponse(updatedNote);
    }
    
    public void deleteNote(UUID noteId, String walletAddress) {
        if (!noteRepository.existsByIdAndWalletAddress(noteId, walletAddress)) {
            throw new RuntimeException("Note not found or you don't have permission to delete it");
        }
        
        noteRepository.deleteById(noteId);
    }
}
