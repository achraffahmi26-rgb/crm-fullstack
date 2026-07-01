# CRM Pro – System Architecture

## 1. Architecture Overview

CRM Pro uses a layered architecture to enforce clear separation between presentation, business logic, and data access. Layered architecture was selected because it supports maintainability, testability, and scalable evolution of the system. Each layer has a dedicated responsibility, enabling teams to work independently on the frontend, backend services, and database logic while preserving a consistent integration contract.

Key advantages:
- Decouples user interface from business rules.
- Facilitates automated testing by isolating layers.
- Supports incremental delivery and future expansion.
- Simplifies auditing, monitoring, and compliance.

---

## 2. High-Level Architecture

The architecture is built around a web client communicating with a REST API server. The request pipeline includes authentication middleware, controller handlers, service orchestration, repository-based data access, and Prisma ORM integration with PostgreSQL.

### Architecture Flow

```text
React Client
    ↓
REST API
    ↓
Authentication Middleware
    ↓
Controllers
    ↓
Services
    ↓
Repositories
    ↓
Prisma ORM
    ↓
PostgreSQL
```

### Components
- React Client: the user interface and client-side state management.
- REST API: HTTP endpoints that expose business functionality.
- Authentication Middleware: validates incoming requests and attaches user context.
- Controllers: translate HTTP requests into application operations.
- Services: implement domain logic and coordinate repositories.
- Repositories: encapsulate data access patterns and query logic.
- Prisma ORM: maps typed models to PostgreSQL.
- PostgreSQL: the relational database for persistent storage.

---

## 3. Frontend Architecture

The frontend follows a structured React application layout designed for enterprise maintainability.

### Folder responsibilities

- `components`
  - Reusable UI building blocks such as forms, cards, tables, and modal dialogs.
  - Shared widgets used across multiple pages.
- `pages`
  - Route-level views representing major application screens.
  - Each page composes components and fetches data from services or stores.
- `layouts`
  - Page skeletons and wrappers that provide consistent navigation, headers, footers, and sidebars.
  - Shared layout logic for authenticated and public pages.
- `hooks`
  - Custom React hooks for reuse of stateful logic, data fetching, and domain-specific behavior.
  - Examples: `useAuth`, `useFetch`, `useFormValidation`.
- `services`
  - Business-oriented client services that encapsulate API interactions and request orchestration.
  - Map application use cases to low-level API calls.
- `api`
  - HTTP client configuration and endpoint definitions.
  - Axios or fetch wrappers, interceptors, and request/response handling.
- `store`
  - Global state management, such as Redux, Zustand, or Context API.
  - Stores authentication state, user profile, settings, and cached entities.
- `utils`
  - Utility functions, formatters, and shared helpers.
  - Non-UI-specific logic like date formatting, validation helpers, and constants.
- `routes`
  - Route definitions, protected route wrappers, and navigation metadata.
  - Declarative route configuration with access-control guards.
- `assets`
  - Static assets such as images, icons, fonts, and style resources.
  - Logo files and shared media used by the application.

---

## 4. Backend Architecture

The backend is organized around a domain-centric API with a clean folder structure that mirrors application responsibilities.

### Folder responsibilities

- `config`
  - Environment-specific configuration for database, authentication, email, and third-party integrations.
  - Centralized settings loader and validation logic.
- `routes`
  - Express route definitions and endpoint registration.
  - Groups routes by domain module (auth, users, customers, sales, reports, etc.).
- `middleware`
  - HTTP middleware for authentication, authorization, request validation, error handling, and logging.
  - Enforces cross-cutting concerns consistently across routes.
- `controllers`
  - Request handlers that map HTTP requests to service calls.
  - Responsible for request parsing, response formatting, and status codes.
- `services`
  - Application business logic and orchestration of repository interactions.
  - Contains use-case implementations for modules such as sales management, invoice processing, and reporting.
- `repositories`
  - Data access layer that interacts with Prisma ORM.
  - Encapsulates queries, filters, pagination, and transactional operations.
- `validators`
  - Request validation schemas and rules.
  - Ensures input data is correct before it reaches business logic.
- `prisma`
  - Prisma schema and client initialization.
  - Database migration artifacts and model definitions.
- `utils`
  - Shared helper functions, error factories, and utility modules.
  - Non-domain-specific logic reused across controllers and services.
- `types`
  - TypeScript interfaces, DTOs, and domain model definitions.
  - Shared type contracts for request/response shapes and service payloads.

---

## 5. Request Lifecycle

