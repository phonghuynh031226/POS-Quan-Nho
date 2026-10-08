package com.quannho.pos.settings.shop;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController @RequestMapping("/api/settings")
public class ShopSettingsController {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public ShopSettingsController(JdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/shop/public") public Map<String, Object> publicInfo() {
        return jdbc.queryForList("SELECT shop_name,store_subtitle,phone,shop_address FROM shop_settings ORDER BY id LIMIT 1")
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/shop") public Map<String, Object> shop() {
        return jdbc.queryForList("SELECT id,shop_name,store_subtitle,phone,shop_address,wifi_name," +
                "wifi_password_encrypted,receipt_message,show_wifi_on_receipt FROM shop_settings ORDER BY id LIMIT 1")
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/shop") public Map<String, Object> update(@RequestBody Map<String, Object> body) {
        String name = String.valueOf(body.getOrDefault("shop_name", "")).trim();
        if (name.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên quán không được để trống");
        jdbc.update("UPDATE shop_settings SET shop_name=?,store_subtitle=?,phone=?,shop_address=?,wifi_name=?," +
                "wifi_password_encrypted=?,receipt_message=?,show_wifi_on_receipt=?,updated_at=now() " +
                "WHERE id=(SELECT id FROM shop_settings ORDER BY id LIMIT 1)",
                name, body.get("store_subtitle"), body.get("phone"), body.get("shop_address"),
                body.get("wifi_name"), body.get("wifi_password_encrypted"), body.get("receipt_message"),
                body.getOrDefault("show_wifi_on_receipt", true));
        return shop();
    }

    @GetMapping("/sepay") public Map<String, Object> sepay() {
        return jdbc.queryForList("SELECT id,api_key_last4,is_configured FROM sepay_settings ORDER BY id LIMIT 1")
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping("/sepay/test") public Map<String, Object> testSepayConnection() {
        boolean configured = jdbc.queryForList(
                "SELECT is_configured AND api_key_encrypted IS NOT NULL FROM sepay_settings ORDER BY id LIMIT 1",
                Boolean.class).stream().findFirst().orElse(false);
        if (!configured) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SePay webhook API Key chưa được cấu hình");
        }
        return Map.of("success", true, "message", "SePay webhook API Key đã được cấu hình");
    }

    @PostMapping("/sepay/key") public Map<String, Object> saveSepayKey(@RequestBody Map<String, Object> body) {
        String apiKey = String.valueOf(body.getOrDefault("apiKey", "")).trim();
        if (apiKey.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SePay API Key không được để trống");
        }
        if (apiKey.length() < 4 || apiKey.length() > 2048) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SePay API Key không hợp lệ");
        }

        String last4 = apiKey.substring(Math.max(0, apiKey.length() - 4));
        String hashedKey = passwordEncoder.encode(apiKey);
        jdbc.update("UPDATE sepay_settings SET api_key_encrypted=?,api_key_last4=?," +
                        "is_configured=true,updated_at=now() " +
                        "WHERE id=(SELECT id FROM sepay_settings ORDER BY id LIMIT 1)",
                hashedKey, last4);

        return Map.of(
                "api_key_last4", last4,
                "is_configured", true,
                "masked_key", "••••••••" + last4
        );
    }
}
