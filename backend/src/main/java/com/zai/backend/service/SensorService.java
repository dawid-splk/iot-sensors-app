package com.zai.backend.service;

import com.zai.backend.dto.SensorCreated;
import com.zai.backend.dto.SensorDto;
import com.zai.backend.dto.SensorInput;
import com.zai.backend.entity.Sensor;
import com.zai.backend.entity.Series;
import com.zai.backend.exception.NotFoundException;
import com.zai.backend.exception.SeriesNotFoundForSensorException;
import com.zai.backend.repository.SensorRepository;
import com.zai.backend.repository.SeriesRepository;
import com.zai.backend.security.SecureTokens;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SensorService {

    private final SensorRepository sensorRepository;
    private final SeriesRepository seriesRepository;

    @Transactional(readOnly = true)
    public List<SensorDto> findAll() {
        return sensorRepository.findAll(Sort.by("id")).stream()
                .map(SensorDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SensorDto get(Long id) {
        return SensorDto.from(findSensor(id));
    }

    /** The raw API key is returned only here; the database stores its SHA-256. */
    @Transactional
    public SensorCreated register(SensorInput input) {
        Series series = seriesRepository.findById(input.seriesId())
                .orElseThrow(() -> new SeriesNotFoundForSensorException(input.seriesId()));
        String apiKey = SecureTokens.generate();
        Sensor sensor = new Sensor();
        sensor.setName(input.name());
        sensor.setSeries(series);
        sensor.setApiKeyHash(SecureTokens.sha256Hex(apiKey));
        return SensorCreated.from(sensorRepository.saveAndFlush(sensor), apiKey);
    }

    /** Measurements of the sensor are kept (ON DELETE SET NULL). */
    @Transactional
    public void unregister(Long id) {
        sensorRepository.delete(findSensor(id));
    }

    private Sensor findSensor(Long id) {
        return sensorRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Czujnik o id=%d nie istnieje".formatted(id)));
    }
}
