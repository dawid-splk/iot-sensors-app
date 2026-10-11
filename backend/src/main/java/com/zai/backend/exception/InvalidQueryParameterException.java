package com.zai.backend.exception;

import org.springframework.http.HttpStatus;

public class InvalidQueryParameterException extends ApiException {

    public InvalidQueryParameterException(String detail) {
        super(HttpStatus.BAD_REQUEST, "Niepoprawny parametr zapytania", detail);
    }
}
