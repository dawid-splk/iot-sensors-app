package com.zai.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record MeasurementInput(
        @NotNull(message = "Wartość jest wymagana")
        Double value,
        Instant timestamp
) {
}
