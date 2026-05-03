package com.example.aic.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Component
public class DataMigrationInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataMigrationInitializer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        logger.info("Starting data migration to normalized Person entity...");

        migrateTable("users", "id");
        migrateTable("account_requests", "id");
        migrateTable("guest_contact_info", "id");

        logger.info("Data migration completed.");
    }

    private void migrateTable(String tableName, String idColumn) {
        try {
            // Check if table and columns exist
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT " + idColumn + ", first_name, last_name, phone FROM " + tableName + " WHERE person_id IS NULL AND first_name IS NOT NULL"
            );

            if (rows.isEmpty()) {
                logger.info("No legacy data found to migrate in table: {}", tableName);
                return;
            }

            logger.info("Migrating {} rows from table: {}", rows.size(), tableName);

            for (Map<String, Object> row : rows) {
                Object id = row.get(idColumn);
                String firstName = (String) row.get("first_name");
                String lastName = (String) row.get("last_name");
                String phone = (String) row.get("phone");

                // 1. Insert into persons
                jdbcTemplate.update(
                    "INSERT INTO persons (first_name, last_name, phone) VALUES (?, ?, ?)",
                    firstName, lastName, phone
                );

                // 2. Get last inserted ID
                Long personId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

                // 3. Update parent table
                jdbcTemplate.update(
                    "UPDATE " + tableName + " SET person_id = ? WHERE " + idColumn + " = ?",
                    personId, id
                );
            }
            
            logger.info("Successfully migrated data for table: {}", tableName);
            
        } catch (Exception e) {
            logger.warn("Could not migrate table {}: {}. This is expected if columns were already removed or migration already ran.", tableName, e.getMessage());
        }
    }
}
