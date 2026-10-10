package com.zai.backend.repository;

import com.zai.backend.entity.Sensor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SensorRepository extends JpaRepository<Sensor, Long> {

    @EntityGraph(attributePaths = "series")
    Optional<Sensor> findByApiKeyHash(String apiKeyHash);
}
