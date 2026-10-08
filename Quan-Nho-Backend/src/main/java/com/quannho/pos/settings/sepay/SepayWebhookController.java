package com.quannho.pos.settings.sepay;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/sepay")
public class SepayWebhookController {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public SepayWebhookController(JdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping
    public Map<String, Boolean> receive(@RequestHeader(name = "Authorization", required = false) String authorization) {
        String apiKey = extractApiKey(authorization);
        if (apiKey == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Webhook authentication failed");
        }

        List<String> configuredHashes = jdbc.queryForList(
                "SELECT api_key_encrypted FROM sepay_settings WHERE is_configured=true " +
                        "AND api_key_encrypted IS NOT NULL ORDER BY id LIMIT 1",
                String.class);
        if (configuredHashes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Webhook API Key is not configured");
        }
        if (!passwordEncoder.matches(apiKey, configuredHashes.get(0))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Webhook authentication failed");
        }

        // This endpoint is for delivery verification only. It intentionally ignores the payload.
        return Map.of("success", true);
    }

    private static String extractApiKey(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Apikey ", 0, 7)) {
            return null;
        }
        String apiKey = authorization.substring(7).trim();
        return apiKey.isEmpty() ? null : apiKey;
    }
}
