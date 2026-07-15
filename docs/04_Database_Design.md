# CRM Full-Stack – Database Design

## 1. Database Overview

This document defines the database design principles for CRM Full-Stack, aligning the data architecture with the project’s technology stack. The database layer will support the CRM application’s core modules while enabling maintainability, performance, and consistency.

## 2. Why MySQL was selected

MySQL is selected as the relational database for CRM Full-Stack due to its broad adoption, strong community support, and proven reliability in enterprise web applications. MySQL provides mature transactional support, flexible indexing, and compatibility with common hosting environments, which makes it a suitable choice for a scalable CRM platform.

## 3. Why phpMyAdmin is used

phpMyAdmin is chosen for database administration because it provides a web-based interface for managing MySQL databases, simplifying schema inspection, query execution, and backup operations. It enables developers and administrators to perform routine database tasks without requiring direct command-line access.

## 4. Database Naming Conventions

Consistent naming conventions improve clarity and ease development collaboration.

- Use lowercase with underscores for table names: `customer_profiles`, `sales_orders`.
- Use singular nouns for table names when possible: `customer`, `invoice`.
- Use lowercase with underscores for column names: `created_at`, `first_name`.
- Use descriptive names for foreign key columns: `user_id`, `company_id`.
- Prefix junction tables with related entity names if needed: `order_product`, `user_role`.

## 5. Primary Keys

Primary keys will uniquely identify records in each table. The preferred convention is to use an auto-incrementing integer column named `id` for simple primary key access. Where natural keys are required, they should be stable, immutable, and documented clearly.

## 6. Foreign Keys

Foreign keys will enforce referential integrity between related tables. Each foreign key column should be explicitly defined and named using the related entity’s primary key convention, such as `customer_id`, `product_id`, or `company_id`.

## 7. Indexing Strategy

Indexes are essential for query performance and scalability.

- Create indexes on columns used frequently in `WHERE`, `JOIN`, and `ORDER BY` clauses.
- Use composite indexes for common multi-column search patterns.
- Index foreign key columns to improve relational query performance.
- Avoid excessive indexing; balance read performance with write overhead.

## 8. Data Integrity Rules

Maintaining data integrity is critical for CRM accuracy.

- Enforce required fields with `NOT NULL` constraints where appropriate.
- Use unique constraints for columns that require uniqueness, such as email addresses or reference codes.
- Apply appropriate data types for numeric, textual, boolean, and date/time values.
- Use database-level constraints to support business rules and prevent invalid data.

## 9. Backup Strategy

A robust backup strategy protects the data and supports recovery.

- Schedule regular full backups of the MySQL database.
- Retain backups for a configurable period based on business requirements.
- Validate backup integrity periodically.
- Maintain a documented restore process to recover from failure scenarios.

## 10. Security Considerations

Database security is a foundational requirement for CRM Full-Stack.

- Use strong credentials and role-based access for database users.
- Limit database access to authorized application servers.
- Encrypt sensitive data at rest where appropriate.
- Ensure backups are stored securely and access is restricted.
- Monitor database access and audit user activity.

## Current Database Entities

### Security

- **Roles**: Defines named access levels and permission sets used by the authorization layer.
- **Users**: Represents authenticated individuals who access CRM Full-Stack and associates them with roles.

### CRM

- **Companies**: Captures organization-level customer data and business profile details.
- **Customers**: Represents individual or corporate customers managed within the CRM.
- **Contacts**: Stores contact persons linked to companies.
- **Leads**: Tracks prospective customer opportunities and qualification status.

### Inventory

- **Categories**: Organizes products into logical groups for catalog management.
- **Products**: Represents goods or services offered through the sales process.
- **Inventory**: Tracks stock levels and warehouse location. Automatic stock decrement is not implemented yet.

### Sales

- **Orders**: Represents sales orders created by customers or sales representatives.
- **OrderItems**: Captures individual line items and pricing details within a sales order.
- **Invoices**: Represents billable documents issued for completed sales or services.
- **Payments**: Records payment transactions applied to invoices.

