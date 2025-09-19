package com.Noter.Noter.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.Noter.Noter.entity.NoteEntity;

public interface NoteRepository extends JpaRepository<NoteEntity, Long> {
    
}