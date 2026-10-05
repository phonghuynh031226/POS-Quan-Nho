package com.quannho.pos.order;

import java.util.List;

public final class OrderPricing {
    private OrderPricing() {}

    public record Line(long unitPrice, long lineTotal) {}

    public static int quantity(long quantity) {
        if (quantity <= 0 || quantity > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Invalid order quantity");
        }
        return (int) quantity;
    }

    public static Line line(long basePrice, List<Long> optionPrices, int quantity) {
        if (basePrice < 0 || quantity <= 0 || optionPrices == null || optionPrices.stream().anyMatch(p -> p == null || p < 0)) {
            throw new IllegalArgumentException("Invalid order line price or quantity");
        }
        long extras = optionPrices.stream().mapToLong(Long::longValue).reduce(0L, Math::addExact);
        long unitPrice = Math.addExact(basePrice, extras);
        return new Line(unitPrice, Math.multiplyExact(unitPrice, quantity));
    }
}
