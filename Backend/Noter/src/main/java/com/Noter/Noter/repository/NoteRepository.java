package com.Noter.Noter.repository;

import com.Noter.Noter.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {
    
    List<Note> findByWalletAddressOrderByCreatedAtDesc(String walletAddress);
    
    boolean existsByIdAndWalletAddress(UUID id, String walletAddress);
}
