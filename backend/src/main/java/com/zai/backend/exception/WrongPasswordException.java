package com.zai.backend.exception;

import org.springframework.http.HttpStatus;

public class WrongPasswordException extends ApiException {

    public WrongPasswordException() {
        super(HttpStatus.FORBIDDEN, "Niepoprawne hasło", "Podane bieżące hasło jest niepoprawne");
    }
}
