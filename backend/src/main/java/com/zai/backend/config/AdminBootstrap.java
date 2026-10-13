package com.zai.backend.config;

import com.zai.backend.entity.AppUser;
import com.zai.backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Creates the admin account from ADMIN_USERNAME / ADMIN_PASSWORD when the user table is empty. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties properties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        AppProperties.Admin admin = properties.admin();
        if (admin == null || !StringUtils.hasText(admin.username()) || !StringUtils.hasText(admin.password())) {
            throw new IllegalStateException("No users in database and ADMIN_USERNAME / ADMIN_PASSWORD are not set");
        }
        AppUser user = new AppUser();
        user.setUsername(admin.username());
        user.setPasswordHash(passwordEncoder.encode(admin.password()));
        userRepository.save(user);
        log.info("Created admin account '{}'", admin.username());
    }
}
