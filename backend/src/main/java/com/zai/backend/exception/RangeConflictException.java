package com.zai.backend.exception;

import org.springframework.http.HttpStatus;

public class RangeConflictException extends ApiException {

    public RangeConflictException(double minValue, double maxValue) {
        super(HttpStatus.CONFLICT, "Konflikt przedziału serii",
                "Nowy przedział [%s, %s] nie obejmuje wszystkich zapisanych wyników serii"
                        .formatted(minValue, maxValue));
    }
}
