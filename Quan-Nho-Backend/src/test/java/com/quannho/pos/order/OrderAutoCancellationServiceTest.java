package com.quannho.pos.order;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderAutoCancellationServiceTest {
    @Mock JdbcTemplate jdbc;

    @Test
    void cancelsOnlyNewUnworkedOrdersOlderThanThirtyMinutesWithoutRecordingARefund() {
        when(jdbc.update(org.mockito.ArgumentMatchers.anyString())).thenReturn(2);

        int cancelled = new OrderAutoCancellationService(jdbc).cancelExpiredNewOrders();

        assertTrue(cancelled == 2);
        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(jdbc).update(sqlCaptor.capture());
        String sql = sqlCaptor.getValue();
        assertTrue(sql.contains("fulfillment_status='NEW'"));
        assertTrue(sql.contains("created_at < CURRENT_TIMESTAMP - INTERVAL '30 minutes'"));
        assertTrue(sql.contains("cancelled_from_status='NEW'"));
        assertTrue(sql.contains("refund_amount=0"));
        assertTrue(sql.contains("loss_amount=0"));
        assertTrue(sql.contains("status<>'CANCELLED'"));
    }

    @Test
    void canExpireOneOrderImmediatelyWhenSomeoneTriesToStartItAfterTheDeadline() {
        when(jdbc.update(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any(Object[].class)))
                .thenReturn(1);

        int cancelled = new OrderAutoCancellationService(jdbc).cancelExpiredNewOrder(42L);

        assertEquals(1, cancelled);
        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc).update(sqlCaptor.capture(), argsCaptor.capture());
        assertTrue(sqlCaptor.getValue().endsWith("AND id=?"));
        assertEquals(42L, argsCaptor.getValue()[0]);
    }
}
