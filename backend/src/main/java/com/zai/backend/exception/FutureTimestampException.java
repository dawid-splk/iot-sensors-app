package com.zai.backend.exception;

import org.springframework.http.HttpStatus;

import java.time.Duration;
import java.time.Instant;

public class FutureTimestampException extends ApiException {

    public FutureTimestampException(Instant timestamp, Duration tolerance) {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Znacznik czasu z przyszłości",
                "Znacznik czasu %s jest późniejszy niż %d min od czasu serwera"
                        .formatted(timestamp, tolerance.toMinutes()));
    }
}
