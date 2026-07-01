import { Outlet } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';

function AuthLayout() {
  return (
    <main className="min-h-screen bg-crm-surface text-crm-ink">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-crm-line bg-white px-12 py-10 lg:flex lg:flex-col lg:justify-between">
          <BrandLogo className="h-11 w-11" textClassName="text-lg" />

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-crm-orange">Sales workspace</p>
            <h1 className="text-4xl font-semibold leading-tight text-crm-ink">
              A focused CRM dashboard for teams that move fast.
            </h1>
            <p className="mt-5 text-base leading-7 text-crm-muted">
              Track customers, leads, orders, invoices, payments, and team tasks from one clean interface.
            </p>
          </div>

          <p className="text-sm text-crm-muted">React, Node.js, Express, and MySQL CRM project</p>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-5 sm:py-10">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

export default AuthLayout;
