package com.zai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordChange(
        @NotBlank(message = "Bieżące hasło jest wymagane")
        String currentPassword,

        @NotBlank(message = "Nowe hasło jest wymagane")
        @Size(min = 8, max = 72, message = "Nowe hasło musi mieć od 8 do 72 znaków")
        String newPassword
) {

    @Override
    public String toString() {
        return "PasswordChange[currentPassword=***, newPassword=***]";
    }
}