### Productivity

- **Tasks**: Manages actionable items, assignments, and progress tracking.
- **Events**: Represents scheduled meetings, appointments, and calendar activities.
- **Notifications**: Tracks system alerts and user notifications.

### System

- **Activities**: Captures audit-style records of user actions and important system events.
- **Files**: Stores metadata for documents and attachments associated with CRM entities.
- **Settings**: Stores application configuration values and system preferences.

## Conceptual Entity Relationships

The following conceptual relationships define how the main entities interact within CRM Full-Stack. These relationships are described at a high level and will guide the later ERD and physical schema design.

- One **Role** can have many **Users**.
- One **Company** can have many **Customers**.
- One **Company** can have many **Contacts**.
- One **Company** can have many **Leads**.
- One **Category** can contain many **Products**.
- One **Product** has one **Inventory** record.
- One **Customer** can create many **Orders**.
- One **Order** contains many **OrderItems**.
- One **Customer** can have many **Invoices**.
- One **Invoice** can have many **Payments**.
- One **User** can manage many **Tasks**.
- One **User** can receive many **Notifications**.
- One **User** can generate many **Activities**.

The physical ERD and MySQL schema are implemented in `server/src/database/schema.sql`.

## Detailed Entity Design - CRM Module

### Companies

The `companies` entity captures organization-level customer data and business profile details.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the company record.
- `name`
  - Data Type: VARCHAR(255)
  - Constraints: NOT NULL
  - Description: Legal or trade name of the company.
- `industry`
  - Data Type: VARCHAR(100)
  - Constraints: NULL
  - Description: Industry classification or business sector for the company.
- `email`
  - Data Type: VARCHAR(150)
  - Constraints: NULL
  - Description: Primary business email address for the company.
- `phone`
  - Data Type: VARCHAR(50)
  - Constraints: NULL
  - Description: Main contact phone number for the company.
- `website`
  - Data Type: VARCHAR(255)
  - Constraints: NULL
  - Description: Company website URL.
- `address`
  - Data Type: VARCHAR(255)
  - Constraints: NULL
  - Description: Primary street address for the company.
- `city`
  - Data Type: VARCHAR(100)
  - Constraints: NULL
  - Description: City where the company is located.
- `country`
  - Data Type: VARCHAR(100)
  - Constraints: NULL
  - Description: Country where the company is located.
- `created_by`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the user who created the company record.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the company record was created.
- `updated_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - Description: Timestamp when the company record was last updated.

### Customers

The `customers` entity represents individuals or organizations managed within CRM Full-Stack.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the customer record.
- `company_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the associated company.
- `assigned_to`
  - Data Type: INT
  - Constraints: NULL
  - Description: Reference to the user responsible for the customer.
- `first_name`
  - Data Type: VARCHAR(100)
  - Constraints: NOT NULL
  - Description: Customer’s first name.
- `last_name`
  - Data Type: VARCHAR(100)
  - Constraints: NOT NULL
  - Description: Customer’s last name.
- `email`
  - Data Type: VARCHAR(150)
  - Constraints: NULL
  - Description: Primary email address for the customer.
- `phone`
  - Data Type: VARCHAR(50)
  - Constraints: NULL
  - Description: Primary contact phone number for the customer.
- `status`
  - Data Type: VARCHAR(50)
  - Constraints: NULL
  - Description: Current customer status with enterprise values such as Active, Inactive, or Blocked.
- `address`
  - Data Type: VARCHAR(255)
  - Constraints: NULL
  - Description: Billing or mailing address for the customer.
- `notes`
  - Data Type: TEXT
  - Constraints: NULL
  - Description: Free-form notes related to the customer.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the customer record was created.
