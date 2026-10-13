package com.zai.backend.security;

import org.springframework.http.HttpMethod;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

final class SecurityPaths {

    static final RequestMatcher MEASUREMENT_UPLOAD = PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, "/api/measurements");

    private SecurityPaths() {
    }
}
