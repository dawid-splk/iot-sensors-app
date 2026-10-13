package com.zai.backend.service;

import com.zai.backend.dto.LoginRequest;
import com.zai.backend.dto.LoginResponse;
import com.zai.backend.dto.PasswordChange;
import com.zai.backend.entity.AppUser;
import com.zai.backend.exception.WrongPasswordException;
import com.zai.backend.repository.AppUserRepository;
import com.zai.backend.security.AdminPrincipal;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final String dummyPasswordHash;

    public AuthService(AppUserRepository userRepository, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.dummyPasswordHash = passwordEncoder.encode("dummy-password-for-timing");
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Optional<AppUser> user = userRepository.findByUsername(request.username());
        String hash = user.map(AppUser::getPasswordHash).orElse(dummyPasswordHash);
        boolean matches = passwordEncoder.matches(request.password(), hash);
        if (user.isEmpty() || !matches) {
            throw new BadCredentialsException("Bad credentials");
        }
        String token = tokenService.issue(user.get());
        return LoginResponse.bearer(token, tokenService.ttlSeconds());
    }

    @Transactional
    public void logout(AdminPrincipal principal) {
        tokenService.revoke(principal.tokenHash());
    }

    /** Other sessions of the user are revoked; the token used for this request stays valid. */
    @Transactional
    public void changePassword(AdminPrincipal principal, PasswordChange change) {
        AppUser user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new BadCredentialsException("User no longer exists"));
        if (!passwordEncoder.matches(change.currentPassword(), user.getPasswordHash())) {
            throw new WrongPasswordException();
        }
        user.setPasswordHash(passwordEncoder.encode(change.newPassword()));
        tokenService.revokeOtherTokens(user.getId(), principal.tokenHash());
    }
}
