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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
                .andExpect(jsonPath("$.changeReturned").value(65000))
                .andExpect(jsonPath("$.fulfillmentStatus").value("NEW"));
    }

    @Test @Transactional void fulfillmentStatusMovesForwardOneStepAtATime() throws Exception {
        long orderId = insertOrder("NEW", "QN-FLOW-TEST");

        updateStatus(orderId, "PREPARING").andExpect(status().isOk())
                .andExpect(jsonPath("$.fulfillmentStatus").value("PREPARING"));
        updateStatus(orderId, "READY_FOR_PICKUP").andExpect(status().isOk())
                .andExpect(jsonPath("$.fulfillmentStatus").value("READY_FOR_PICKUP"));
        updateStatus(orderId, "COMPLETED").andExpect(status().isOk())
                .andExpect(jsonPath("$.fulfillmentStatus").value("COMPLETED"));
    }

    @Test @Transactional void fulfillmentStatusRejectsSkipReverseUnknownAndMissingValues() throws Exception {
        long orderId = insertOrder("NEW", "QN-INVALID-FLOW");

        updateStatus(orderId, "READY_FOR_PICKUP").andExpect(status().isConflict());
        updateStatus(orderId, "UNKNOWN").andExpect(status().isBadRequest());
        mvc.perform(patch("/api/orders/{id}/fulfillment-status", orderId).with(csrf())
                        .contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest());

        updateStatus(orderId, "PREPARING").andExpect(status().isOk());
        updateStatus(orderId, "NEW").andExpect(status().isConflict());
    }

    @Test @Transactional void terminalOrdersRejectFurtherFulfillmentUpdates() throws Exception {
        long completedId = insertOrder("COMPLETED", "QN-COMPLETE-FLOW");
        long cancelledId = insertOrder("CANCELLED", "QN-CANCELLED-FLOW");

        updateStatus(completedId, "PREPARING").andExpect(status().isConflict());
        updateStatus(cancelledId, "PREPARING").andExpect(status().isConflict());
    }

    @Test @Transactional void activeOrderCanBeCancelledAndBothStatusesStayConsistent() throws Exception {
        long orderId = insertOrder("READY_FOR_PICKUP", "QN-CANCEL-ACTIVE");

        mvc.perform(post("/api/orders/{id}/cancel", orderId).with(csrf())
                        .contentType("application/json")
                        .content("{\"reason\":\"Khách đổi ý\",\"refundAmount\":29000}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.fulfillmentStatus").value("CANCELLED"))
                .andExpect(jsonPath("$.paymentStatus").value("DA_HOAN_TIEN"));
    }

    @Test @Transactional void completedOrderCannotBeCancelled() throws Exception {
        long orderId = insertOrder("COMPLETED", "QN-LOCKED-TEST");

        mvc.perform(post("/api/orders/{id}/cancel", orderId).with(csrf())
                        .contentType("application/json")
                        .content("{\"reason\":\"Không được phép\",\"refundAmount\":29000}"))
                .andExpect(status().isConflict());
    }

    private org.springframework.test.web.servlet.ResultActions updateStatus(long orderId, String fulfillmentStatus)
            throws Exception {
        return mvc.perform(patch("/api/orders/{id}/fulfillment-status", orderId).with(csrf())
                .contentType("application/json")
                .content("{\"status\":\"" + fulfillmentStatus + "\"}"));
    }

    private long insertOrder(String fulfillmentStatus, String orderCode) {
        long userId = jdbc.queryForObject("SELECT id FROM users WHERE username='admin'", Long.class);
        return jdbc.queryForObject("INSERT INTO orders(order_code,token,status,fulfillment_status,payment_status,payment_method," +
                        "subtotal,discount_amount,total_amount,payment_amount,cash_received,change_amount,refund_amount,created_by,paid_at) " +
                        "VALUES (?,?, 'COMPLETED',?,'PAID','CASH',29000,0,29000,29000,29000,0,0,?,now()) RETURNING id",
                Long.class, orderCode, orderCode.toLowerCase() + "-token", fulfillmentStatus, userId);
    }

    private long option(String code) {
        return jdbc.queryForObject("SELECT id FROM option_values WHERE code=?", Long.class, code);
    }
}