- `updated_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - Description: Timestamp when the customer record was last updated.

### CRM Module Relationships

- One **User** can create many **Companies**.
- One **Company** can have many **Customers**.
- One **User** can be assigned to many **Customers**.
- One **Customer** belongs to one **Company**.

## Detailed Entity Design - Contacts and Leads

### Contacts

The `contacts` entity stores individual contact persons associated with companies.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the contact record.
- `company_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the associated company.
- `first_name`
  - Data Type: VARCHAR(100)
  - Constraints: NOT NULL
  - Description: Contact person’s first name.
- `last_name`
  - Data Type: VARCHAR(100)
  - Constraints: NOT NULL
  - Description: Contact person’s last name.
- `email`
  - Data Type: VARCHAR(150)
  - Constraints: NULL
  - Description: Contact person’s email address.
- `phone`
  - Data Type: VARCHAR(50)
  - Constraints: NULL
  - Description: Contact person’s phone number.
- `position`
  - Data Type: VARCHAR(100)
  - Constraints: NULL
  - Description: Contact person’s job title or role within the company.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the contact record was created.
- `updated_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - Description: Timestamp when the contact record was last updated.

### Leads

The `leads` entity tracks prospective opportunities before they convert to customers.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the lead record.
- `company_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the associated company.
- `assigned_to`
  - Data Type: INT
  - Constraints: NULL
  - Description: Reference to the user responsible for managing the lead.
- `first_name`
  - Data Type: VARCHAR(100)
  - Constraints: NOT NULL
  - Description: Lead contact’s first name.
- `last_name`
  - Data Type: VARCHAR(100)
  - Constraints: NOT NULL
  - Description: Lead contact’s last name.
- `email`
  - Data Type: VARCHAR(150)
  - Constraints: NULL
  - Description: Lead contact’s email address.
- `phone`
  - Data Type: VARCHAR(50)
  - Constraints: NULL
  - Description: Lead contact’s phone number.
- `source`
  - Data Type: VARCHAR(100)
  - Constraints: NULL
  - Description: Origin of the lead, such as referral, campaign, or website.
- `status`
  - Data Type: VARCHAR(50)
  - Constraints: NOT NULL
  - Description: Lead qualification stage. Valid values include New, Contacted, Qualified, Proposal, Won, and Lost.
- `estimated_value`
  - Data Type: DECIMAL(12, 2)
  - Constraints: NULL
  - Description: Estimated monetary value of the opportunity.
- `notes`
  - Data Type: TEXT
  - Constraints: NULL
  - Description: Qualitative details and context for the lead.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the lead record was created.
- `updated_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - Description: Timestamp when the lead record was last updated.

### Contacts and Leads Relationships

- One **Company** can have many **Contacts**.
- One **Company** can have many **Leads**.
- One **User** can manage many **Leads**.

## Detailed Entity Design - Inventory Module

### Categories

The `categories` entity provides a simple product taxonomy for inventory classification.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the category.
- `name`
  - Data Type: VARCHAR(100)
  - Constraints: NOT NULL, UNIQUE
  - Description: Category name used for grouping products.
- `description`
  - Data Type: TEXT
  - Constraints: NULL
  - Description: Optional description of the category.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the category record was created.
- `updated_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - Description: Timestamp when the category record was last updated.

### Products

The `products` entity represents goods and services that can be sold or stocked.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the product.
- `category_id`
  - Data Type: INT
  - Constraints: NULL
  - Description: Reference to the product category.
- `name`
  - Data Type: VARCHAR(150)
  - Constraints: NOT NULL
  - Description: Product name displayed in the catalog and order screens.
- `sku`
  - Data Type: VARCHAR(50)
  - Constraints: NOT NULL, UNIQUE
  - Description: Stock keeping unit used for product identification.
- `description`
  - Data Type: TEXT
  - Constraints: NULL
  - Description: Product description or specifications.
- `purchase_price`
  - Data Type: DECIMAL(10, 2)
  - Constraints: NULL
  - Description: Cost price for purchasing the product.
- `selling_price`
  - Data Type: DECIMAL(10, 2)
  - Constraints: NULL
  - Description: Sale price for the product.
