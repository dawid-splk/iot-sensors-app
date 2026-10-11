package com.zai.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.zai.backend.entity.Measurement;

import java.time.Instant;

public record MeasurementDto(
        Long id,
        Long seriesId,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Long sensorId,
        Double value,
        Instant timestamp
) {

    public static MeasurementDto from(Measurement measurement) {
        return new MeasurementDto(
                measurement.getId(),
                measurement.getSeries().getId(),
                measurement.getSensor() != null ? measurement.getSensor().getId() : null,
                measurement.getValue(),
                measurement.getTimestamp());
    }
}
