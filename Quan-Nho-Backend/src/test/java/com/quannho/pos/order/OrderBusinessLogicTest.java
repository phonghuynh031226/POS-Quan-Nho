package com.quannho.pos.order;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@WithMockUser(username = "admin", roles = "OWNER")
class OrderBusinessLogicTest {

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired OrderAutoCancellationService autoCancellationService;

    private long productId;
    private long sizeM;
    private long iced;
    private long sugar100;
    private long iceNormal;

    @BeforeEach
    void setupIds() {
        productId = jdbc.queryForObject("SELECT id FROM products WHERE code='CA_PHE_SUA_DA'", Long.class);
        sizeM = jdbc.queryForObject("SELECT id FROM option_values WHERE code='SIZE_M'", Long.class);
        iced = jdbc.queryForObject("SELECT id FROM option_values WHERE code='ICED'", Long.class);
        sugar100 = jdbc.queryForObject("SELECT id FROM option_values WHERE code='SUGAR_100'", Long.class);
        iceNormal = jdbc.queryForObject("SELECT id FROM option_values WHERE code='ICE_NORMAL'", Long.class);
    }

    // 1. Validate cash given: must be >= total amount
    @Test @Transactional
    void rejectsOrderWhenCashGivenIsLessThanTotal() throws Exception {
        mvc.perform(post("/api/orders").with(csrf()).contentType("application/json").content("""
                {"paymentMethod":"TIEN_MAT","totalAmount":35000,"cashGiven":30000,
                 "items":[{"menuItemId":%d,"quantity":1,"selectedOptions":[
                   {"optionGroupId":1,"optionId":%d},{"optionGroupId":2,"optionId":%d},
                   {"optionGroupId":3,"optionId":%d},{"optionGroupId":4,"optionId":%d}]}]}
                """.formatted(productId, sizeM, iced, sugar100, iceNormal)))
                .andExpect(status().isBadRequest());
    }

