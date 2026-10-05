package com.quannho.pos.order;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OrderAutoCancellationService {
    private final JdbcTemplate jdbc;

    public OrderAutoCancellationService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Scheduled(fixedDelay = 15_000)
    @Transactional
    public int cancelExpiredNewOrders() {
        return cancelExpiredNewOrder(null);
    }

    @Transactional
    public int cancelExpiredNewOrder(Long orderId) {
        String sql = "UPDATE orders SET status='CANCELLED',fulfillment_status='CANCELLED'," +
                "cancel_reason='Tự động hủy: quá 30 phút chưa bắt đầu chế biến; chưa ghi nhận hoàn tiền',refund_amount=0," +
                "cancelled_from_status='NEW',cancellation_loss_type='NO_MATERIAL_LOSS',loss_amount=0," +
                "cancelled_at=CURRENT_TIMESTAMP,refunded_at=NULL,updated_at=CURRENT_TIMESTAMP " +
                "WHERE fulfillment_status='NEW' AND status<>'CANCELLED' " +
                "AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 minutes'";
        if (orderId == null) return jdbc.update(sql);
        return jdbc.update(sql + " AND id=?", orderId);
    }
}
