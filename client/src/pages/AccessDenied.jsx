import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

function AccessDenied() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <section className="w-full max-w-lg rounded-lg border border-crm-line bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-red-50 text-red-600">
          <ShieldAlert size={28} />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-crm-orange">Access denied</p>
        <h1 className="mt-2 text-2xl font-semibold text-crm-ink">Admin permission required</h1>
        <p className="mt-3 text-sm leading-6 text-crm-muted">
          This area is reserved for administrators. You can continue working from your dashboard.
        </p>
        <Link
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-crm-orange px-4 text-sm font-semibold text-white hover:bg-crm-orangeDark"
          to="/dashboard"
        >
          Back to Dashboard
        </Link>
      </section>
    </div>
  );
}

export default AccessDenied;