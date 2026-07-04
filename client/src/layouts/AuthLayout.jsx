import { BarChart3, LockKeyhole, ShieldCheck, Workflow } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';

const highlights = [
  { icon: ShieldCheck, label: 'Admin-managed accounts' },
  { icon: LockKeyhole, label: 'Scoped employee data' },
  { icon: Workflow, label: 'Orders, invoices, payments' },
];

function AuthLayout() {
  return (
    <main className="min-h-screen bg-crm-surface text-crm-ink">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="hidden border-r border-crm-line bg-white px-10 py-8 lg:flex lg:flex-col lg:justify-between xl:px-12">
          <BrandLogo className="h-9 w-9" textClassName="text-lg" />

          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-crm-orange">Internal CRM workspace</p>
            <h1 className="text-3xl font-semibold leading-tight text-crm-ink xl:text-4xl">
              Controlled access for sales, billing, tasks, and reporting.
            </h1>
            <p className="mt-4 text-sm leading-6 text-crm-muted">
              Sign in to manage customers, leads, active products, orders, invoices, payments, tasks, dashboards, and reports from one focused system.
            </p>

            <div className="mt-6 grid gap-3">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="flex items-center gap-3 rounded-lg border border-crm-line bg-crm-surface px-3 py-2.5" key={item.label}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
                      <Icon size={17} />
                    </span>
                    <span className="text-sm font-semibold text-crm-ink">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-crm-line bg-crm-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Reporting</p>
                <p className="mt-1 text-sm font-semibold text-crm-ink">Role-aware dashboard</p>
              </div>
              <BarChart3 className="text-crm-orange" size={19} />
            </div>
            <div className="flex h-20 items-end gap-2">
              {[54, 76, 62, 88, 70, 94].map((height, index) => (
                <div className="flex flex-1 items-end rounded-t-md bg-white" key={index} style={{ height: `${height}%` }}>
                  <div className="w-full rounded-t-md bg-crm-orange" style={{ height: '68%' }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-6 sm:px-5 sm:py-8">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

export default AuthLayout;
