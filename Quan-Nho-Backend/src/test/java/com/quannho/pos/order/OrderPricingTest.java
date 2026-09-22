package com.quannho.pos.order;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class OrderPricingTest {
    @Test
    void calculatesPriceFromDatabaseValuesNotBrowserTotals() {
        var line = OrderPricing.line(29000, List.of(6000L, 0L), 2);
        assertEquals(35000, line.unitPrice());
        assertEquals(70000, line.lineTotal());
    }

    @Test
    void rejectsInvalidQuantityAndNegativePrices() {
        assertThrows(IllegalArgumentException.class, () -> OrderPricing.line(29000, List.of(), 0));
        assertThrows(IllegalArgumentException.class, () -> OrderPricing.line(-1, List.of(), 1));
        assertThrows(IllegalArgumentException.class, () -> OrderPricing.line(29000, List.of(-1L), 1));
    }
}
