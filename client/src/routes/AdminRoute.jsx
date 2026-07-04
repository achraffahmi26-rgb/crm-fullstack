import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function userIsAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

function AdminRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!userIsAdmin(user)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;