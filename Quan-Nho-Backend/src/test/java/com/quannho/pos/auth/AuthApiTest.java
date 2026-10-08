package com.quannho.pos.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.transaction.annotation.Transactional;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("local") @Transactional
class AuthApiTest {
    @Autowired MockMvc mvc;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

    @org.junit.jupiter.api.BeforeEach
    void resetAdminUser() {
        jdbc.update("UPDATE users SET username = 'admin', email = 'admin@quannho.vn', full_name = 'Chủ quán' WHERE id = 1");
    }

    @Test void ownerCanLogInWithStoredBcryptPassword() throws Exception {
        mvc.perform(post("/api/auth/login").with(csrf())
                .contentType("application/json")
                .content("{\"username\":\"admin\",\"password\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("OWNER"));
    }

    @Test void sessionProbeReturnsNoContentInsteadOfUnauthorizedWhenLoggedOut() throws Exception {
        mvc.perform(get("/api/auth/me"))
                .andExpect(status().isNoContent());
    }

    @Test void changePasswordRequiresAuthentication() throws Exception {
        mvc.perform(post("/api/auth/change-password").with(csrf())
                .contentType("application/json")
                .content("{\"currentPassword\":\"123456\",\"newPassword\":\"654321\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test @org.springframework.security.test.context.support.WithMockUser(username = "admin", roles = "OWNER")
    void changePasswordFailsWhenCurrentPasswordIsWrong() throws Exception {
        mvc.perform(post("/api/auth/change-password").with(csrf())
                .contentType("application/json")
                .content("{\"currentPassword\":\"wrongpwd\",\"newPassword\":\"654321\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test @org.springframework.security.test.context.support.WithMockUser(username = "admin", roles = "OWNER")
    void updateProfileRequiresValidPhone() throws Exception {
        mvc.perform(put("/api/auth/profile").with(csrf())
                .contentType("application/json")
                .content("{\"fullName\":\"Chủ quán\",\"phone\":\"\",\"email\":\"test@test.com\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test @org.springframework.security.test.context.support.WithMockUser(username = "admin", roles = "OWNER")
    void updateProfileAllowsOptionalEmail() throws Exception {
        mvc.perform(put("/api/auth/profile").with(csrf())
                .contentType("application/json")
                .content("{\"fullName\":\"Chủ quán POS\",\"phone\":\"0909999999\",\"email\":\"\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("0909999999"))
                .andExpect(jsonPath("$.name").value("Chủ quán POS"));
    }
}
