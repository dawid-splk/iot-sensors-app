package com.zai.backend.controller;

import com.zai.backend.dto.SeriesDto;
import com.zai.backend.dto.SeriesInput;
import com.zai.backend.service.SeriesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/series")
@RequiredArgsConstructor
public class SeriesController {

    private final SeriesService seriesService;

    @GetMapping
    public List<SeriesDto> list() {
        return seriesService.findAll();
    }

    @GetMapping("/{seriesId}")
    public SeriesDto get(@PathVariable Long seriesId) {
        return seriesService.get(seriesId);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SeriesDto> create(@Valid @RequestBody SeriesInput input) {
        SeriesDto created = seriesService.create(input);
        return ResponseEntity.created(URI.create("/api/series/" + created.id())).body(created);
    }

    @PutMapping(path = "/{seriesId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public SeriesDto update(@PathVariable Long seriesId, @Valid @RequestBody SeriesInput input) {
        return seriesService.update(seriesId, input);
    }

    @DeleteMapping("/{seriesId}")
    public ResponseEntity<Void> delete(@PathVariable Long seriesId) {
        seriesService.delete(seriesId);
        return ResponseEntity.noContent().build();
    }
}
