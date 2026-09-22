package com.quannho.pos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

class FrontendSeedContractTest {

    private static final String SQL = read("database/database.sql");

    private static String read(String path) {
        try {
            return Files.readString(Path.of(path));
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String section(String start, String end) {
        int first = SQL.indexOf(start);
        int last = SQL.indexOf(end, first + start.length());
        assertTrue(first >= 0 && last > first, "Missing SQL section: " + start);
        return SQL.substring(first, last);
    }

    private static long matches(String source, String regex) {
        Matcher matcher = Pattern.compile(regex, Pattern.MULTILINE).matcher(source);
        long count = 0;
        while (matcher.find()) count++;
        return count;
    }

    @Test
    void schemaSupportsCurrentFrontendFieldsWithoutExtraTables() {
        assertEquals(11, matches(SQL, "^CREATE TABLE IF NOT EXISTS "));
        assertTrue(section("CREATE TABLE IF NOT EXISTS users", "CREATE TABLE IF NOT EXISTS categories").contains("email"));
        assertTrue(section("CREATE TABLE IF NOT EXISTS orders", "CREATE TABLE IF NOT EXISTS order_items").contains("token"));
        String shop = section("CREATE TABLE IF NOT EXISTS shop_settings", "CREATE TABLE IF NOT EXISTS sepay_settings");
        assertTrue(shop.contains("store_subtitle"));
        assertTrue(shop.contains("phone"));
        assertFalse(SQL.contains("CREATE TABLE IF NOT EXISTS payments"));
        assertFalse(SQL.contains("CREATE TABLE IF NOT EXISTS payment_settings"));
        assertFalse(Pattern.compile("(?i)\\b(DROP TABLE|TRUNCATE|DELETE FROM)\\b").matcher(SQL).find());
    }

    @Test
    void menuSeedMatchesFrontendCountsAndImportantDefaults() {
        assertEquals(11, matches(section("JOIN (VALUES", ") AS p(category_code"), "\\('[A-Z_]+', '[A-Z_]+',"));
        assertEquals(22, matches(section("INSERT INTO option_values", ") AS v(group_code"), "\\('[A-Z_]+', '[A-Z_0-9]+',"));
        assertEquals(33, matches(section("INSERT INTO product_option_groups", ") AS r(product_code"), "\\('[A-Z_0-9]+', '[A-Z_]+',"));
        assertTrue(SQL.contains("('SIZE', 'SIZE_S', 'Size S', 0, TRUE"));
        assertTrue(SQL.contains("('SIZE', 'SIZE_M', 'Size M', 6000, FALSE"));
        assertTrue(SQL.contains("'TRA_SUA_O_LONG', 'Trà sữa Ô long nướng', 42000"));
        assertFalse(section("INSERT INTO products", "INSERT INTO option_groups").contains("'TRA_SUA_O_LONG', 'Trà sữa Ô long nướng', 42000,\n     'https://images.unsplash.com/photo-1558857563-b371033873b8?w=500&auto=format&fit=crop&q=60', FALSE"));
    }

    @Test
    void demoOrdersPreserveFrontendTotalsAndTokens() {
        assertTrue(SQL.contains("'QN-000001'"));
        assertTrue(SQL.contains("'demo001tok'"));
        assertTrue(SQL.contains("64000"));
        assertTrue(SQL.contains("'QN-000002'"));
        assertTrue(SQL.contains("'demo002tok'"));
        assertTrue(SQL.contains("76000"));
        assertTrue(SQL.contains("'Cà phê & Đồ ăn vặt'"));
        assertTrue(SQL.contains("'090 123 4567'"));
    }
}
