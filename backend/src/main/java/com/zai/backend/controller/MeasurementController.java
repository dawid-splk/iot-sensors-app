package com.zai.backend.controller;

import com.zai.backend.dto.MeasurementDto;
import com.zai.backend.dto.MeasurementInput;
import com.zai.backend.entity.Sensor;
import com.zai.backend.exception.InvalidQueryParameterException;
import com.zai.backend.service.MeasurementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/measurements")
@RequiredArgsConstructor
public class MeasurementController {

    private final MeasurementService measurementService;

    @GetMapping
    public List<MeasurementDto> list(
            @RequestParam(name = "series", required = false) List<Long> seriesIds,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "timestamp") String sort,
            @RequestParam(defaultValue = "1000")
            @Min(value = 1, message = "limit musi wynosić co najmniej 1")
            @Max(value = 10000, message = "limit może wynosić co najwyżej 10000")
            int limit) {
        boolean descending = switch (sort) {
            case "timestamp" -> false;
            case "-timestamp" -> true;
            default -> throw new InvalidQueryParameterException(
                    "Parametr sort przyjmuje wartości: timestamp, -timestamp");
        };
        return measurementService.find(seriesIds, from, to, descending, limit);
    }

    @GetMapping("/{measurementId}")
    public MeasurementDto get(@PathVariable Long measurementId) {
        return measurementService.get(measurementId);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MeasurementDto> create(@AuthenticationPrincipal Sensor sensor,
                                                 @Valid @RequestBody MeasurementInput input) {
        MeasurementDto created = measurementService.create(sensor.getId(), input);
        return ResponseEntity.created(URI.create("/api/measurements/" + created.id())).body(created);
    }
}
