package com.zai.backend.exception;

import org.springframework.http.HttpStatus;

public class ValueOutOfRangeException extends ApiException {

    public ValueOutOfRangeException(double value, double minValue, double maxValue) {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Wartość spoza przedziału serii",
                "Wartość %s spoza przedziału [%s, %s]".formatted(value, minValue, maxValue));
    }
}
