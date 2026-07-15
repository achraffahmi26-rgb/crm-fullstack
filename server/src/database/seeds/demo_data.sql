-- Optional CRM Full-Stack demo data.
-- This file is never imported automatically.
-- Before running it, create internal users from the Admin UI with these emails:
--   demo.admin@crm.local
--   demo.employee@crm.local
-- Passwords are intentionally not seeded here because user accounts must be created through the Admin workspace.
-- The statements use INSERT IGNORE / NOT EXISTS checks to avoid overwriting existing rows.

START TRANSACTION;

SET @admin_id := (SELECT id FROM users WHERE email = 'demo.admin@crm.local' LIMIT 1);
SET @employee_id := (SELECT id FROM users WHERE email = 'demo.employee@crm.local' LIMIT 1);

-- Companies
INSERT INTO companies (name, industry, email, phone, website, address, city, country, created_by)
SELECT 'Atlas Digital Solutions', 'Software Services', 'contact@atlasdigital.example', '+212 522 410 100', 'https://atlasdigital.example', 'Twin Center, Maarif', 'Casablanca', 'Morocco', @admin_id
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM companies WHERE email = 'contact@atlasdigital.example');

INSERT INTO companies (name, industry, email, phone, website, address, city, country, created_by)
SELECT 'GreenMed Logistics', 'Logistics', 'operations@greenmed.example', '+212 537 620 210', 'https://greenmed.example', 'Avenue Annakhil, Hay Riad', 'Rabat', 'Morocco', @employee_id
WHERE @employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM companies WHERE email = 'operations@greenmed.example');

INSERT INTO companies (name, industry, email, phone, website, address, city, country, created_by)
SELECT 'Nova Retail Group', 'Retail', 'hello@novaretail.example', '+212 524 330 845', 'https://novaretail.example', 'Gueliz Business Center', 'Marrakech', 'Morocco', @admin_id
WHERE @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM companies WHERE email = 'hello@novaretail.example');

SET @atlas_company_id := (SELECT id FROM companies WHERE email = 'contact@atlasdigital.example' LIMIT 1);
SET @greenmed_company_id := (SELECT id FROM companies WHERE email = 'operations@greenmed.example' LIMIT 1);
SET @nova_company_id := (SELECT id FROM companies WHERE email = 'hello@novaretail.example' LIMIT 1);

-- Contacts
INSERT INTO contacts (company_id, first_name, last_name, email, phone, position)
SELECT @atlas_company_id, 'Salma', 'Bennani', 'salma.bennani@atlasdigital.example', '+212 661 204 118', 'Operations Director'
WHERE @atlas_company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'salma.bennani@atlasdigital.example');

INSERT INTO contacts (company_id, first_name, last_name, email, phone, position)
SELECT @greenmed_company_id, 'Youssef', 'El Amrani', 'youssef.elamrani@greenmed.example', '+212 662 418 902', 'Logistics Manager'
WHERE @greenmed_company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'youssef.elamrani@greenmed.example');

-- Customers
INSERT IGNORE INTO customers (company_id, assigned_to, created_by, first_name, last_name, email, phone, status, address, notes)
SELECT @atlas_company_id, @employee_id, @admin_id, 'Nadia', 'Karimi', 'nadia.karimi@atlasdigital.example', '+212 663 710 220', 'Active', 'Casablanca Finance City', 'Interested in annual CRM services.'
WHERE @atlas_company_id IS NOT NULL AND @admin_id IS NOT NULL;

INSERT IGNORE INTO customers (company_id, assigned_to, created_by, first_name, last_name, email, phone, status, address, notes)
SELECT @greenmed_company_id, @employee_id, @employee_id, 'Omar', 'Haddad', 'omar.haddad@greenmed.example', '+212 665 812 300', 'Active', 'Hay Riad, Rabat', 'Prefers monthly operational summaries.'
WHERE @greenmed_company_id IS NOT NULL AND @employee_id IS NOT NULL;

SET @atlas_customer_id := (SELECT id FROM customers WHERE email = 'nadia.karimi@atlasdigital.example' LIMIT 1);
SET @greenmed_customer_id := (SELECT id FROM customers WHERE email = 'omar.haddad@greenmed.example' LIMIT 1);

-- Leads
INSERT INTO leads (company_id, assigned_to, created_by, first_name, last_name, email, phone, source, status, estimated_value, notes)
SELECT @nova_company_id, @employee_id, @admin_id, 'Imane', 'Tazi', 'imane.tazi@novaretail.example', '+212 666 440 119', 'Referral', 'Qualified', 42000.00, 'Needs a proposal for multi-branch reporting.'
WHERE @nova_company_id IS NOT NULL AND @admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM leads WHERE email = 'imane.tazi@novaretail.example');

