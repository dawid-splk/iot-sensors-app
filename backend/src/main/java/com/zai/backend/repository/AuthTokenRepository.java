package com.zai.backend.repository;

import com.zai.backend.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {

    @Query("""
            select t from AuthToken t join fetch t.user
            where t.tokenHash = :tokenHash and t.expiresAt > :now
            """)
    Optional<AuthToken> findValid(@Param("tokenHash") String tokenHash, @Param("now") Instant now);

    @Modifying
    @Query("delete from AuthToken t where t.tokenHash = :tokenHash")
    int deleteByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("delete from AuthToken t where t.user.id = :userId and t.tokenHash <> :keepTokenHash")
    int deleteOtherTokens(@Param("userId") Long userId, @Param("keepTokenHash") String keepTokenHash);

    @Modifying
    @Query("delete from AuthToken t where t.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
