package com.zai.backend.dto;

import com.zai.backend.entity.Sensor;

import java.time.Instant;

public record SensorCreated(
        Long id,
        String name,
        Long seriesId,
        Instant createdAt,
        Instant lastMeasurementAt,
        String apiKey
) {

    public static SensorCreated from(Sensor sensor, String apiKey) {
        return new SensorCreated(
                sensor.getId(),
                sensor.getName(),
                sensor.getSeries().getId(),
                sensor.getCreatedAt(),
                sensor.getLastMeasurementAt(),
                apiKey);
    }
}
