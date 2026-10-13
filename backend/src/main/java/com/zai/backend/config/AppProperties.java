package com.zai.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(long tokenTtlSeconds, Admin admin) {

    public record Admin(String username, String password) {

        @Override
        public String toString() {
            return "Admin[username=" + username + ", password=***]";
        }
    }
}
