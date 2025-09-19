package com.Noter.Noter.user;

import com.Noter.Noter.dto.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.Noter.Noter.entity.UserEntity;
import com.Noter.Noter.repository.UserRepository;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthService(UserRepository users, PasswordEncoder encoder) {
        this.users = users; this.encoder = encoder;
    }

    public UserResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }
        UserEntity u = new UserEntity();
        u.setName(req.name());
        u.setEmail(req.email().toLowerCase());
        u.setPasswordHash(encoder.encode(req.password()));
        users.save(u);
        return new UserResponse(u.getId(), u.getName(), u.getEmail());
    }

    public LoginResponse login(LoginRequest req) {
        var u = users.findByEmail(req.email().toLowerCase())
                     .orElse(null);
        if (u == null || !encoder.matches(req.password(), u.getPasswordHash())) {
            return new LoginResponse(false, "Invalid credentials", null);
        }
        // No authorization tokens yet; just confirm success and return user profile
        return new LoginResponse(true, "Login successful", 
                new UserResponse(u.getId(), u.getName(), u.getEmail()));
    }
}