import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Companies from './pages/Companies';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Landing from './pages/Landing';
import Leads from './pages/Leads';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Register from './pages/Register';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route element={<Landing />} path="/" />

        <Route element={<AuthLayout />}>
          <Route element={<Login />} path="/login" />
          <Route element={<Register />} path="/register" />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route element={<Dashboard />} path="/dashboard" />
            <Route element={<Customers />} path="/customers" />
            <Route element={<Companies />} path="/companies" />
            <Route element={<Leads />} path="/leads" />
            <Route element={<Products />} path="/products" />
            <Route element={<Orders />} path="/orders" />
            <Route element={<Invoices />} path="/invoices" />
            <Route element={<Payments />} path="/payments" />
            <Route element={<Tasks />} path="/tasks" />
            <Route element={<Reports />} path="/reports" />
          </Route>
        </Route>

        <Route element={<Navigate to="/" replace />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
