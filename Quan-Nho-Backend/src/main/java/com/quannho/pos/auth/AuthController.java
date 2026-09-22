package com.quannho.pos.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager manager;
    private final SecurityContextRepository repository;
    private final JdbcTemplate jdbc;

    public AuthController(AuthenticationManager manager, SecurityContextRepository repository, JdbcTemplate jdbc) {
        this.manager = manager;
        this.repository = repository;
        this.jdbc = jdbc;
    }

    @GetMapping("/csrf") public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @PostMapping("/login") public Map<String, Object> login(@RequestBody LoginRequest credentials,
            HttpServletRequest request, HttpServletResponse response) {
        try {
            Authentication authentication = manager.authenticate(
                    new UsernamePasswordAuthenticationToken(credentials.username(), credentials.password()));
            request.getSession(true);
            request.changeSessionId();
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            repository.saveContext(context, request, response);
            return currentUser(authentication.getName());
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu");
        }
    }

    @GetMapping("/me") public Map<String, Object> me(Authentication authentication) {
        return currentUser(authentication.getName());
    }

    @PostMapping("/logout") public Map<String, Boolean> logout(HttpServletRequest request) {
        if (request.getSession(false) != null) request.getSession(false).invalidate();
        SecurityContextHolder.clearContext();
        return Map.of("success", true);
    }

    private Map<String, Object> currentUser(String username) {
        return jdbc.queryForObject("SELECT id, username, email, full_name, role FROM users WHERE username = ?",
                (rs, row) -> Map.<String, Object>of(
                        "id", rs.getLong("id"), "username", rs.getString("username"),
                        "email", rs.getString("email") == null ? "" : rs.getString("email"),
                        "name", rs.getString("full_name"), "role", rs.getString("role")), username);
    }

    public record LoginRequest(String username, String password) {}
}