- `image`
  - Data Type: VARCHAR(255)
  - Constraints: NULL
  - Description: Optional product image URL or file path.
- `status`
  - Data Type: VARCHAR(50)
  - Constraints: NOT NULL
  - Description: Product lifecycle status, such as Active or Inactive.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the product record was created.
- `updated_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - Description: Timestamp when the product record was last updated.

### Inventory

The `inventory` entity tracks stock levels and warehouse location for a product. Automatic stock decrement on order creation or status change is not implemented yet.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the inventory record.
- `product_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the associated product.
- `quantity`
  - Data Type: INT
  - Constraints: NOT NULL, DEFAULT 0
  - Description: Current stock quantity available.
- `minimum_stock`
  - Data Type: INT
  - Constraints: NOT NULL, DEFAULT 0
  - Description: Minimum desired stock threshold for alerts.
- `warehouse`
  - Data Type: VARCHAR(100)
  - Constraints: NULL
  - Description: Optional warehouse location or storage area.
- `updated_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - Description: Timestamp when the inventory record was last updated.

### Inventory Relationships

- One **Category** can contain many **Products**.
- One **Product** has one **Inventory** record.

## Detailed Entity Design - Sales Module

### Orders

The `orders` entity represents sales orders created by customers and managed through the ordering workflow.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the order record.
- `customer_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the customer who placed the order.
- `created_by`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the user who created the order.
- `order_date`
  - Data Type: DATETIME
  - Constraints: NOT NULL
  - Description: Date and time when the order was created.
- `total_amount`
  - Data Type: DECIMAL(12, 2)
  - Constraints: NOT NULL
  - Description: Total monetary value of the order.
- `status`
  - Data Type: VARCHAR(50)
  - Constraints: NOT NULL
  - Description: Order lifecycle status. Valid values include Pending, Confirmed, Processing, Completed, and Cancelled.
- `notes`
  - Data Type: TEXT
  - Constraints: NULL
  - Description: Optional internal notes or comments for the order.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the order record was created.
- `updated_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - Description: Timestamp when the order record was last updated.

### Order_Items

The `order_items` entity captures product line items for each order.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the order item.
- `order_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the associated order.
- `product_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the product included in the order.
- `quantity`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Quantity of the product ordered.
- `unit_price`
  - Data Type: DECIMAL(10, 2)
  - Constraints: NOT NULL
  - Description: Unit price snapshot charged for the product at the time of the order. It is calculated by the backend from the product `selling_price`, not trusted from the frontend payload.
- `subtotal`
  - Data Type: DECIMAL(12, 2)
  - Constraints: NOT NULL
  - Description: Calculated line total for this item, typically quantity multiplied by unit price.

### Invoices

The `invoices` entity represents billing documents generated from orders.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the invoice.
- `order_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the order that generated this invoice.
- `invoice_number`
  - Data Type: VARCHAR(100)
  - Constraints: NOT NULL, UNIQUE
  - Description: Human-readable invoice identifier.
- `invoice_date`
  - Data Type: DATE
  - Constraints: NOT NULL
  - Description: Date when the invoice was issued.
- `due_date`
  - Data Type: DATE
  - Constraints: NOT NULL
  - Description: Payment due date for the invoice.
- `total_amount`
  - Data Type: DECIMAL(12, 2)
  - Constraints: NOT NULL
  - Description: Total amount due on the invoice.
- `payment_status`
  - Data Type: VARCHAR(50)
  - Constraints: NOT NULL
  - Description: Invoice payment state. Valid values include Unpaid, Partially Paid, and Paid.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the invoice record was created.
- `updated_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - Description: Timestamp when the invoice record was last updated.

### Payments

The `payments` entity records financial transactions applied to invoices.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the payment record.
- `invoice_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the invoice being paid.
- `amount`
  - Data Type: DECIMAL(12, 2)
  - Constraints: NOT NULL
  - Description: Payment amount applied to the invoice.
