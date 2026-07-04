import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function getLogoTarget(pathname, isAuthenticated) {
  if (isAuthenticated && pathname !== '/' && pathname !== '/login') {
    return '/dashboard';
  }

  if (pathname === '/') {
    return '/login';
  }

  return '/';
}

function BrandLogo({ className = 'h-10 w-10', showText = true, textClassName = '' }) {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const target = getLogoTarget(pathname, isAuthenticated);

  return (
    <Link
      aria-label="CRM Home"
      className="flex cursor-pointer items-center gap-3 transition-opacity duration-200 hover:opacity-80"
      to={target}
    >
      <img
        alt="CRM by Fahmi"
        className={`${className} object-contain`}
        src="/images/logo.png"
      />
      {showText ? (
        <div className={textClassName}>
          <p className="font-semibold text-crm-ink">CRM</p>
          <p className="text-xs text-crm-muted">by Fahmi</p>
        </div>
      ) : null}
    </Link>
  );
}

export default BrandLogo;
