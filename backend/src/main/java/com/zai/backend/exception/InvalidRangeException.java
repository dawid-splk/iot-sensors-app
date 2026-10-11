package com.zai.backend.exception;

import org.springframework.http.HttpStatus;

public class InvalidRangeException extends ApiException {

    public InvalidRangeException(double minValue, double maxValue) {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Niepoprawny przedział serii",
                "minValue (%s) musi być mniejsze niż maxValue (%s)".formatted(minValue, maxValue));
    }
}
