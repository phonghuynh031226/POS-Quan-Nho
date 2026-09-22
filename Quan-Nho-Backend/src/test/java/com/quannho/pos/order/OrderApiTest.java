package com.quannho.pos.order;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("local") @WithMockUser(username = "admin", roles = "OWNER")
class OrderApiTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @Test @Transactional void serverRecalculatesCashOrderFromCatalogPrices() throws Exception {
        long product = jdbc.queryForObject("SELECT id FROM products WHERE code='CA_PHE_SUA_DA'", Long.class);
        long size = option("SIZE_M"), temperature = option("ICED"), sugar = option("SUGAR_100"), ice = option("ICE_NORMAL");
        mvc.perform(post("/api/orders").with(csrf()).contentType("application/json").content("""
                {"paymentMethod":"TIEN_MAT","totalAmount":1,"cashGiven":100000,
                 "items":[{"menuItemId":%d,"quantity":1,"unitPrice":1,"lineTotal":1,
                 "selectedOptions":[{"optionGroupId":1,"optionId":%d},
                   {"optionGroupId":2,"optionId":%d},{"optionGroupId":3,"optionId":%d},
                   {"optionGroupId":4,"optionId":%d}]}]}
                """.formatted(product, size, temperature, sugar, ice)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalAmount").value(35000))
                .andExpect(jsonPath("$.changeReturned").value(65000));
    }

    private long option(String code) {
        return jdbc.queryForObject("SELECT id FROM option_values WHERE code=?", Long.class, code);
    }
}
