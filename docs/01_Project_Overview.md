# CRM Pro - Project Overview

## Project Title
**CRM Pro - Customer Relationship Management System**

---

## Introduction
CRM Pro is a modern web-based Customer Relationship Management (CRM) system developed to help businesses manage companies, customers, products, sales, invoices, payments, tasks, reports, notifications, and internal user access from a centralized platform.

The current implementation is role-based and uses two roles from the code and schema: Admin and Employee. Public registration is disabled. Administrators create and manage user accounts from the Users module, while Employees access only scoped CRM records according to ownership and assignment rules.

Customers are CRM records only. They are not login users, and the current product does not include a customer-facing portal or external messaging integrations.

---

## Problem Statement
Many small and medium-sized businesses still rely on spreadsheets or manual processes to manage customer information, sales, billing, and daily operations. These methods are inefficient, error-prone, and make it difficult to monitor performance or enforce access control.

CRM Pro addresses these challenges by providing a centralized, secure, and scalable internal platform with clear Admin and Employee responsibilities.

---

## Project Objectives
The main objectives of CRM Pro are:

- Develop a modern and scalable internal CRM platform.
- Centralize business data in a single MySQL-backed system.
- Simplify customer, lead, sales, invoice, payment, and task management.
- Improve employee collaboration through scoped assignments.
- Generate role-aware dashboard and report analytics.
- Secure data through JWT authentication, role-based authorization, and service-layer scope rules.
- Provide an intuitive, responsive, and professional user interface.

---

## Target Users
The system is designed for:

- Company administrators
- Sales teams
- Operations teams
- Internal employees using scoped CRM records
- Small and medium-sized businesses

---

## Main Functionalities
The current system includes the following modules:

- Login and protected session management.
- Admin-only user management: list, create, edit, activate/deactivate, and reset passwords.
- Dashboard and reports with global Admin views or Employee "My" scoped views.
- Company, customer, and lead management with ownership and assignment scope.
- Product management with Admin-only create/edit/delete actions.
- Active product selection for Employees.
- Sales management with orders and invoices.
- Payment and task management.
- Reports and notifications.
- Invoice preview, printing, and PDF export.
- Access denied handling for restricted Admin routes.

---

## Access Model Summary

- `/register` redirects to `/login`.
- `/api/auth/register` returns `403`.
- No public account creation UI exists.
- `/api/users` is Admin-only.
- `/api/users/assignees` returns active assignable users.
- User deletion is disabled; deactivation is used instead.
- Inactive users cannot log in and cannot continue using protected routes with old tokens.
- Admins can see and manage all CRM data.
- Employees see only their scoped records.
- Companies are scoped by `created_by`.
- Customers and leads are scoped by `created_by` or `assigned_to`.
- Orders are scoped by creator or owned/assigned customer.
- Invoices and payments are scoped through issued orders and customers.
- Tasks are scoped by `created_by` or `assigned_to`.

---

## Expected Benefits
CRM Pro helps organizations:

- Improve productivity.
- Reduce manual work.
- Organize customer information.
- Track sales, invoices, payments, and tasks.
- Enforce clear access control.
- Improve decision-making using role-aware analytics.

---

## Development Approach
The project follows modern software engineering practices including modular React UI, RESTful API design, JWT authentication, Express controllers, service-layer business logic, MySQL access through mysql2, and responsive web design.

---

## Future Improvements
Future enhancements may include:

- AI assistant for internal CRM analysis.
- Native mobile application.
- Multi-company support.
- Multi-tenant architecture.
- Online payment integrations.

These items are not part of the current implementation.
