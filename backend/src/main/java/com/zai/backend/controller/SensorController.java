package com.zai.backend.controller;

import com.zai.backend.dto.SensorCreated;
import com.zai.backend.dto.SensorDto;
import com.zai.backend.dto.SensorInput;
import com.zai.backend.service.SensorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/sensors")
@RequiredArgsConstructor
public class SensorController {

    private final SensorService sensorService;

    @GetMapping
    public List<SensorDto> list() {
        return sensorService.findAll();
    }

    @GetMapping("/{sensorId}")
    public SensorDto get(@PathVariable Long sensorId) {
        return sensorService.get(sensorId);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SensorCreated> register(@Valid @RequestBody SensorInput input) {
        SensorCreated created = sensorService.register(input);
        return ResponseEntity.created(URI.create("/api/sensors/" + created.id())).body(created);
    }

    @DeleteMapping("/{sensorId}")
    public ResponseEntity<Void> unregister(@PathVariable Long sensorId) {
        sensorService.unregister(sensorId);
        return ResponseEntity.noContent().build();
    }
}
