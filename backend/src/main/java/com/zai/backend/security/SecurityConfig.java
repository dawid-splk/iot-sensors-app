package com.zai.backend.security;

import com.zai.backend.repository.SensorRepository;
import com.zai.backend.service.TokenService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

/**
 * Filters only authenticate; access is decided exclusively by authorizeHttpRequests
 */
@Configuration
public class SecurityConfig {

    private static final String CONTENT_SECURITY_POLICY =
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " + "img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; "
                    + "frame-ancestors 'none'; form-action 'self'";

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, TokenService tokenService, SensorRepository sensorRepository) throws Exception {
        return http.csrf(AbstractHttpConfigurer::disable).httpBasic(AbstractHttpConfigurer::disable).formLogin(AbstractHttpConfigurer::disable).logout(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).headers(
                        h -> h.contentSecurityPolicy(csp -> csp.policyDirectives(CONTENT_SECURITY_POLICY)).httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31_536_000))
                                .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)))
                .exceptionHandling(e -> e.authenticationEntryPoint(new ProblemAuthEntryPoint()).accessDeniedHandler(new ProblemAccessDeniedHandler())).authorizeHttpRequests(
                        a -> a.requestMatchers(HttpMethod.GET, "/api/health", "/api/series", "/api/series/**", "/api/measurements", "/api/measurements/**").permitAll()
                                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll().requestMatchers(HttpMethod.POST, "/api/measurements").hasRole("SENSOR").requestMatchers("/api/**")
                                .hasRole("ADMIN").anyRequest().permitAll()).addFilterBefore(new BearerTokenAuthFilter(tokenService), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new ApiKeyAuthFilter(sensorRepository), UsernamePasswordAuthenticationFilter.class).build();
    }
}
