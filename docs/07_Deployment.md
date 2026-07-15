# CRM Full-Stack - Deployment

## Overview

CRM Full-Stack is deployed as a React + Vite frontend, a Node.js + Express API, and a MySQL database accessed through mysql2.

## Required Backend Environment

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=https://your-frontend-domain.example
CORS_ORIGIN=https://your-frontend-domain.example
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=crm_pro
DB_USER=crm_user
DB_PASSWORD=replace_with_database_password
DB_CONNECTION_LIMIT=10
```

`JWT_SECRET` is required. The backend intentionally has no insecure fallback secret. Use either `CLIENT_URL` or `CORS_ORIGIN` to restrict browser access to the deployed frontend origin.

## Frontend Environment

```env
VITE_API_URL=https://your-api-domain.example/api
```

If `VITE_API_URL` is not set, the frontend defaults to `http://localhost:5000/api`, which is useful only for local development.

## Database

Import `server/src/database/schema.sql` into MySQL. The optional demo seed is available at `server/src/database/seeds/demo_data.sql`; it is not imported automatically and expects demo users to be created from the Admin UI first.

## Current Limitations

Automatic stock decrement is not implemented. Inventory is managed through inventory endpoints until a clear reservation/decrement workflow is defined.
