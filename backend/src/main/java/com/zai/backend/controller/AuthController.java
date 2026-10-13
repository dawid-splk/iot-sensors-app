package com.zai.backend.controller;

import com.zai.backend.dto.LoginRequest;
import com.zai.backend.dto.LoginResponse;
import com.zai.backend.dto.PasswordChange;
import com.zai.backend.security.AdminPrincipal;
import com.zai.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping(path = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal AdminPrincipal principal) {
        authService.logout(principal);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/password", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal AdminPrincipal principal,
                                               @Valid @RequestBody PasswordChange change) {
        authService.changePassword(principal, change);
        return ResponseEntity.noContent().build();
    }
}
