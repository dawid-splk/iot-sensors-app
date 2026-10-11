package com.zai.backend.exception;

import org.springframework.http.HttpStatus;

public class SeriesNotFoundForSensorException extends ApiException {

    public SeriesNotFoundForSensorException(Long seriesId) {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Seria nie istnieje",
                "Nie można zarejestrować czujnika: seria o id=%d nie istnieje".formatted(seriesId));
    }
}
