package com.quannho.pos.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("local") @WithMockUser(roles = "OWNER")
class CatalogApiTest {
    @Autowired MockMvc mvc;

    @Test void menuReadsSeededProductsFromPostgres() throws Exception {
        mvc.perform(get("/api/menu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code == 'CA_PHE_SUA_DA')].price").value(29000));
    }

    @Test void optionGroupsIncludeStoredValues() throws Exception {
        mvc.perform(get("/api/options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code == 'SIZE')].options[0].name").value("Size S"));
    }
}
