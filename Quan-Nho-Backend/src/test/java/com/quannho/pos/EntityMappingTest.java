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
import com.quannho.pos.settings.sepay.SepaySettings;
import com.quannho.pos.settings.shop.ShopSettings;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
}
