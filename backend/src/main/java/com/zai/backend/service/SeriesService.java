package com.zai.backend.service;

import com.zai.backend.dto.SeriesDto;
import com.zai.backend.dto.SeriesInput;
import com.zai.backend.entity.Series;
import com.zai.backend.exception.InvalidRangeException;
import com.zai.backend.exception.NotFoundException;
import com.zai.backend.exception.RangeConflictException;
import com.zai.backend.repository.MeasurementRepository;
import com.zai.backend.repository.SeriesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SeriesService {

    private final SeriesRepository seriesRepository;
    private final MeasurementRepository measurementRepository;

    @Transactional(readOnly = true)
    public List<SeriesDto> findAll() {
        return seriesRepository.findAll(Sort.by("id")).stream()
                .map(SeriesDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SeriesDto get(Long id) {
        return SeriesDto.from(findSeries(id));
    }

    @Transactional
    public SeriesDto create(SeriesInput input) {
        validateRange(input);
        Series series = new Series();
        apply(series, input);
        return SeriesDto.from(seriesRepository.save(series));
    }

    @Transactional
    public SeriesDto update(Long id, SeriesInput input) {
        Series series = findSeries(id);
        validateRange(input);
        if (measurementRepository.existsOutsideRange(id, input.minValue(), input.maxValue())) {
            throw new RangeConflictException(input.minValue(), input.maxValue());
        }
        apply(series, input);
        return SeriesDto.from(seriesRepository.saveAndFlush(series));
    }

    // measurements and sensors are deleted by ON DELETE CASCADE db rule
    @Transactional
    public void delete(Long id) {
        if (!seriesRepository.existsById(id)) {
            throw notFound(id);
        }
        seriesRepository.deleteById(id);
    }

    private Series findSeries(Long id) {
        return seriesRepository.findById(id).orElseThrow(() -> notFound(id));
    }

    private static NotFoundException notFound(Long id) {
        return new NotFoundException("Seria o id=%d nie istnieje".formatted(id));
    }

    private static void validateRange(SeriesInput input) {
        if (input.minValue() >= input.maxValue()) {
            throw new InvalidRangeException(input.minValue(), input.maxValue());
        }
    }

    private static void apply(Series series, SeriesInput input) {
        series.setName(input.name());
        series.setMinValue(input.minValue());
        series.setMaxValue(input.maxValue());
        series.setColor(input.color());
        series.setIcon(input.icon());
        series.setUnit(input.unit());
    }
}
