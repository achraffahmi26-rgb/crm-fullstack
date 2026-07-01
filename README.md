# CRM

CRM is a full-stack customer relationship management application built with React, Node.js, Express, and MySQL. It provides a professional workspace for managing customers, companies, leads, products, orders, invoices, payments, tasks, reports, notifications, and sales dashboard analytics.

## ✨ Features

- Authentication with JWT-based login and registration
- Protected dashboard and CRM routes
- Public landing page
- Companies management
- Customers management
- Contacts API module
- Leads management
- Categories API module
- Products management with categories
- Inventory API module
- Orders management with order items
- Invoices management
- PDF invoice export and invoice printing
- Payments management with invoice payment status updates
- Tasks management with assignment support
- Reports page using dashboard data
- Dashboard with KPI cards, charts, recent activity, and summaries
- Notifications center with unread count, mark as read, mark all as read, and delete actions
- Automatic notifications for key CRM events
- Global CRM search across main records
- Frontend pagination, sorting, filters, loading states, empty states, and error states
- Responsive HubSpot-inspired UI
- Sticky dashboard sidebar

## 🖼️ Screenshots

![Landing Page](screenshots/landing.png)
![Login](screenshots/login.png)
![Dashboard](screenshots/dashboard.png)
![Companies](screenshots/companies.png)
![Customers](screenshots/customers.png)
![Leads](screenshots/leads.png)
![Products](screenshots/products.png)
![Orders](screenshots/orders.png)
![Invoices](screenshots/invoices.png)
![Payments](screenshots/payments.png)
![Tasks](screenshots/tasks.png)
![Reports](screenshots/reports.png)

## 🧰 Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Lucide React
- React Hot Toast

Backend:

- Node.js
- Express.js
- MySQL
- JWT
- bcrypt
- mysql2

## 🗂️ Project Structure

```text
.
├── client/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/
├── screenshots/
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── database/
│   │   │   └── schema.sql
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validations/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

## ⚙️ Installation

### Backend

```bash
cd server
npm install
npm run dev
```

The backend runs from `server/src/server.js` and exposes the API under `/api`.

### Frontend

```bash
cd client
npm install
npm run dev
```

The frontend is a Vite React app.

### Database

1. Open phpMyAdmin.
2. Import the schema file:

```text
server/src/database/schema.sql
```

The schema creates the `crm_pro` database when imported unchanged.

3. Update the backend `.env` file with your MySQL connection values.

## 🔐 Environment Variables

The backend reads environment variables from `server/.env` through `dotenv`.

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=crm_pro
DB_USER=root
DB_PASSWORD=
DB_CONNECTION_LIMIT=10
```

Notes:

- `PORT` defaults to `5000` if not set.
- `JWT_SECRET` has a development fallback, but a real secret should be set locally.
- `DB_DATABASE` defaults to `crm_pro`, matching `server/src/database/schema.sql`.
- The frontend API client defaults to `http://localhost:5000/api`. Set `VITE_API_URL` in the frontend environment to override it.
- If MySQL is unavailable when the backend starts, the backend logs the connection target and retries until MySQL becomes available.

## 🔌 API Overview

Implemented API route groups:

- `GET /api/health`
- `/api/auth` - registration, login, current user
- `/api/users` - user CRUD
- `/api/companies` - company CRUD
- `/api/customers` - customer CRUD
- `/api/contacts` - contact CRUD
- `/api/leads` - lead CRUD
- `/api/categories` - category CRUD
- `/api/products` - product CRUD
- `/api/inventory` - inventory CRUD
- `/api/orders` - order CRUD
- `/api/invoices` - invoice CRUD
- `/api/payments` - payment CRUD
- `/api/tasks` - task CRUD
- `/api/notifications` - notifications, unread count, read actions, delete
- `/api/dashboard` - stats, revenue, recent activities

Most CRM routes are protected by the authentication middleware and require a Bearer token.

## 💻 Frontend Pages

- Landing page
- Login
- Register
- Dashboard
- Companies
- Customers
- Leads
- Products
- Orders
- Invoices
- Payments
- Tasks
- Reports

## 🎨 UI Features

- Responsive design for desktop, tablet, and mobile
- Sticky dashboard sidebar on desktop
- Global search in the dashboard topbar
- Notification center in the dashboard topbar
- KPI cards and charts with Recharts
- Data tables with pagination, sorting, filters, search, loading states, empty states, and error states
- Invoice PDF export
- Invoice printing
- Professional modal forms
- Accessible icon buttons and focus states

## 🧪 Development Checks

Frontend:

```bash
cd client
npm run lint
npm run build
```

Backend load check:

```bash
cd server
node -e "require('./src/app'); console.log('backend load ok')"
```

## 👤 Author

**Achraf Fahmi**

GitHub:  
https://github.com/achraffahmi26-rgb

LinkedIn:  
https://www.linkedin.com/in/achraf-fahmi-009781311/

## 📄 License

MIT
