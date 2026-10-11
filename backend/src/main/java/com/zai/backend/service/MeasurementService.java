package com.zai.backend.service;

import com.zai.backend.dto.MeasurementDto;
import com.zai.backend.dto.MeasurementInput;
import com.zai.backend.entity.Measurement;
import com.zai.backend.entity.Sensor;
import com.zai.backend.entity.Series;
import com.zai.backend.exception.FutureTimestampException;
import com.zai.backend.exception.NotFoundException;
import com.zai.backend.exception.ValueOutOfRangeException;
import com.zai.backend.repository.MeasurementRepository;
import com.zai.backend.repository.MeasurementSpecifications;
import com.zai.backend.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MeasurementService {

    static final Duration FUTURE_TOLERANCE = Duration.ofMinutes(5);

    private final MeasurementRepository measurementRepository;
    private final SensorRepository sensorRepository;

    @Transactional(readOnly = true)
    public List<MeasurementDto> find(Collection<Long> seriesIds, Instant from, Instant to,
                                     boolean descending, int limit) {
        Sort.Direction direction = descending ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, "timestamp").and(Sort.by(direction, "id"));

        return measurementRepository
                .findAll(MeasurementSpecifications.matching(seriesIds, from, to), PageRequest.of(0, limit, sort))
                .map(MeasurementDto::from)
                .getContent();
    }

    @Transactional(readOnly = true)
    public MeasurementDto get(Long id) {
        return measurementRepository.findById(id)
                .map(MeasurementDto::from)
                .orElseThrow(() -> new NotFoundException("Wynik o id=%d nie istnieje".formatted(id)));
    }

    @Transactional
    public MeasurementDto create(Long sensorId, MeasurementInput input) {
        Sensor sensor = sensorRepository.findById(sensorId)
                .orElseThrow(() -> new NotFoundException("Czujnik o id=%d nie istnieje".formatted(sensorId)));
        Series series = sensor.getSeries();
        Instant now = Instant.now();
        Instant timestamp = input.timestamp() != null ? input.timestamp() : now;
        double value = input.value();

        if (timestamp.isAfter(now.plus(FUTURE_TOLERANCE))) {
            log.warn("Odrzucono wynik: sensorId={}, value={}, timestamp={} (z przyszłości)",
                    sensorId, value, timestamp);
            throw new FutureTimestampException(timestamp, FUTURE_TOLERANCE);
        }
        if (value < series.getMinValue() || value > series.getMaxValue()) {
            log.warn("Odrzucono wynik: sensorId={}, value={}, zakres=[{}, {}]",
                    sensorId, value, series.getMinValue(), series.getMaxValue());
            throw new ValueOutOfRangeException(value, series.getMinValue(), series.getMaxValue());
        }

        Measurement measurement = new Measurement();
        measurement.setSeries(series);
        measurement.setSensor(sensor);
        measurement.setValue(value);
        measurement.setTimestamp(timestamp);
        measurementRepository.save(measurement);

        sensor.setLastMeasurementAt(now);

        return MeasurementDto.from(measurement);
    }
}
