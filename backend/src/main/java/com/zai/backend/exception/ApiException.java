package com.zai.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Domain exception mapped to ProblemDetail by {@link GlobalExceptionHandler}.
 * {@code detail} is sent to the client and must not contain sensitive data.
 */
@Getter
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String title;

    protected ApiException(HttpStatus status, String title, String detail) {
        super(detail);
        this.status = status;
        this.title = title;
    }
}
