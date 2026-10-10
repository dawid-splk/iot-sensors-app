package com.zai.backend.repository;

import com.zai.backend.entity.Measurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MeasurementRepository extends JpaRepository<Measurement, Long>, JpaSpecificationExecutor<Measurement> {

    @Query("""
            select count(m) > 0 from Measurement m
            where m.series.id = :seriesId and (m.value < :minValue or m.value > :maxValue)
            """)
    boolean existsOutsideRange(@Param("seriesId") Long seriesId,
                               @Param("minValue") double minValue,
                               @Param("maxValue") double maxValue);
}
