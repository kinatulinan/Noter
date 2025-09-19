package com.Noter.Noter.service;

import com.Noter.Noter.entity.NoteEntity;
import com.Noter.Noter.dto.NoteCreateRequest;
import com.Noter.Noter.dto.NoteUpdateRequest;
import com.Noter.Noter.dto.NoteResponse;
import com.Noter.Noter.repository.NoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

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
        var e = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found: " + id));
        return toResponse(e);
    }

    public NoteResponse create(NoteCreateRequest req) {
        var email = req.authorEmail().toLowerCase(Locale.ROOT);
        var name = (req.authorName() != null && !req.authorName().isBlank())
                ? req.authorName()
                : email.split("@")[0];
        var e = new NoteEntity();
        e.setTitle(req.title());
        e.setContent(req.content());
        e.setAuthorEmail(email);
        e.setAuthorName(name);
        var saved = repo.save(e);
        return toResponse(saved);
    }

    public NoteResponse update(Long id, NoteUpdateRequest req) {
        var e = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found: " + id));
        var actorEmail = req.actorEmail().toLowerCase(Locale.ROOT);
        if (!e.getAuthorEmail().equalsIgnoreCase(actorEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own notes");
        }
        e.setTitle(req.title());
        e.setContent(req.content());
        var saved = repo.save(e);
        return toResponse(saved);
    }

    public void delete(Long id, String actorEmail) {
        var e = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found: " + id));
        if (actorEmail == null || actorEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing actor email");
        }
        if (!e.getAuthorEmail().equalsIgnoreCase(actorEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own notes");
        }
        repo.delete(e);
    }

    private NoteResponse toResponse(NoteEntity e) {
        return new NoteResponse(
                e.getId(),
                e.getTitle(),
                e.getContent(),
                e.getCreatedAt(),
                e.getUpdatedAt(),
                e.getAuthorName(),
                e.getAuthorEmail()
        );
    }
}
