package com.Noter.Noter.service;
import com.Noter.Noter.dto.*;
import org.springframework.stereotype.Service;
import com.Noter.Noter.entity.NoteEntity;
import com.Noter.Noter.repository.NoteRepository;
import com.Noter.Noter.exception.NoteNotFoundException;


import java.util.List;

@Service
public class NoteService {

    private final NoteRepository repo;

    public NoteService(NoteRepository repo) {
        this.repo = repo;
    }

    public List<NoteResponse> list() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public NoteResponse get(Long id) {
        var entity = repo.findById(id)
                .orElseThrow(() -> new NoteNotFoundException(id));
        return toResponse(entity);
    }

    public NoteResponse create(NoteCreateRequest req) {
        var entity = new NoteEntity(req.title(), req.content());
        var saved = repo.save(entity);
        return toResponse(saved);
    }

    public NoteResponse update(Long id, NoteUpdateRequest req) {
        var entity = repo.findById(id)
                .orElseThrow(() -> new NoteNotFoundException(id));
        entity.setTitle(req.title());
        entity.setContent(req.content());
        var saved = repo.save(entity);
        return toResponse(saved);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) throw new NoteNotFoundException(id);
        repo.deleteById(id);
    }

    private NoteResponse toResponse(NoteEntity e) {
        return new NoteResponse(e.getId(), e.getTitle(), e.getContent(), e.getCreatedAt(), e.getUpdatedAt());
    }
}