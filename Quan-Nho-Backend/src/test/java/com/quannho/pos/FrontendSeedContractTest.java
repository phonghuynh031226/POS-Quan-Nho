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
    void schemaScriptDoesNotInsertSampleRows() {
        assertFalse(Pattern.compile("(?im)^\\s*INSERT\\s+INTO\\s+(users|categories|products|option_groups|option_values|product_option_groups|orders|order_items|order_item_options|shop_settings|sepay_settings)\\b")
                .matcher(SQL).find());
    }

    @Test
    void schemaScriptDoesNotContainDemoCredentialsOrOrders() {
        assertFalse(SQL.contains("admin / 123456"));
        assertFalse(SQL.contains("demo001tok"));
        assertFalse(SQL.contains("demo002tok"));
        assertFalse(SQL.contains("QN-000001"));
        assertFalse(SQL.contains("QN-000002"));
    }
}
