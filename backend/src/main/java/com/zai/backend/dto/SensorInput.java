package com.zai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SensorInput(
        @NotBlank(message = "Nazwa jest wymagana")
        @Size(max = 100, message = "Nazwa może mieć co najwyżej 100 znaków")
        String name,

        @NotNull(message = "seriesId jest wymagane")
        Long seriesId
) {
}
