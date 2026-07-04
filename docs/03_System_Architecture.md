# CRM Pro - System Architecture

## 1. Architecture Overview

CRM Pro uses a layered full-stack architecture with clear separation between the React frontend, Express API, authentication middleware, controllers, service-layer business logic, and MySQL access through mysql2.

The architecture is intentionally service-layer driven so role checks, ownership checks, and scoped CRM access rules are enforced on the backend rather than only in the UI.

## 2. High-Level Flow

```text
React + Vite Client
    -> Axios API Client
    -> Express REST API
    -> Authentication / Authorization Middleware
    -> Controllers
    -> Services
    -> MySQL via mysql2
```

## 3. Frontend Architecture

The frontend is a React application organized around route-level pages and shared layouts.

Main responsibilities:

- `pages`: Landing, Login, Dashboard, Companies, Customers, Leads, Products, Orders, Invoices, Payments, Tasks, Reports, Users, and Access Denied.
- `layouts`: public auth layout and authenticated dashboard layout.
- `components`: shared UI elements, tables, modals, forms, and module-specific components.
- `context` and `hooks`: authentication state and reusable React logic.
- `api`: Axios client and module API wrappers.
- `routes`: protected and Admin-only route guards.
- `utils`: formatting and export helpers.

Frontend guards improve user experience, but backend middleware and services remain the source of truth for access control.

## 4. Backend Architecture

The backend is a Node.js + Express application organized by domain modules.

Main responsibilities:

- `routes`: Express route modules for auth, users, companies, customers, contacts, leads, categories, products, inventory, orders, invoices, payments, tasks, dashboard, and notifications.
- `middleware`: JWT authentication, authorization checks, and error handling.
- `controllers`: request parsing, validation handoff, and response formatting.
- `validations`: request payload and parameter validation.
- `services`: business rules, role checks, scope checks, and mysql2 database operations.
- `database`: MySQL connection and `schema.sql`.
- `utils`: shared helpers such as token generation.

## 5. Authentication and Authorization

### Login
- Users submit email and password through the Login page.
- The frontend posts credentials to `/api/auth/login`.
- The backend verifies the bcrypt password hash and account status.
- Inactive users are rejected.
- On success, the backend issues a JWT.

### Disabled Public Registration
- Public registration is disabled.
- `/register` redirects to `/login` in the frontend.
- `/api/auth/register` returns `403` in the backend.
- Admins create users from the Users page instead.

### Protected Requests
- The frontend sends `Authorization: Bearer <token>` for protected API calls.
- Authentication middleware validates the token and loads current user context.
- Inactive users with old tokens are rejected.
- Authorization rules are enforced by middleware and service logic.

## 6. Access Control Model

### Roles
- Admin
- Employee

Admin inherits Employee capabilities and adds administrative privileges.

### Admin Capabilities
- See and manage all CRM data.
- Access `/api/users` and the Users page.
- List, create, edit, activate/deactivate, and reset passwords for users.
- Create, edit, and delete products.
- View global Dashboard and Reports data.

### Employee Capabilities
- Access scoped CRM data only.
- Cannot access the Users page or `/api/users`.
- Can view/select active products but cannot manage products.
- View Dashboard and Reports with "My" scoped data.

### Scoped Data Rules
- Companies: scoped by `created_by`.
- Customers and leads: scoped by `created_by` or `assigned_to`.
- Orders: scoped by creator or owned/assigned customer.
- Invoices and payments: scoped through issued orders and customers.
- Tasks: scoped by `created_by` or `assigned_to`.

## 7. Data Architecture

- Database: MySQL.
- Driver: mysql2.
- Schema source: `server/src/database/schema.sql`.
- Data access is implemented through services using SQL queries.
- Prisma and PostgreSQL are not used.

## 8. Request Lifecycle

1. The React client sends an HTTP request through the Axios API client.
2. Express receives the request and matches a route.
3. Authentication middleware validates JWT and user status.
4. Authorization checks validate role requirements where needed.
5. Controllers parse request data and delegate work to services.
6. Services apply business rules and scope rules.
7. Services execute SQL through mysql2.
8. Controllers return JSON responses to the frontend.
9. React updates the UI according to the response.

## 9. Current Integration Boundaries

The current system does not include Gmail, SMS, WhatsApp, or customer portal integrations. Customers are CRM records only and are not login actors.

## 10. Future Scalability

The layered architecture can support future capabilities such as mobile apps, multi-tenant data separation, online payment integrations, or AI-assisted analytics without changing the current access-control model.
