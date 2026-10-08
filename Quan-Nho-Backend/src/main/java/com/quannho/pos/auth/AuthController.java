package com.quannho.pos.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager manager;
    private final SecurityContextRepository repository;
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager manager, SecurityContextRepository repository, JdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
        this.manager = manager;
        this.repository = repository;
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
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
            // Cập nhật thời điểm đăng nhập gần nhất
            jdbc.update("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE lower(username) = lower(?) OR lower(email) = lower(?)",
                    credentials.username(), credentials.username());

            return currentUser(authentication.getName());
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu");
        }
    }

    @GetMapping("/me") public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(currentUser(authentication.getName()));
    }

    @PostMapping("/logout") public Map<String, Boolean> logout(HttpServletRequest request) {
        if (request.getSession(false) != null) request.getSession(false).invalidate();
        SecurityContextHolder.clearContext();
        return Map.of("success", true);
    }

    @PutMapping("/profile")
    public Map<String, Object> updateProfile(@RequestBody UpdateProfileRequest req,
            Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để thực hiện");
        }
        if (req.fullName() == null || req.fullName().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ và tên không được để trống");
        }
        if (req.phone() == null || req.phone().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không được để trống");
        }

        String phone = req.phone().trim();
        String fullName = req.fullName().trim();
        String email = (req.email() != null && !req.email().trim().isBlank()) ? req.email().trim().toLowerCase() : null;

        String currentLogin = authentication.getName();
        Long currentUserId = jdbc.queryForObject(
                "SELECT id FROM users WHERE lower(username) = lower(?) OR lower(email) = lower(?)",
                Long.class, currentLogin, currentLogin);

        // Kiểm tra số điện thoại (username) đã được tài khoản khác dùng chưa
        Integer phoneCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE lower(username) = lower(?) AND id <> ?",
                Integer.class, phone, currentUserId);
        if (phoneCount != null && phoneCount > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại này đã được sử dụng bởi tài khoản khác");
        }

        // Kiểm tra email nếu có nhập
        if (email != null) {
            Integer emailCount = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE lower(email) = lower(?) AND id <> ?",
                    Integer.class, email, currentUserId);
            if (emailCount != null && emailCount > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được sử dụng bởi tài khoản khác");
            }
        }

        jdbc.update("UPDATE users SET full_name = ?, username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                fullName, phone, email, currentUserId);

        // Cập nhật lại SecurityContext trong phiên hiện tại với tên đăng nhập/phone mới
        Authentication newAuth = new UsernamePasswordAuthenticationToken(phone, authentication.getCredentials(), authentication.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(newAuth);
        repository.saveContext(SecurityContextHolder.getContext(), request, response);

        return currentUser(phone);
    }

    @PostMapping("/change-password")
    public Map<String, Object> changePassword(@RequestBody ChangePasswordRequest req, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để thực hiện");
        }
        if (req.currentPassword() == null || req.currentPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập mật khẩu hiện tại");
        }
        if (req.newPassword() == null || req.newPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập mật khẩu mới");
        }
        if (req.newPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải có ít nhất 6 ký tự");
        }
        if (req.newPassword().equals(req.currentPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới không được trùng mật khẩu cũ");
        }

        String username = authentication.getName();
        String currentHash = jdbc.queryForObject("SELECT password_hash FROM users WHERE username = ? OR lower(email) = lower(?)", String.class, username, username);
        if (currentHash == null || !passwordEncoder.matches(req.currentPassword(), currentHash)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không chính xác");
        }

        String newHash = passwordEncoder.encode(req.newPassword());
        jdbc.update("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ? OR lower(email) = lower(?)", newHash, username, username);

        return Map.of("success", true, "message", "Đổi mật khẩu thành công");
    }

    private Map<String, Object> currentUser(String username) {
        return jdbc.queryForObject(
                "SELECT id, username, email, full_name, role, is_active, last_login_at, created_at, updated_at " +
                "FROM users WHERE lower(username) = lower(?) OR lower(email) = lower(?)",
                (rs, row) -> {
                    var map = new java.util.HashMap<String, Object>();
                    map.put("id", rs.getLong("id"));
                    map.put("username", rs.getString("username"));
                    map.put("phone", rs.getString("username"));
                    map.put("email", rs.getString("email") == null ? "" : rs.getString("email"));
                    map.put("name", rs.getString("full_name"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("role", rs.getString("role"));
                    map.put("active", rs.getBoolean("is_active"));
                    map.put("lastLoginAt", rs.getTimestamp("last_login_at") == null ? "" : rs.getTimestamp("last_login_at").toInstant().toString());
                    map.put("createdAt", rs.getTimestamp("created_at") == null ? "" : rs.getTimestamp("created_at").toInstant().toString());
                    map.put("updatedAt", rs.getTimestamp("updated_at") == null ? "" : rs.getTimestamp("updated_at").toInstant().toString());
                    return map;
                }, username, username);
    }

    public record LoginRequest(String username, String password) {}
    public record UpdateProfileRequest(String fullName, String phone, String email) {}
    public record ChangePasswordRequest(String currentPassword, String newPassword) {}
}
