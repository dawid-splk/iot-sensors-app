package com.zai.backend.security;

import com.zai.backend.repository.SensorRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Authenticates only measurement upload: a known X-API-Key yields ROLE_SENSOR with the Sensor entity as principal (the target series follows from it). Unknown or missing keys pass through
 * unauthenticated.
 */
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-API-Key";

    private final SensorRepository sensorRepository;

    public ApiKeyAuthFilter(SensorRepository sensorRepository) {
        this.sensorRepository = sensorRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !SecurityPaths.MEASUREMENT_UPLOAD.matches(request);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String apiKey = request.getHeader(HEADER);
        if (apiKey != null && !apiKey.isBlank()) {
            sensorRepository.findByApiKeyHash(SecureTokens.sha256Hex(apiKey.trim())).ifPresent(sensor -> {
                var authentication = UsernamePasswordAuthenticationToken.authenticated(sensor, null, List.of(new SimpleGrantedAuthority("ROLE_SENSOR")));
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(authentication);
                SecurityContextHolder.setContext(context);
            });
        }
        chain.doFilter(request, response);
    }
}
