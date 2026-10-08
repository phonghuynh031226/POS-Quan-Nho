package com.quannho.pos.settings;

import com.quannho.pos.settings.shop.ShopSettingsController;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SepaySettingsApiTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final ShopSettingsController controller = new ShopSettingsController(jdbc, encoder);

    @Test void hashesAndSavesTheSepayKeyWithoutReturningTheSecret() {
        when(encoder.encode("sepay-secret-1234")).thenReturn("bcrypt-hash");

        Map<String, Object> response = controller.saveSepayKey(Map.of("apiKey", "sepay-secret-1234"));

        verify(jdbc).update(contains("UPDATE sepay_settings"), eq("bcrypt-hash"), eq("1234"));
        assertEquals(true, response.get("is_configured"));
        assertEquals("1234", response.get("api_key_last4"));
        assertEquals("••••••••1234", response.get("masked_key"));
        assertFalse(response.containsValue("sepay-secret-1234"));
    }

    @Test void rejectsABlankSepayKey() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.saveSepayKey(Map.of("apiKey", "   ")));

        assertEquals(400, error.getStatusCode().value());
        verifyNoInteractions(encoder);
    }

    @Test void rejectsASepayKeyShorterThanFourCharacters() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.saveSepayKey(Map.of("apiKey", "abc")));

        assertEquals(400, error.getStatusCode().value());
        verifyNoInteractions(encoder);
    }

    @Test void connectionCheckUsesSavedKeyConfigurationWithoutReturningTheSecret() {
        when(jdbc.queryForList(contains("SELECT is_configured"), Boolean.class)).thenReturn(java.util.List.of(true));

        Map<String, Object> response = controller.testSepayConnection();

        assertEquals(true, response.get("success"));
        assertFalse(response.containsKey("api_key"));
        verifyNoInteractions(encoder);
    }
}
