package com.quannho.pos.catalog;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api")
public class OptionController {
    private final JdbcTemplate jdbc;
    public OptionController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/options") public List<Map<String, Object>> groups() {
        return jdbc.queryForList("SELECT id,code,name,selection_type,default_required,default_min_select," +
                "default_max_select,display_order,is_active FROM option_groups ORDER BY display_order,id")
                .stream().map(this::withValues).toList();
    }

    @PostMapping("/options") @Transactional public Map<String, Object> create(@RequestBody Map<String, Object> body) {
        String name = MenuController.required(body, "name");
        boolean required = MenuController.bool(MenuController.first(body, "default_required", "required"), false);
        int max = MenuController.integer(MenuController.first(body, "default_max_select", "maxSelect"), 1);
        long id = jdbc.queryForObject("INSERT INTO option_groups(code,name,selection_type,default_required," +
                        "default_min_select,default_max_select,display_order,is_active) VALUES (?,?,?,?,?,?,?,?) RETURNING id",
                Long.class, MenuController.code(body.get("code"), "GROUP"), name,
                String.valueOf(MenuController.first(body, "selection_type", "selectionType")), required,
                MenuController.integer(body.get("default_min_select"), required ? 1 : 0), max,
                MenuController.integer(MenuController.first(body, "display_order", "displayOrder"), 0),
                MenuController.bool(MenuController.first(body, "is_active", "isActive"), true));
        saveValues(id, body);
        return group(id);
    }

    @PutMapping("/options/{id}") @Transactional public Map<String, Object> update(@PathVariable long id,
            @RequestBody Map<String, Object> body) {
        Map<String, Object> old = group(id);
        boolean required = MenuController.bool(MenuController.first(body, "default_required", "required"), false);
        int max = MenuController.integer(MenuController.first(body, "default_max_select", "maxSelect"), 1);
        jdbc.update("UPDATE option_groups SET code=?,name=?,selection_type=?,default_required=?," +
                        "default_min_select=?,default_max_select=?,display_order=?,is_active=?,updated_at=now() WHERE id=?",
                MenuController.code(body.getOrDefault("code", old.get("code")), "GROUP"), MenuController.required(body, "name"),
                String.valueOf(MenuController.first(body, "selection_type", "selectionType")), required,
                MenuController.integer(body.get("default_min_select"), required ? 1 : 0), max,
                MenuController.integer(MenuController.first(body, "display_order", "displayOrder"), 0),
                MenuController.bool(MenuController.first(body, "is_active", "isActive"), true), id);
        saveValues(id, body);
        return group(id);
    }

    @DeleteMapping("/options/{id}") @Transactional public void delete(@PathVariable long id) {
        jdbc.update("DELETE FROM product_option_groups WHERE option_group_id=?", id);
        if (jdbc.update("DELETE FROM option_groups WHERE id=?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    private void saveValues(long groupId, Map<String, Object> body) {
        if (!(body.get("options") instanceof List<?> options)) return;
        List<Long> retained = new ArrayList<>();
        int position = 0;
        for (Object raw : options) {
            if (!(raw instanceof Map<?, ?> option)) continue;
            position++;
            String name = String.valueOf(option.get("name")).trim();
            if (name.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Option name required");
            long price = MenuController.number(option.containsKey("extra_price") ? option.get("extra_price") : option.get("extraPrice"));
            if (price < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Negative price");
            Object rawId = option.get("id");
            Long id = null;
            if (rawId != null) try { id = Long.parseLong(String.valueOf(rawId)); } catch (NumberFormatException ignored) {}
            String code = MenuController.code(option.get("code"), "VALUE");
            boolean defaultValue = MenuController.bool(option.containsKey("is_default") ? option.get("is_default") : option.get("isDefault"), false);
            boolean active = MenuController.bool(option.containsKey("is_active") ? option.get("is_active") : option.get("isActive"), true);
            if (id != null && jdbc.update("UPDATE option_values SET name=?,extra_price=?,is_default=?,display_order=?," +
                    "is_active=?,updated_at=now() WHERE id=? AND option_group_id=?", name, price, defaultValue,
                    position, active, id, groupId) > 0) {
                retained.add(id);
            } else {
                long inserted = jdbc.queryForObject("INSERT INTO option_values(option_group_id,code,name,extra_price," +
                                "is_default,display_order,is_active) VALUES (?,?,?,?,?,?,?) RETURNING id", Long.class,
                        groupId, code, name, price, defaultValue, position, active);
                retained.add(inserted);
            }
        }
        if (retained.isEmpty()) jdbc.update("DELETE FROM option_values WHERE option_group_id=?", groupId);
        else {
            String marks = String.join(",", retained.stream().map(id -> "?").toList());
            Object[] args = new Object[retained.size() + 1]; args[0] = groupId;
            for (int i = 0; i < retained.size(); i++) args[i + 1] = retained.get(i);
            jdbc.update("DELETE FROM option_values WHERE option_group_id=? AND id NOT IN (" + marks + ")", args);
        }
    }

    private Map<String, Object> group(long id) {
        return jdbc.query("SELECT id,code,name,selection_type,default_required,default_min_select," +
                "default_max_select,display_order,is_active FROM option_groups WHERE id=?",
                (rs, row) -> withValues(Map.of("id", rs.getLong("id"), "code", rs.getString("code"),
                        "name", rs.getString("name"), "selection_type", rs.getString("selection_type"),
                        "default_required", rs.getBoolean("default_required"), "default_min_select", rs.getInt("default_min_select"),
                        "default_max_select", rs.getInt("default_max_select"), "display_order", rs.getInt("display_order"),
                        "is_active", rs.getBoolean("is_active"))), id).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private Map<String, Object> withValues(Map<String, Object> raw) {
        Map<String, Object> group = new LinkedHashMap<>(raw);
        long id = MenuController.number(raw.get("id"));
        group.put("selectionType", raw.get("selection_type")); group.put("required", raw.get("default_required"));
        group.put("minSelect", raw.get("default_min_select")); group.put("maxSelect", raw.get("default_max_select"));
        group.put("displayOrder", raw.get("display_order")); group.put("isActive", raw.get("is_active"));
        group.put("options", jdbc.query("SELECT id,option_group_id,code,name,extra_price,is_default,display_order,is_active " +
                "FROM option_values WHERE option_group_id=? ORDER BY display_order,id", (rs, row) -> {
            Map<String, Object> value = new LinkedHashMap<>();
            value.put("id", rs.getLong("id")); value.put("option_group_id", rs.getLong("option_group_id"));
            value.put("code", rs.getString("code")); value.put("name", rs.getString("name"));
            value.put("extra_price", rs.getLong("extra_price")); value.put("extraPrice", rs.getLong("extra_price"));
            value.put("is_default", rs.getBoolean("is_default")); value.put("isDefault", rs.getBoolean("is_default"));
            value.put("display_order", rs.getInt("display_order")); value.put("is_active", rs.getBoolean("is_active"));
            value.put("isActive", rs.getBoolean("is_active")); return value;
        }, id));
        return group;
    }

    @GetMapping("/products/{productId}/option-groups") public List<Map<String, Object>> relations(@PathVariable long productId) {
        return jdbc.queryForList("SELECT id,product_id,option_group_id,is_required,min_select,max_select,display_order " +
                "FROM product_option_groups WHERE product_id=? ORDER BY display_order,id", productId).stream().map(raw -> {
            Map<String, Object> relation = new LinkedHashMap<>(raw);
            relation.put("productId", raw.get("product_id")); relation.put("optionGroupId", raw.get("option_group_id"));
            relation.put("required", raw.get("is_required")); relation.put("maxSelect", raw.get("max_select"));
            relation.put("displayOrder", raw.get("display_order")); return relation;
        }).toList();
    }

    @GetMapping("/product-option-groups") public List<Map<String, Object>> allRelations() {
        return jdbc.queryForList("SELECT id,product_id,option_group_id,is_required,min_select,max_select,display_order " +
                "FROM product_option_groups ORDER BY product_id,display_order,id");
    }

    @PutMapping("/products/{productId}/option-groups") @Transactional
    public List<Map<String, Object>> saveRelations(@PathVariable long productId, @RequestBody List<Map<String, Object>> relations) {
        jdbc.update("DELETE FROM product_option_groups WHERE product_id=?", productId);
        int position = 0;
        for (Map<String, Object> relation : relations) {
            position++;
            boolean required = MenuController.bool(MenuController.first(relation, "is_required", "required"), false);
            jdbc.update("INSERT INTO product_option_groups(product_id,option_group_id,is_required,min_select,max_select,display_order) " +
                    "VALUES (?,?,?,?,?,?)", productId,
                    MenuController.number(MenuController.first(relation, "option_group_id", "optionGroupId")), required,
                    MenuController.integer(relation.get("min_select"), required ? 1 : 0),
                    MenuController.integer(MenuController.first(relation, "max_select", "maxSelect"), 1),
                    MenuController.integer(MenuController.first(relation, "display_order", "displayOrder"), position));
        }
        return relations(productId);
    }

    @GetMapping("/products/{productId}/option-groups/detailed") public List<Map<String, Object>> detailed(@PathVariable long productId) {
        Map<Long, Map<String, Object>> groups = new LinkedHashMap<>();
        for (Map<String, Object> group : groups()) groups.put(MenuController.number(group.get("id")), group);
        return relations(productId).stream().map(relation -> {
            Map<String, Object> source = groups.get(MenuController.number(relation.get("option_group_id")));
            if (source == null) return null;
            Map<String, Object> detail = new LinkedHashMap<>(source);
            detail.put("relationId", relation.get("id")); detail.put("required", relation.get("is_required"));
            detail.put("minSelect", relation.get("min_select")); detail.put("maxSelect", relation.get("max_select"));
            detail.put("displayOrder", relation.get("display_order")); return detail;
        }).filter(item -> item != null).toList();
    }
}
