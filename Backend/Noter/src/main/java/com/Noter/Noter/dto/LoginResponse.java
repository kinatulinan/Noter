package com.Noter.Noter.dto;

public record LoginResponse(boolean success, String message, UserResponse user) {
    
}
