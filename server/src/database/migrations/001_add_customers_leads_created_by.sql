-- Phase 13B: Add ownership columns to customers and leads.
-- Run this against the crm_pro database before deploying backend code that reads created_by.
-- This migration is written to be idempotent for MySQL using information_schema checks.
--
-- Manual fallback if your MySQL version/environment rejects prepared ALTER statements:
--   1. ALTER TABLE customers ADD COLUMN created_by int NULL AFTER assigned_to;
--   2. ALTER TABLE leads ADD COLUMN created_by int NULL AFTER assigned_to;
--   3. Backfill with the UPDATE statements below.
--   4. ALTER both columns to int NOT NULL after confirming no NULL values remain.
--   5. Add the indexes and foreign keys shown below if they do not already exist.

USE `crm_pro`;

SET @active_admin_id := (
  SELECT u.id
  FROM users u
  INNER JOIN roles r ON r.id = u.role_id
  WHERE r.name = 'Admin' AND u.status = 'Active'
  ORDER BY u.id ASC
  LIMIT 1
);

SET @fallback_user_id := COALESCE(@active_admin_id, (SELECT id FROM users ORDER BY id ASC LIMIT 1));

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'customers' AND column_name = 'created_by') = 0,
  'ALTER TABLE customers ADD COLUMN created_by int NULL AFTER assigned_to',
  'SELECT ''customers.created_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'leads' AND column_name = 'created_by') = 0,
  'ALTER TABLE leads ADD COLUMN created_by int NULL AFTER assigned_to',
  'SELECT ''leads.created_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE customers
SET created_by = COALESCE(assigned_to, @fallback_user_id)
WHERE created_by IS NULL;

UPDATE leads
SET created_by = COALESCE(assigned_to, @fallback_user_id)
WHERE created_by IS NULL;

SET @sql := IF(
  (SELECT COUNT(*) FROM customers WHERE created_by IS NULL) = 0,
  'ALTER TABLE customers MODIFY COLUMN created_by int NOT NULL',
  'SELECT ''customers.created_by still has NULL values; resolve before making NOT NULL'' AS warning'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM leads WHERE created_by IS NULL) = 0,
  'ALTER TABLE leads MODIFY COLUMN created_by int NOT NULL',
  'SELECT ''leads.created_by still has NULL values; resolve before making NOT NULL'' AS warning'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'customers' AND index_name = 'customers_created_by_index') = 0,
  'ALTER TABLE customers ADD INDEX customers_created_by_index (created_by)',
  'SELECT ''customers_created_by_index already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'leads' AND index_name = 'leads_created_by_index') = 0,
  'ALTER TABLE leads ADD INDEX leads_created_by_index (created_by)',
  'SELECT ''leads_created_by_index already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema = DATABASE() AND table_name = 'customers' AND constraint_name = 'customers_created_by_fk') = 0,
  'ALTER TABLE customers ADD CONSTRAINT customers_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT ''customers_created_by_fk already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema = DATABASE() AND table_name = 'leads' AND constraint_name = 'leads_created_by_fk') = 0,
  'ALTER TABLE leads ADD CONSTRAINT leads_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT ''leads_created_by_fk already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
