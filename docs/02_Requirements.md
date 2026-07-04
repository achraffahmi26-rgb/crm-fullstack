# CRM Pro - Software Requirements Specification

## 1. Introduction

### 1.1 Purpose
This document describes the current implemented requirements for CRM Pro, an internal Customer Relationship Management system for small and medium-sized businesses.

### 1.2 Scope
CRM Pro provides authenticated internal users with tools for managing companies, customers, leads, products, orders, invoices, payments, tasks, reports, notifications, dashboard analytics, and Admin-managed user accounts.

Public self-service account creation is not part of the current system. Customers are CRM records only and do not log in.

### 1.3 Definitions
- CRM: Customer Relationship Management.
- RBAC: Role-Based Access Control.
- User: An authenticated internal application user.
- Admin: An internal user with global CRM access and administrative permissions.
- Employee: An internal user with scoped CRM access.
- Customer: A CRM business record, not a login actor.
- Scope: Ownership and assignment rules applied to CRM data.

## 2. Current Functional Requirements

### 2.1 Authentication
- Users log in with email and password.
- Public registration is disabled.
- `/register` redirects to `/login`.
- `/api/auth/register` returns `403`.
- Inactive users cannot log in.
- Inactive users with existing tokens cannot continue accessing protected routes.
- JWT authentication protects CRM pages and API routes.

### 2.2 User Management
- User management is available to Admin users only.
- Admins can list users.
- Admins can create users.
- Admins can edit user profile fields, role, and active status.
- Admins can reset user passwords.
- Admins can activate and deactivate users.
- User deletion is disabled; deactivation is used instead.
- `/api/users` is Admin-only.
- `/api/users/assignees` returns active assignable users for authenticated CRM users.

### 2.3 Roles and Permissions
- The implemented roles are Admin and Employee.
- Admin inherits Employee CRM capabilities and adds administrative privileges.
- Admins can access global CRM data.
- Employees can access only their scoped CRM data.
- Employees cannot access the Users page.
- Restricted Admin routes show Access Denied for unauthorized users.

### 2.4 Dashboard and Reports
- Admin dashboard and reports show global CRM data.
- Employee dashboard and reports show "My" scoped data.
- Dashboard metrics include sales, invoices, leads, tasks, revenue, and recent CRM activity.
- Reports provide role-aware summaries and charts.

### 2.5 Companies
- Companies are CRM records.
- Companies are scoped by `created_by` for Employees.
- Admins can see and manage all companies.

### 2.6 Customers
- Customers are CRM records only, not login users.
- Customers are scoped by `created_by` or `assigned_to`.
- Admins can see and manage all customers.

### 2.7 Leads
- Leads are scoped by `created_by` or `assigned_to`.
- Admins can see and manage all leads.
- Leads support status, source, priority, notes, company association, and assignment.

### 2.8 Products
- Admins can create, edit, and delete products.
- Employees can view and select active products.
- Employees do not see product management actions.

### 2.9 Orders
- Orders are scoped by creator or by owned/assigned customer.
- Admins can see and manage all orders.
- Orders can include product line items and totals.

### 2.10 Invoices
- Invoices are scoped through issued orders and customers.
- Admins can see and manage all invoices.
- Invoices support preview, printing, PDF export, and payment status tracking.

### 2.11 Payments
- Payments are scoped through invoices, orders, and customers.
- Admins can see and manage all payments.
- Payments update invoice status according to completed payment totals.

### 2.12 Tasks
- Tasks are scoped by `created_by` or `assigned_to`.
- Admins can see and manage all tasks.
- Tasks support assignment, priority, due dates, and status.

### 2.13 Notifications
- Authenticated users can view notifications.
- Notification actions include unread counts, marking as read, and deletion.

## 3. Non-Functional Requirements

### 3.1 Security
- Passwords are stored using bcrypt hashes.
- Protected API routes require JWT Bearer tokens.
- Role and scope checks are enforced at middleware and service layers.
- Admin-only APIs must reject non-Admin users.

### 3.2 Usability
- The UI must be responsive on desktop, tablet, and mobile widths.
- Tables must support search, filters, sorting, pagination, loading states, empty states, and error states.
- Login must not expose passwords or present account creation options.

### 3.3 Maintainability
- Frontend is organized with React pages, layouts, reusable components, hooks, API clients, routes, and utilities.
- Backend uses Express routes, controllers, validations, services, middleware, utilities, and database modules.
- Business rules are centralized in backend services.

### 3.4 Compatibility
- The application targets current versions of Chrome, Edge, Firefox, and Safari.
- The backend exposes REST JSON APIs for the React frontend.

## 4. Architecture Constraints

- Frontend is built with React, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React, and React Hot Toast.
- Backend is built with Node.js, Express, JWT, bcrypt, and a service-layer architecture.
- Database engine is MySQL.
- Database access uses mysql2.
- The schema source is `server/src/database/schema.sql`.
- The backend uses the MySQL/mysql2 service-layer architecture documented in this project.

## 5. Current Integration Boundaries

The current implementation does not include:

- Public user self-registration.
- Customer-facing portal login.
- Gmail integration.
- SMS integration.
- WhatsApp integration.
- Automated email delivery for invoices or password reset.

## 6. Future Enhancements

Future enhancements may include:

- AI-powered internal CRM assistant.
- Native mobile applications.
- Multi-company and multi-tenant architecture.
- Online payment integrations.
- Advanced forecasting and predictive analytics.

These items are future perspectives only and are not implemented as current features.
