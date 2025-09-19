// src/main/java/com/Noter/user/UserEntity.java
package com.Noter.Noter.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class UserEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private String name;
    @Column(nullable=false, unique=true) private String email;
    @Column(nullable=false) private String passwordHash;

    @Column(nullable=false) private Instant createdAt = Instant.now();

    // getters/setters
    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String n) { this.name = n; }

    public String getEmail() { return email; }
    public void setEmail(String e) { this.email = e; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String ph) { this.passwordHash = ph; }
    
    public Instant getCreatedAt() { return createdAt; }
}
