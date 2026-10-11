package com.zai.backend.dto;

import com.zai.backend.entity.Sensor;

import java.time.Instant;

public record SensorDto(
        Long id,
        String name,
        Long seriesId,
        Instant createdAt,
        Instant lastMeasurementAt
) {

    public static SensorDto from(Sensor sensor) {
        return new SensorDto(
                sensor.getId(),
                sensor.getName(),
                sensor.getSeries().getId(),
                sensor.getCreatedAt(),
                sensor.getLastMeasurementAt());
    }
}