- `payment_method`
  - Data Type: VARCHAR(50)
  - Constraints: NOT NULL
  - Description: Payment method used. Valid values include Cash, Credit Card, and Bank Transfer.
- `payment_date`
  - Data Type: DATETIME
  - Constraints: NOT NULL
  - Description: Date and time when the payment was received.
- `reference`
  - Data Type: VARCHAR(150)
  - Constraints: NULL
  - Description: Optional payment reference or transaction identifier.
- `status`
  - Data Type: VARCHAR(50)
  - Constraints: NOT NULL
  - Description: Payment lifecycle status. Valid values include Pending, Completed, and Failed.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the payment record was created.

### Sales Relationships

- One **Customer** can have many **Orders**.
- One **Order** contains many **Order Items**.
- One **Product** can appear in many **Order Items**.
- One **Order** generates one **Invoice**.
- One **Invoice** can have many **Payments**.

## Detailed Entity Design - Productivity & System Module

### Tasks

The `tasks` entity tracks work items assigned to users and manages task lifecycle state.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the task.
- `assigned_to`
  - Data Type: INT
  - Constraints: NULL
  - Description: Reference to the user responsible for completing the task.
- `title`
  - Data Type: VARCHAR(255)
  - Constraints: NOT NULL
  - Description: Brief summary of the task.
- `description`
  - Data Type: TEXT
  - Constraints: NULL
  - Description: Detailed task description and requirements.
- `priority`
  - Data Type: VARCHAR(50)
  - Constraints: NOT NULL
  - Description: Task urgency level. Valid values include Low, Medium, and High.
- `status`
  - Data Type: VARCHAR(50)
  - Constraints: NOT NULL
  - Description: Current task state. Valid values include Pending, In Progress, and Completed.
- `due_date`
  - Data Type: DATE
  - Constraints: NULL
  - Description: Deadline for completing the task.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the task record was created.
- `updated_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - Description: Timestamp when the task record was last updated.

### Notifications

The `notifications` entity stores alerts and messages delivered to users.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the notification.
- `user_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the user who receives the notification.
- `title`
  - Data Type: VARCHAR(255)
  - Constraints: NOT NULL
  - Description: Notification title or subject.
- `message`
  - Data Type: TEXT
  - Constraints: NOT NULL
  - Description: Notification body or message content.
- `is_read`
  - Data Type: BOOLEAN
  - Constraints: NOT NULL, DEFAULT FALSE
  - Description: Indicates whether the notification has been read.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the notification was created.

### Activities

The `activities` entity records user actions and important system events for auditing.

- `id`
  - Data Type: INT
  - Constraints: Primary Key, AUTO_INCREMENT
  - Description: Unique identifier for the activity record.
- `user_id`
  - Data Type: INT
  - Constraints: NOT NULL
  - Description: Reference to the user who performed the action.
- `action`
  - Data Type: VARCHAR(150)
  - Constraints: NOT NULL
  - Description: Action name or event type that occurred.
- `entity_type`
  - Data Type: VARCHAR(100)
  - Constraints: NOT NULL
  - Description: Type of entity affected by the action, such as Order, Customer, or Invoice.
- `entity_id`
  - Data Type: INT
  - Constraints: NULL
  - Description: Identifier of the affected entity record.
- `description`
  - Data Type: TEXT
  - Constraints: NULL
  - Description: Additional details about the activity or event.
- `created_at`
  - Data Type: TIMESTAMP
  - Constraints: DEFAULT CURRENT_TIMESTAMP
  - Description: Timestamp when the activity record was created.

### Productivity & System Relationships

- One **User** can have many **Tasks**.
- One **User** can receive many **Notifications**.
- One **User** can generate many **Activities**.
- **Settings** represents a single system configuration record.

## Entity Relationship Model (ERD)

The entity relationship model is reflected by the MySQL schema, DBML model, and PlantUML physical data model included in this project.
