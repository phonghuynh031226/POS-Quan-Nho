package com.quannho.pos.order;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController @RequestMapping("/api/orders")
public class OrderController {
    private final JdbcTemplate jdbc;
    public OrderController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping public List<Map<String, Object>> all() {
        return jdbc.queryForList("SELECT id FROM orders ORDER BY created_at DESC,id DESC").stream()
                .map(row -> one(((Number) row.get("id")).longValue())).toList();
    }

    @GetMapping("/{id}") public Map<String, Object> one(@PathVariable long id) {
        Map<String, Object> row = jdbc.queryForList("SELECT o.*,u.full_name AS creator_name FROM orders o " +
                "JOIN users u ON u.id=o.created_by WHERE o.id=?", id).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Map<String, Object> order = new LinkedHashMap<>(row);
        order.put("orderNumber", row.get("order_code")); order.put("totalAmount", row.get("total_amount"));
        order.put("cashGiven", row.get("cash_received")); order.put("changeReturned", row.get("change_amount"));
        order.put("paymentMethod", "CASH".equals(row.get("payment_method")) ? "TIEN_MAT" : "CHUYEN_KHOAN");
        order.put("paymentStatus", switch (String.valueOf(row.get("payment_status"))) {
            case "PAID" -> "DA_THANH_TOAN"; case "REFUNDED" -> "DA_HOAN_TIEN"; default -> "CHUA_THANH_TOAN";
        });
        order.put("fulfillmentStatus", "CANCELLED".equals(row.get("status")) ? "DA_HUY" : "DA_GIAO");
        order.put("createdAt", row.get("created_at")); order.put("paidAt", row.get("paid_at"));
        order.put("updatedAt", row.get("updated_at")); order.put("createdBy", row.get("creator_name"));
        order.put("refundAmount", row.get("refund_amount")); order.put("customerNote", row.get("customer_note"));
        List<Map<String, Object>> items = jdbc.queryForList("SELECT * FROM order_items WHERE order_id=? ORDER BY id", id)
                .stream().map(item -> {
                    Map<String, Object> line = new LinkedHashMap<>(item);
                    line.put("menuItemId", item.get("product_id")); line.put("name", item.get("product_name"));
                    line.put("unitPrice", item.get("unit_price")); line.put("surcharge", item.get("option_extra_price"));
                    line.put("lineTotal", item.get("line_total")); line.put("notes", item.get("customer_note"));
                    long itemId = ((Number) item.get("id")).longValue();
                    List<Map<String, Object>> options = jdbc.queryForList("SELECT * FROM order_item_options WHERE order_item_id=? ORDER BY id", itemId);
                    line.put("order_item_options", options);
                    line.put("selectedOptions", options.stream().map(option -> Map.of(
                            "optionGroupId", option.get("option_group_id") == null ? 0 : option.get("option_group_id"),
                            "optionId", option.get("option_value_id") == null ? 0 : option.get("option_value_id"),
                            "groupName", option.get("group_name"), "optionName", option.get("option_name"),
                            "extraPrice", option.get("extra_price"))).toList());
                    return line;
                }).toList();
        order.put("items", items); order.put("order_items", items);
        return order;
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String, Object> create(@RequestBody Map<String, Object> payload, Authentication authentication) {
        if (!"TIEN_MAT".equals(payload.get("paymentMethod")))
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Chuyển khoản chưa tích hợp SePay thật");
        if (!(payload.get("items") instanceof List<?> rawItems) || rawItems.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giỏ hàng trống");

        long userId = jdbc.queryForObject("SELECT id FROM users WHERE username=?", Long.class, authentication.getName());
        List<Line> lines = new ArrayList<>();
        long subtotal = 0;
        for (Object raw : rawItems) {
            if (!(raw instanceof Map<?, ?> item)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid item");
            long productId = number(item.get("menuItemId"));
            Map<String, Object> product = jdbc.queryForList("SELECT id,name,base_price,is_available FROM products WHERE id=?", productId)
                    .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Món không tồn tại"));
            if (!Boolean.TRUE.equals(product.get("is_available")))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Món đã hết");
            int quantity = (int) number(item.get("quantity"));
            List<Choice> choices = choices(productId, item.get("selectedOptions"));
            OrderPricing.Line price = OrderPricing.line(((Number) product.get("base_price")).longValue(),
                    choices.stream().map(Choice::price).toList(), quantity);
            subtotal = Math.addExact(subtotal, price.lineTotal());
            lines.add(new Line(productId, String.valueOf(product.get("name")), ((Number) product.get("base_price")).longValue(),
                    quantity, item.get("notes") == null ? "" : String.valueOf(item.get("notes")), choices, price));
        }
        long cash = number(payload.get("cashGiven"));
        if (cash < subtotal) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiền khách đưa chưa đủ");
        long id = jdbc.queryForObject("SELECT nextval('orders_id_seq')", Long.class);
        String orderCode = "QN-%06d".formatted(id);
        String token = UUID.randomUUID().toString().replace("-", "");
        jdbc.update("INSERT INTO orders(id,order_code,token,status,payment_status,payment_method,subtotal," +
                "discount_amount,total_amount,payment_amount,cash_received,change_amount,customer_note,refund_amount," +
                "created_by,paid_at) VALUES (?,?,?,'COMPLETED','PAID','CASH',?,0,?,?,?,?,?,0,?,now())",
                id, orderCode, token, subtotal, subtotal, subtotal, cash, cash - subtotal,
                payload.get("customer_note"), userId);
        for (Line line : lines) {
            long itemId = jdbc.queryForObject("INSERT INTO order_items(order_id,product_id,product_name,base_price," +
                    "option_extra_price,unit_price,quantity,line_total,customer_note) VALUES (?,?,?,?,?,?,?,?,?) RETURNING id",
                    Long.class, id, line.productId(), line.name(), line.basePrice(),
                    line.price().unitPrice() - line.basePrice(), line.price().unitPrice(), line.quantity(),
                    line.price().lineTotal(), line.note());
            for (Choice choice : line.choices()) {
                jdbc.update("INSERT INTO order_item_options(order_item_id,option_group_id,option_value_id," +
                        "group_name,option_name,extra_price) VALUES (?,?,?,?,?,?)", itemId, choice.groupId(),
                        choice.valueId(), choice.groupName(), choice.valueName(), choice.price());
            }
        }
        return one(id);
    }

    private List<Choice> choices(long productId, Object raw) {
        List<Choice> result = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        Map<Long, Integer> selectedCount = new HashMap<>();
        if (raw instanceof List<?> selected) for (Object entry : selected) {
            if (!(entry instanceof Map<?, ?> option)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid option");
            long groupId = number(option.get("optionGroupId"));
            long valueId = number(option.get("optionId"));
            if (!seen.add(valueId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate option");
            Map<String, Object> value = jdbc.queryForList("SELECT g.name AS group_name,v.name AS value_name,v.extra_price " +
                    "FROM product_option_groups r JOIN option_groups g ON g.id=r.option_group_id " +
                    "JOIN option_values v ON v.option_group_id=g.id WHERE r.product_id=? AND g.id=? AND v.id=? " +
                    "AND g.is_active AND v.is_active", productId, groupId, valueId).stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tùy chọn không thuộc món"));
            result.add(new Choice(groupId, valueId, String.valueOf(value.get("group_name")),
                    String.valueOf(value.get("value_name")), ((Number) value.get("extra_price")).longValue()));
            selectedCount.merge(groupId, 1, Integer::sum);
        }
        for (Map<String, Object> relation : jdbc.queryForList("SELECT option_group_id,min_select,max_select " +
                "FROM product_option_groups WHERE product_id=?", productId)) {
            long groupId = ((Number) relation.get("option_group_id")).longValue();
            int count = selectedCount.getOrDefault(groupId, 0);
            if (count < ((Number) relation.get("min_select")).intValue() ||
                    count > ((Number) relation.get("max_select")).intValue())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tùy chọn không hợp lệ");
        }
        return result;
    }

    @PostMapping("/{id}/cancel") @Transactional public Map<String, Object> cancel(@PathVariable long id,
            @RequestBody Map<String, Object> body) {
        String reason = String.valueOf(body.getOrDefault("reason", "")).trim();
        if (reason.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần lý do hủy");
        long refund = number(body.get("refundAmount"));
        Map<String, Object> order = one(id);
        if (refund < 0 || refund > ((Number) order.get("total_amount")).longValue())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền hoàn không hợp lệ");
        jdbc.update("UPDATE orders SET status='CANCELLED',payment_status=?,cancel_reason=?,refund_amount=?," +
                        "cancelled_at=now(),refunded_at=?,updated_at=now() WHERE id=?",
                refund > 0 ? "REFUNDED" : "PAID", reason, refund, refund > 0 ? java.time.OffsetDateTime.now() : null, id);
        return one(id);
    }

    private static long number(Object value) {
        if (value == null) return 0;
        try { return Long.parseLong(String.valueOf(value)); }
        catch (NumberFormatException ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid number"); }
    }
    private record Choice(long groupId, long valueId, String groupName, String valueName, long price) {}
    private record Line(long productId, String name, long basePrice, int quantity, String note,
                        List<Choice> choices, OrderPricing.Line price) {}
}
