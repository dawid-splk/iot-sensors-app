package com.zai.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SeriesInput(
        @NotBlank(message = "Nazwa jest wymagana")
        @Size(max = 100, message = "Nazwa może mieć co najwyżej 100 znaków")
        String name,

        @NotNull(message = "minValue jest wymagane")
        Double minValue,

        @NotNull(message = "maxValue jest wymagane")
        Double maxValue,

        @NotNull(message = "Kolor jest wymagany")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Kolor musi mieć format #RRGGBB")
        String color,

        @Size(max = 30, message = "Ikona może mieć co najwyżej 30 znaków")
        String icon,

        @Size(max = 20, message = "Jednostka może mieć co najwyżej 20 znaków")
        String unit
) {
}
