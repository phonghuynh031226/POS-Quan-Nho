package com.quannho.pos;

import com.quannho.pos.auth.User;
import com.quannho.pos.catalog.category.Category;
import com.quannho.pos.catalog.option.OptionGroup;
import com.quannho.pos.catalog.option.OptionValue;
import com.quannho.pos.catalog.option.ProductOptionGroup;
import com.quannho.pos.catalog.product.Product;
import com.quannho.pos.order.Order;
import com.quannho.pos.order.OrderItem;
import com.quannho.pos.order.OrderItemOption;
import com.quannho.pos.order.CancellationLossType;
import com.quannho.pos.settings.sepay.SepaySettings;
import com.quannho.pos.settings.shop.ShopSettings;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class EntityMappingTest {
    @Test
    void allElevenTablesAreMappedByFeature() {
        List<Class<?>> entities = List.of(User.class, Category.class, Product.class,
                OptionGroup.class, OptionValue.class, ProductOptionGroup.class,
                Order.class, OrderItem.class, OrderItemOption.class,
                ShopSettings.class, SepaySettings.class);
        assertEquals(11, entities.size());
        for (Class<?> type : entities) {
            assertNotNull(type.getAnnotation(Entity.class), type.getName());
            assertNotNull(type.getAnnotation(Table.class), type.getName());
            assertTrue(type.getPackageName().startsWith("com.quannho.pos."));
        }
    }

    @Test
    void relationshipsAreLazyAndUnidirectional() throws NoSuchFieldException {
        for (Class<?> type : List.of(Product.class, OptionValue.class,
                ProductOptionGroup.class, Order.class, OrderItem.class, OrderItemOption.class)) {
            for (Field field : type.getDeclaredFields()) {
                ManyToOne relation = field.getAnnotation(ManyToOne.class);
                if (relation != null) assertEquals(FetchType.LAZY, relation.fetch(), field.toString());
            }
        }
        assertNotNull(Order.class.getDeclaredField("token"));
        assertNotNull(User.class.getDeclaredField("email"));
        assertNotNull(ShopSettings.class.getDeclaredField("storeSubtitle"));
        assertNotNull(ShopSettings.class.getDeclaredField("phone"));
    }

    @Test
    void orderMapsFulfillmentStatus() throws Exception {
        Field field = Order.class.getDeclaredField("fulfillmentStatus");
        assertEquals(EnumType.STRING, field.getAnnotation(Enumerated.class).value());
        Column column = field.getAnnotation(Column.class);
        assertEquals("fulfillment_status", column.name());
        assertFalse(column.nullable());

        Order order = new Order();
        field.setAccessible(true);
        assertEquals("NEW", ((Enum<?>) field.get(order)).name());
    }

    @Test
    void orderMapsCancellationLossAuditFields() throws Exception {
        Field cancelledFrom = Order.class.getDeclaredField("cancelledFromStatus");
        assertEquals(EnumType.STRING, cancelledFrom.getAnnotation(Enumerated.class).value());
        assertEquals("cancelled_from_status", cancelledFrom.getAnnotation(Column.class).name());

        Field lossType = Order.class.getDeclaredField("cancellationLossType");
        assertEquals(EnumType.STRING, lossType.getAnnotation(Enumerated.class).value());
        assertEquals("cancellation_loss_type", lossType.getAnnotation(Column.class).name());
        assertArrayEquals(
                new String[]{"NO_MATERIAL_LOSS", "FULL_ORDER_LOSS"},
                java.util.Arrays.stream(CancellationLossType.values()).map(Enum::name).toArray(String[]::new));

        Field lossAmount = Order.class.getDeclaredField("lossAmount");
        Column lossColumn = lossAmount.getAnnotation(Column.class);
        assertEquals("loss_amount", lossColumn.name());
        assertFalse(lossColumn.nullable());
        lossAmount.setAccessible(true);
        assertEquals(0L, lossAmount.getLong(new Order()));
    }
}
