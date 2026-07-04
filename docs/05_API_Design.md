# CRM Pro - API Design

## Overview

CRM Pro exposes a REST JSON API from the Node.js + Express backend. Most routes are protected by JWT authentication middleware. Controllers delegate business behavior to service modules, and services apply role-based and ownership-based scope rules before querying MySQL through mysql2.

Base URL in local development:

```text
http://localhost:5000/api
```

## Authentication

- `POST /api/auth/login` - authenticate an active internal user and return a JWT plus user profile.
- `GET /api/auth/me` - return the current authenticated user.
- `POST /api/auth/register` - disabled public registration endpoint; returns `403`.

Frontend `/register` redirects to `/login`. There is no public Register/Create Account UI.

## Users

- `GET /api/users` - Admin-only user list.
- `POST /api/users` - Admin-only user creation.
- `PUT /api/users/:id` - Admin-only user update.
- `PATCH /api/users/:id/password` - Admin-only password reset.
- `GET /api/users/assignees` - active assignable users for authenticated CRM users.

User deletion is disabled. Admins activate/deactivate accounts instead. Inactive accounts cannot log in and inactive users with old tokens cannot access protected routes.

## CRM Modules

- `/api/companies` - scoped company CRUD. Companies are scoped by `created_by` for Employees.
- `/api/customers` - scoped customer CRUD. Customers are scoped by `created_by` or `assigned_to`.
- `/api/leads` - scoped lead CRUD. Leads are scoped by `created_by` or `assigned_to`.
- `/api/products` - product catalog. Admins can create/edit/delete products; Employees can view/select active products.
- `/api/orders` - scoped order CRUD. Orders are scoped by creator or owned/assigned customer.
- `/api/invoices` - scoped invoice CRUD. Invoices are scoped through issued orders and customers.
- `/api/payments` - scoped payment CRUD. Payments are scoped through invoices, orders, and customers.
- `/api/tasks` - scoped task CRUD. Tasks are scoped by `created_by` or `assigned_to`.
- `/api/dashboard` - scoped dashboard statistics, revenue, charts, and recent activities.
- `/api/notifications` - authenticated notification listing, unread count, mark-as-read, and delete actions.

## Additional Backend Modules

- `/api/contacts` - contact CRUD exposed by the backend.
- `/api/categories` - category CRUD exposed by the backend.
- `/api/inventory` - inventory CRUD exposed by the backend.
- `GET /api/health` - health check.

## Access Control Summary

- Admins see and manage global CRM data.
- Employees receive scoped data from services.
- `/api/users` is Admin-only.
- Product write operations are Admin-only.
- Customer records are CRM data only, not login users.
- No Gmail, SMS, WhatsApp, or customer portal API exists in the current application.
