package com.zai.backend.service;

import com.zai.backend.config.AppProperties;
import com.zai.backend.entity.AppUser;
import com.zai.backend.entity.AuthToken;
import com.zai.backend.repository.AuthTokenRepository;
import com.zai.backend.security.AdminPrincipal;
import com.zai.backend.security.SecureTokens;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/** Bearer tokens: the raw value goes only to the client, the database keeps its SHA-256. */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenService {

    private final AuthTokenRepository authTokenRepository;
    private final AppProperties properties;

    public long ttlSeconds() {
        return properties.tokenTtlSeconds();
    }

    @Transactional
    public String issue(AppUser user) {
        String rawToken = SecureTokens.generate();
        AuthToken token = new AuthToken();
        token.setUser(user);
        token.setTokenHash(SecureTokens.sha256Hex(rawToken));
        token.setExpiresAt(Instant.now().plusSeconds(ttlSeconds()));
        authTokenRepository.save(token);
        return rawToken;
    }

    @Transactional(readOnly = true)
    public Optional<AdminPrincipal> authenticate(String rawToken) {
        String tokenHash = SecureTokens.sha256Hex(rawToken);
        return authTokenRepository.findValid(tokenHash, Instant.now())
                .map(token -> new AdminPrincipal(token.getUser().getId(), token.getUser().getUsername(), tokenHash));
    }

    @Transactional
    public void revoke(String tokenHash) {
        authTokenRepository.deleteByTokenHash(tokenHash);
    }

    @Transactional
    public void revokeOtherTokens(Long userId, String keepTokenHash) {
        authTokenRepository.deleteOtherTokens(userId, keepTokenHash);
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void purgeExpired() {
        int removed = authTokenRepository.deleteExpired(Instant.now());
        if (removed > 0) {
            log.info("Removed {} expired auth tokens", removed);
        }
    }
}
