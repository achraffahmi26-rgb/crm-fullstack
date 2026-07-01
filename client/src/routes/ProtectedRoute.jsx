import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const hasSessionToken = Boolean(sessionStorage.getItem('crm_token'));

  if (!isAuthenticated || !hasSessionToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
