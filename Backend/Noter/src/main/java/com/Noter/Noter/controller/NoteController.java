package com.Noter.Noter.controller;

import com.Noter.Noter.dto.NoteCreateRequest;
import com.Noter.Noter.dto.NoteResponse;
import com.Noter.Noter.dto.NoteUpdateRequest;
import com.Noter.Noter.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "http://localhost:5173")
public class NoteController {

    private final NoteService service;

    public NoteController(NoteService service) {
        this.service = service;
    }

    @GetMapping
    public List<NoteResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public NoteResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<NoteResponse> create(@Valid @RequestBody NoteCreateRequest req) {
        var created = service.create(req);
        return ResponseEntity.created(URI.create("/api/notes/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public NoteResponse update(@PathVariable Long id, @Valid @RequestBody NoteUpdateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestHeader(value = "X-User-Email", required = false) String actorEmail,
                                       @RequestParam(value = "actorEmail", required = false) String actorEmailParam) {
        var email = (actorEmail != null && !actorEmail.isBlank()) ? actorEmail : actorEmailParam;
        service.delete(id, email);
        return ResponseEntity.noContent().build();
    }
}