-- Categories and products
INSERT IGNORE INTO categories (name, description)
VALUES
  ('CRM Services', 'Implementation, support, and business workflow services'),
  ('Business Software', 'Subscription software and digital tools');

SET @services_category_id := (SELECT id FROM categories WHERE name = 'CRM Services' LIMIT 1);
SET @software_category_id := (SELECT id FROM categories WHERE name = 'Business Software' LIMIT 1);

INSERT IGNORE INTO products (category_id, name, sku, barcode, purchase_price, selling_price, description, status)
VALUES
  (@services_category_id, 'CRM Onboarding Package', 'CRM-ONBOARD-001', '611000000001', 2500.00, 6500.00, 'Initial setup, configuration, and admin training.', 'Active'),
  (@software_category_id, 'Sales Analytics Subscription', 'CRM-ANALYTICS-012', '611000000012', 1200.00, 3900.00, 'Monthly analytics and reporting module subscription.', 'Active'),
  (@services_category_id, 'Priority Support Retainer', 'CRM-SUPPORT-006', '611000000006', 800.00, 2400.00, 'Monthly priority support for internal CRM users.', 'Active');

SET @onboarding_product_id := (SELECT id FROM products WHERE sku = 'CRM-ONBOARD-001' LIMIT 1);
SET @analytics_product_id := (SELECT id FROM products WHERE sku = 'CRM-ANALYTICS-012' LIMIT 1);
SET @support_product_id := (SELECT id FROM products WHERE sku = 'CRM-SUPPORT-006' LIMIT 1);

INSERT IGNORE INTO inventory (product_id, quantity, minimum_stock, warehouse)
SELECT @onboarding_product_id, 25, 5, 'Casablanca Main' WHERE @onboarding_product_id IS NOT NULL;
INSERT IGNORE INTO inventory (product_id, quantity, minimum_stock, warehouse)
SELECT @analytics_product_id, 50, 10, 'Digital Licenses' WHERE @analytics_product_id IS NOT NULL;
INSERT IGNORE INTO inventory (product_id, quantity, minimum_stock, warehouse)
SELECT @support_product_id, 30, 5, 'Service Desk' WHERE @support_product_id IS NOT NULL;

-- Orders and invoices use database product prices through the application. These SQL rows are static demo records.
INSERT IGNORE INTO orders (order_number, customer_id, created_by, order_date, total_amount, status, notes)
SELECT 'ORD-DEMO-20260715-0001', @atlas_customer_id, @admin_id, '2026-07-15 09:30:00', 10400.00, 'Confirmed', 'Demo order for onboarding and analytics.'
WHERE @atlas_customer_id IS NOT NULL AND @admin_id IS NOT NULL;

SET @demo_order_id := (SELECT id FROM orders WHERE order_number = 'ORD-DEMO-20260715-0001' LIMIT 1);

INSERT IGNORE INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT @demo_order_id, @onboarding_product_id, 1, 6500.00, 6500.00
WHERE @demo_order_id IS NOT NULL AND @onboarding_product_id IS NOT NULL;

INSERT IGNORE INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT @demo_order_id, @analytics_product_id, 1, 3900.00, 3900.00
WHERE @demo_order_id IS NOT NULL AND @analytics_product_id IS NOT NULL;

INSERT IGNORE INTO invoices (order_id, issued_by, invoice_number, invoice_date, due_date, total_amount, payment_status)
SELECT @demo_order_id, @admin_id, 'INV-DEMO-20260715-0001', '2026-07-15', '2026-08-14', 10400.00, 'Partially Paid'
WHERE @demo_order_id IS NOT NULL AND @admin_id IS NOT NULL;

SET @demo_invoice_id := (SELECT id FROM invoices WHERE invoice_number = 'INV-DEMO-20260715-0001' LIMIT 1);

INSERT IGNORE INTO payments (invoice_id, amount, payment_method, payment_date, transaction_id, reference, status)
SELECT @demo_invoice_id, 5200.00, 'Bank Transfer', '2026-07-15 15:45:00', 'BT-DEMO-5200', 'Initial payment', 'Completed'
WHERE @demo_invoice_id IS NOT NULL;

-- Tasks and notifications
INSERT IGNORE INTO tasks (assigned_to, created_by, title, description, priority, status, due_date)
SELECT @employee_id, @admin_id, 'Prepare onboarding checklist', 'Review Atlas Digital Solutions requirements and prepare kickoff checklist.', 'High', 'In Progress', '2026-07-22'
WHERE @employee_id IS NOT NULL AND @admin_id IS NOT NULL;

INSERT IGNORE INTO notifications (user_id, title, message, type, is_read)
SELECT @employee_id, 'Demo workspace ready', 'Review the assigned customer, order, invoice, payment, and task records.', 'Info', false
WHERE @employee_id IS NOT NULL;

COMMIT;