    // 2. Validate quantity: must be positive
    @Test @Transactional
    void rejectsOrderWhenQuantityIsZeroOrNegative() throws Exception {
        mvc.perform(post("/api/orders").with(csrf()).contentType("application/json").content("""
                {"paymentMethod":"TIEN_MAT","cashGiven":100000,
                 "items":[{"menuItemId":%d,"quantity":0,"selectedOptions":[]}]}
                """.formatted(productId)))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/orders").with(csrf()).contentType("application/json").content("""
                {"paymentMethod":"TIEN_MAT","cashGiven":100000,
                 "items":[{"menuItemId":%d,"quantity":-5,"selectedOptions":[]}]}
                """.formatted(productId)))
                .andExpect(status().isBadRequest());
    }

    // 3. Validate product availability: unavailable products cannot be ordered
    @Test @Transactional
    void rejectsOrderForUnavailableProduct() throws Exception {
        jdbc.update("UPDATE products SET is_available=false WHERE id=?", productId);

        mvc.perform(post("/api/orders").with(csrf()).contentType("application/json").content("""
                {"paymentMethod":"TIEN_MAT","cashGiven":100000,
                 "items":[{"menuItemId":%d,"quantity":1,"selectedOptions":[
                   {"optionGroupId":1,"optionId":%d},{"optionGroupId":2,"optionId":%d},
                   {"optionGroupId":3,"optionId":%d},{"optionGroupId":4,"optionId":%d}]}]}
                """.formatted(productId, sizeM, iced, sugar100, iceNormal)))
                .andExpect(status().isBadRequest());
    }

    // 4. Duplicate option selection
    @Test @Transactional
    void rejectsOrderWithDuplicateOptions() throws Exception {
        mvc.perform(post("/api/orders").with(csrf()).contentType("application/json").content("""
                {"paymentMethod":"TIEN_MAT","cashGiven":100000,
                 "items":[{"menuItemId":%d,"quantity":1,"selectedOptions":[
                   {"optionGroupId":1,"optionId":%d},{"optionGroupId":1,"optionId":%d},
                   {"optionGroupId":2,"optionId":%d},{"optionGroupId":3,"optionId":%d},
                   {"optionGroupId":4,"optionId":%d}]}]}
                """.formatted(productId, sizeM, sizeM, iced, sugar100, iceNormal)))
                .andExpect(status().isBadRequest());
    }

    // 5. Option not belonging to product
    @Test @Transactional
    void rejectsOrderWithOptionNotBelongingToProduct() throws Exception {
        mvc.perform(post("/api/orders").with(csrf()).contentType("application/json").content("""
                {"paymentMethod":"TIEN_MAT","cashGiven":100000,
                 "items":[{"menuItemId":%d,"quantity":1,"selectedOptions":[
                   {"optionGroupId":999,"optionId":999}]}]}
                """.formatted(productId)))
                .andExpect(status().isBadRequest());
    }

    // 6. Missing required option
    @Test @Transactional
    void rejectsOrderWhenRequiredOptionGroupIsOmitted() throws Exception {
        mvc.perform(post("/api/orders").with(csrf()).contentType("application/json").content("""
                {"paymentMethod":"TIEN_MAT","cashGiven":100000,
                 "items":[{"menuItemId":%d,"quantity":1,"selectedOptions":[]}]}
                """.formatted(productId)))
                .andExpect(status().isBadRequest());
    }

    // 7. Auto-cancellation: NEW order older than 30 mins gets cancelled
    @Test @Transactional
    void autoCancelsNewOrderOlderThan30Minutes() throws Exception {
        long id = jdbc.queryForObject("SELECT nextval('orders_id_seq')", Long.class);
        jdbc.update("INSERT INTO orders(id,order_code,status,fulfillment_status,payment_status,payment_method," +
                "subtotal,discount_amount,total_amount,refund_amount,created_by,created_at) " +
                "VALUES (?,'QN-OVERDUE','COMPLETED','NEW','PAID','CASH',35000,0,35000,0,1,now() - INTERVAL '35 minutes')", id);

        int cancelled = autoCancellationService.cancelExpiredNewOrder(id);
        assertEquals(1, cancelled);

        String fulfillment = jdbc.queryForObject("SELECT fulfillment_status FROM orders WHERE id=?", String.class, id);
        assertEquals("CANCELLED", fulfillment);
    }

    // 8. Auto-cancellation: PREPARING order older than 30 mins is NOT cancelled
    @Test @Transactional
    void doesNotAutoCancelPreparingOrderOlderThan30Minutes() throws Exception {
        long id = jdbc.queryForObject("SELECT nextval('orders_id_seq')", Long.class);
        jdbc.update("INSERT INTO orders(id,order_code,status,fulfillment_status,payment_status,payment_method," +
                "subtotal,discount_amount,total_amount,refund_amount,created_by,created_at) " +
                "VALUES (?,'QN-PREP-OLD','COMPLETED','PREPARING','PAID','CASH',35000,0,35000,0,1,now() - INTERVAL '35 minutes')", id);

        int cancelled = autoCancellationService.cancelExpiredNewOrder(id);
        assertEquals(0, cancelled);

        String fulfillment = jdbc.queryForObject("SELECT fulfillment_status FROM orders WHERE id=?", String.class, id);
        assertEquals("PREPARING", fulfillment);
    }

    // 9. Cancel validation: reason is required
    @Test @Transactional
    void rejectsCancellationWithoutReason() throws Exception {
        long id = jdbc.queryForObject("SELECT nextval('orders_id_seq')", Long.class);
        jdbc.update("INSERT INTO orders(id,order_code,status,fulfillment_status,payment_status,payment_method," +
                "subtotal,discount_amount,total_amount,refund_amount,created_by,created_at) " +
                "VALUES (?,'QN-CANCEL-NOREASON','COMPLETED','NEW','PAID','CASH',35000,0,35000,0,1,now())", id);

        mvc.perform(post("/api/orders/{id}/cancel", id).with(csrf()).contentType("application/json")
                .content("{\"reason\":\"   \",\"refundAmount\":0}"))
                .andExpect(status().isBadRequest());
    }

    // 10. Cancel validation: negative refund or refund > totalAmount rejected
    @Test @Transactional
    void rejectsInvalidRefundAmount() throws Exception {
        long id = jdbc.queryForObject("SELECT nextval('orders_id_seq')", Long.class);
        jdbc.update("INSERT INTO orders(id,order_code,status,fulfillment_status,payment_status,payment_method," +
                "subtotal,discount_amount,total_amount,refund_amount,created_by,created_at) " +
                "VALUES (?,'QN-CANCEL-REFUND','COMPLETED','NEW','PAID','CASH',35000,0,35000,0,1,now())", id);

        // Negative
        mvc.perform(post("/api/orders/{id}/cancel", id).with(csrf()).contentType("application/json")
                .content("{\"reason\":\"Hủy đơn\",\"refundAmount\":-1000}"))
                .andExpect(status().isBadRequest());

        // Exceeding total
        mvc.perform(post("/api/orders/{id}/cancel", id).with(csrf()).contentType("application/json")
                .content("{\"reason\":\"Hủy đơn\",\"refundAmount\":50000}"))
                .andExpect(status().isBadRequest());
    }

    // 11. Loss calculation: NEW = 0 loss, PREPARING = full order loss
    @Test @Transactional
    void calculatesMaterialLossCorrectlyBasedOnStatus() throws Exception {
        // Cancel from NEW
        long idNew = jdbc.queryForObject("SELECT nextval('orders_id_seq')", Long.class);
        jdbc.update("INSERT INTO orders(id,order_code,status,fulfillment_status,payment_status,payment_method," +
                "subtotal,discount_amount,total_amount,refund_amount,created_by,created_at) " +
                "VALUES (?,'QN-LOSS-NEW','COMPLETED','NEW','PAID','CASH',35000,0,35000,0,1,now())", idNew);

        mvc.perform(post("/api/orders/{id}/cancel", idNew).with(csrf()).contentType("application/json")
                .content("{\"reason\":\"Khách hủy sớm\",\"refundAmount\":35000}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cancellationLossType").value("NO_MATERIAL_LOSS"))
                .andExpect(jsonPath("$.lossAmount").value(0))
                .andExpect(jsonPath("$.refundAmount").value(35000));

        // Cancel from PREPARING
        long idPrep = jdbc.queryForObject("SELECT nextval('orders_id_seq')", Long.class);
        jdbc.update("INSERT INTO orders(id,order_code,status,fulfillment_status,payment_status,payment_method," +
                "subtotal,discount_amount,total_amount,refund_amount,created_by,created_at) " +
                "VALUES (?,'QN-LOSS-PREP','COMPLETED','PREPARING','PAID','CASH',35000,0,35000,0,1,now())", idPrep);

        mvc.perform(post("/api/orders/{id}/cancel", idPrep).with(csrf()).contentType("application/json")
                .content("{\"reason\":\"Hỏng đồ\",\"refundAmount\":35000}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cancellationLossType").value("FULL_ORDER_LOSS"))
                .andExpect(jsonPath("$.lossAmount").value(35000))
                .andExpect(jsonPath("$.refundAmount").value(35000));
    }
}
