package com.zai.backend.security;

/** Authenticated administrator; {@code tokenHash} identifies the session to revoke on logout. */
public record AdminPrincipal(Long userId, String username, String tokenHash) {

    @Override
    public String toString() {
        return "AdminPrincipal[userId=" + userId + ", username=" + username + "]";
    }
}
