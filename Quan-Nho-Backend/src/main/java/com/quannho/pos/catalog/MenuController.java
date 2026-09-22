package com.quannho.pos.catalog;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/api")
public class MenuController {
    private final JdbcTemplate jdbc;
    public MenuController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/categories") public List<Map<String, Object>> categories() {
        return jdbc.queryForList("SELECT id, code, name, display_order, is_active FROM categories ORDER BY display_order, id");
    }

    @PostMapping("/categories") public Map<String, Object> createCategory(@RequestBody Map<String, Object> body) {
        String name = required(body, "name");
        String code = code(body.get("code"), "CAT");
        long id = jdbc.queryForObject("INSERT INTO categories(code,name,display_order,is_active) VALUES (?,?,?,?) RETURNING id",
                Long.class, code, name, integer(body.get("display_order"), 0), bool(body.get("is_active"), true));
        return category(id);
    }

    @PutMapping("/categories/{id}") public Map<String, Object> updateCategory(@PathVariable long id, @RequestBody Map<String, Object> body) {
        int count = jdbc.update("UPDATE categories SET code=?,name=?,display_order=?,is_active=?,updated_at=now() WHERE id=?",
                code(body.get("code"), "CAT"), required(body, "name"), integer(body.get("display_order"), 0),
                bool(body.get("is_active"), true), id);
        if (count == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return category(id);
    }

    @DeleteMapping("/categories/{id}") public void deleteCategory(@PathVariable long id) {
        if (jdbc.update("DELETE FROM categories WHERE id=?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    private Map<String, Object> category(long id) {
        return jdbc.queryForMap("SELECT id, code, name, display_order, is_active FROM categories WHERE id=?", id);
    }

    @GetMapping("/menu") public List<Map<String, Object>> menu() {
        return jdbc.query("SELECT p.id,p.category_id,c.code AS category,p.code,p.name,p.base_price,p.image_url," +
                "p.is_available,p.display_order FROM products p JOIN categories c ON c.id=p.category_id " +
                "ORDER BY p.display_order,p.id", (rs, row) -> productMap(rs.getLong("id"), rs.getLong("category_id"),
                rs.getString("category"), rs.getString("code"), rs.getString("name"), rs.getLong("base_price"),
                rs.getString("image_url"), rs.getBoolean("is_available"), rs.getInt("display_order")));
    }

    @PostMapping("/menu") public Map<String, Object> createProduct(@RequestBody Map<String, Object> body) {
        long categoryId = categoryId(body);
        long price = price(body);
        long id = jdbc.queryForObject("INSERT INTO products(category_id,code,name,base_price,image_url,is_available,display_order) " +
                        "VALUES (?,?,?,?,?,?,?) RETURNING id", Long.class,
                categoryId, code(body.get("code"), "PRODUCT"), required(body, "name"), price,
                first(body, "image_url", "image"), bool(first(body, "is_available", "isAvailable"), true),
                integer(body.get("display_order"), 0));
        return product(id);
    }

    @PutMapping("/menu/{id}") public Map<String, Object> updateProduct(@PathVariable long id, @RequestBody Map<String, Object> body) {
        Map<String, Object> old = product(id);
        int count = jdbc.update("UPDATE products SET category_id=?,code=?,name=?,base_price=?,image_url=?," +
                        "is_available=?,display_order=?,updated_at=now() WHERE id=?",
                categoryId(body), code(body.getOrDefault("code", old.get("code")), "PRODUCT"), required(body, "name"),
                price(body), first(body, "image_url", "image"), bool(first(body, "is_available", "isAvailable"), true),
                integer(body.get("display_order"), 0), id);
        if (count == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return product(id);
    }

    @PatchMapping("/menu/{id}/availability") public Map<String, Object> toggleAvailability(@PathVariable long id) {
        if (jdbc.update("UPDATE products SET is_available=NOT is_available,updated_at=now() WHERE id=?", id) == 0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return product(id);
    }

    @DeleteMapping("/menu/{id}") public void deleteProduct(@PathVariable long id) {
        if (jdbc.update("DELETE FROM products WHERE id=?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    private Map<String, Object> product(long id) {
        return jdbc.query("SELECT p.id,p.category_id,c.code AS category,p.code,p.name,p.base_price,p.image_url," +
                "p.is_available,p.display_order FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=?",
                (rs, row) -> productMap(rs.getLong("id"), rs.getLong("category_id"), rs.getString("category"),
                        rs.getString("code"), rs.getString("name"), rs.getLong("base_price"),
                        rs.getString("image_url"), rs.getBoolean("is_available"), rs.getInt("display_order")), id)
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private static Map<String, Object> productMap(long id, long categoryId, String category, String code,
            String name, long price, String image, boolean available, int displayOrder) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", id); result.put("category_id", categoryId); result.put("category", category);
        result.put("code", code); result.put("name", name); result.put("base_price", price); result.put("price", price);
        result.put("image_url", image); result.put("image", image); result.put("is_available", available);
        result.put("isAvailable", available); result.put("display_order", displayOrder);
        return result;
    }

    @GetMapping("/toppings") public List<Map<String, Object>> toppings() {
        return jdbc.query("SELECT v.id,v.name,v.extra_price FROM option_values v JOIN option_groups g ON g.id=v.option_group_id " +
                "WHERE g.code='TOPPING' ORDER BY v.display_order", (rs, row) -> Map.of(
                "id", String.valueOf(rs.getLong("id")), "name", rs.getString("name"), "price", rs.getLong("extra_price")));
    }

    @PostMapping("/toppings") public Map<String, Object> createTopping(@RequestBody Map<String, Object> body) {
        Long group = jdbc.queryForObject("SELECT id FROM option_groups WHERE code='TOPPING'", Long.class);
        long id = jdbc.queryForObject("INSERT INTO option_values(option_group_id,code,name,extra_price,is_default,display_order) " +
                "VALUES (?,?,?,?,false,(SELECT coalesce(max(display_order),0)+1 FROM option_values WHERE option_group_id=?)) RETURNING id",
                Long.class, group, code(null, "TOPPING"), required(body, "name"), number(body.get("price")), group);
        return Map.of("id", String.valueOf(id), "name", body.get("name"), "price", number(body.get("price")));
    }

    @PutMapping("/toppings/{id}") public Map<String, Object> updateTopping(@PathVariable long id, @RequestBody Map<String, Object> body) {
        if (jdbc.update("UPDATE option_values SET name=?,extra_price=?,updated_at=now() WHERE id=?",
                required(body, "name"), number(body.get("price")), id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return Map.of("id", String.valueOf(id), "name", body.get("name"), "price", number(body.get("price")));
    }

    @DeleteMapping("/toppings/{id}") public void deleteTopping(@PathVariable long id) {
        if (jdbc.update("DELETE FROM option_values WHERE id=?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    static Object first(Map<String, Object> data, String one, String two) { return data.containsKey(one) ? data.get(one) : data.get(two); }
    static String required(Map<String, Object> body, String key) {
        String value = String.valueOf(body.getOrDefault(key, "")).trim();
        if (value.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " is required");
        return value;
    }
    static String code(Object value, String prefix) {
        String code = value == null ? "" : String.valueOf(value).trim().toUpperCase();
        return code.isBlank() ? prefix + "_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() : code;
    }
    static long number(Object value) { return value == null ? 0 : Long.parseLong(String.valueOf(value)); }
    static int integer(Object value, int fallback) { return value == null ? fallback : Integer.parseInt(String.valueOf(value)); }
    static boolean bool(Object value, boolean fallback) { return value == null ? fallback : Boolean.parseBoolean(String.valueOf(value)); }
    private long categoryId(Map<String, Object> body) {
        Object raw = body.get("category_id");
        if (raw != null) return number(raw);
        String code = String.valueOf(body.get("category"));
        return jdbc.query("SELECT id FROM categories WHERE code=?", (rs, row) -> rs.getLong(1), code)
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown category"));
    }
    private static long price(Map<String, Object> body) {
        long value = number(first(body, "base_price", "price"));
        if (value <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be positive");
        return value;
    }
}
