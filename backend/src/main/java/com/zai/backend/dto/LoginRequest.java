package com.zai.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Nazwa użytkownika jest wymagana")
        String username,

        @NotBlank(message = "Hasło jest wymagane")
        String password
) {

    @Override
    public String toString() {
        return "LoginRequest[username=" + username + ", password=***]";
    }
}
