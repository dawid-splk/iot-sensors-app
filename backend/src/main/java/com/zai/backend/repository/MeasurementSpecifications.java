package com.zai.backend.repository;

import com.zai.backend.entity.Measurement;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public final class MeasurementSpecifications {

    private MeasurementSpecifications() {
    }

    // null or empty parameters are ignored
    public static Specification<Measurement> matching(Collection<Long> seriesIds, Instant from, Instant to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (seriesIds != null && !seriesIds.isEmpty()) {
                predicates.add(root.get("series").get("id").in(seriesIds));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), to));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
