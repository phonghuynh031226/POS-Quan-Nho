package com.quannho.pos.settings.sepay;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class SepayWebhookControllerTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final SepayWebhookController controller = new SepayWebhookController(jdbc, passwordEncoder);

    @Test
    void receivesWebhookWithConfiguredApiKeyAndDoesNotProcessPayload() {
        when(jdbc.queryForList(anyString(), eq(String.class))).thenReturn(List.of("bcrypt-hash"));
        when(passwordEncoder.matches("webhook-secret", "bcrypt-hash")).thenReturn(true);

        var response = controller.receive("Apikey webhook-secret");

        assertEquals(true, response.get("success"));
        verify(jdbc).queryForList(anyString(), eq(String.class));
        verify(passwordEncoder).matches("webhook-secret", "bcrypt-hash");
        verifyNoMoreInteractions(jdbc, passwordEncoder);
    }

    @Test
    void rejectsWrongAuthorizationSchemeWithoutReadingConfiguration() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.receive("Bearer webhook-secret"));

        assertEquals(401, error.getStatusCode().value());
        verifyNoInteractions(jdbc, passwordEncoder);
    }

    @Test
    void rejectsIncorrectWebhookKey() {
        when(jdbc.queryForList(anyString(), eq(String.class))).thenReturn(List.of("bcrypt-hash"));
        when(passwordEncoder.matches("wrong-secret", "bcrypt-hash")).thenReturn(false);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.receive("Apikey wrong-secret"));

        assertEquals(401, error.getStatusCode().value());
    }

    @Test
    void reportsUnavailableWhenWebhookKeyHasNotBeenConfigured() {
        when(jdbc.queryForList(anyString(), eq(String.class))).thenReturn(List.of());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.receive("Apikey webhook-secret"));

        assertEquals(503, error.getStatusCode().value());
    }
}