1. The browser sends an HTTP request from the React client to a REST API endpoint.
2. The API server receives the request and routes it through Express.
3. Authentication middleware inspects headers or cookies, validates tokens, and attaches user context.
4. Authorization middleware checks role permissions for the requested route.
5. Request validation ensures required request payloads and query parameters are valid.
6. The controller receives the validated request and delegates to a service layer.
7. The service executes business logic, interacts with repositories, and applies domain rules.
8. Repositories use Prisma ORM to perform SQL operations against PostgreSQL.
9. PostgreSQL executes the query and returns the result to Prisma.
10. The repository returns data to the service.
11. The service returns application output to the controller.
12. The controller serializes the response, applies formatting, and sends the HTTP response back to the client.
13. The React client receives the response, updates the UI state, and renders the result.

---

## 6. Authentication Flow

### Login
- User submits email and password through the login form.
- The frontend sends credentials to the `/auth/login` API endpoint.
- The backend verifies credentials against the user store and password hash.
- On success, the backend issues an access token and optionally a refresh token.

### JWT Access Token
- The access token carries user identity, role metadata, and expiration claims.
- The client includes the token in `Authorization: Bearer` headers for protected requests.
- Authentication middleware validates the token signature and expiration.

### Refresh Token
- A refresh token is stored securely and used to obtain new access tokens.
- The client calls `/auth/refresh` when the access token is near expiry.
- The backend validates the refresh token, rotates it if configured, and issues a new access token.

### Authorization
- Authorization logic evaluates user roles and permissions for each resource.
- Protected endpoints reject unauthorized users with `403 Forbidden`.
- Role-based rules are enforced at middleware and service levels.

### Protected Routes
- The frontend defines protected routes that require authentication.
- Route guards redirect unauthenticated users to the login page.
- Backend middleware protects API endpoints from unauthorized access.

### Role-Based Access Control (RBAC)
- Roles are modeled as permission sets assigned to users.
- Permissions determine allowed actions on modules such as `customers.read`, `orders.create`, or `settings.update`.
- RBAC ensures users only access features required by their responsibilities.

---

## 7. Design Principles

### Separation of Concerns
Each layer handles distinct responsibilities: UI rendering, request handling, business logic, and data access. This isolation reduces coupling and improves maintainability.

### SOLID Principles
- Single Responsibility: modules serve one purpose.
- Open/Closed: components are extendable without modification.
- Liskov Substitution: abstractions allow interchangeable implementations.
- Interface Segregation: services expose focused contracts.
- Dependency Inversion: higher-level modules depend on abstractions, not concrete implementations.

### DRY
Common logic is centralized in utilities, shared services, and base classes to avoid duplication and ease maintenance.

### KISS
The architecture is deliberately simple and practical, minimizing unnecessary complexity while preserving extensibility.

### Clean Code
The codebase emphasizes meaningful naming, modular design, and readable structure. Comments are used sparingly for clarification rather than to explain poorly written code.

### Modular Architecture
The application is organized into reusable modules for each domain area, enabling independent development, testing, and future replacement.

---

## 8. Error Handling

- Centralized error handling middleware captures exceptions from controllers and services.
- Business exceptions, validation errors, and infrastructure faults are normalized into structured API responses.
- Validation middleware returns detailed client-friendly error messages.
- Unexpected errors are logged and a generic error payload is returned to avoid exposing implementation details.
- Error classes encapsulate HTTP status codes, error identifiers, and user-facing messages.

---

## 9. Logging Strategy

### Application Logging
- Request logging captures incoming requests, response status, and timing.
- Error logging includes stack traces, user context, and correlation IDs.
- Audit-level logs store key state changes and administrative operations.

### Audit Logs
- Immutable audit records track create, update, delete, and authorization events.
- Audit entries include user identity, timestamp, affected entity, and change summary.
- Logs are persisted for compliance, troubleshooting, and security analysis.

---

## 10. Future Scalability

CRM Pro is architected to support future enterprise capabilities.

### AI Assistant
- A service-oriented architecture allows plug-in of AI microservices for recommendations, conversation, and insights.
- Frontend can consume AI endpoints through existing API service abstractions.

### Mobile App
- The RESTful API serves both web and mobile clients.
- Clear contract boundaries and authentication flows support mobile application integration.

### Multi-Tenant
- Layered architecture and centralized configuration make it feasible to add tenant isolation at the service and database layer.
- Multi-tenant support can be introduced via schema partitioning, row-level security, or dedicated databases.

### Microservices
- Modular backend design enables extraction of specific domains into separate services over time.
- Repositories and service abstractions allow migration to microservices without disrupting the client contract.
- Shared authentication and API gateway patterns can be adopted as the system evolves.
