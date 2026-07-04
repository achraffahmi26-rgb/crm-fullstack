import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  LockKeyhole,
  PackageCheck,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';

const featureCards = [
  {
    description: 'Customer and company records stay inside the CRM, separate from application user accounts.',
    icon: Users,
    title: 'CRM record management',
  },
  {
    description: 'Admins create users, manage access, and keep team workspaces under control from the Users page.',
    icon: ShieldCheck,
    title: 'Admin-managed users',
  },
  {
    description: 'Employees work from scoped views for their own customers, leads, tasks, dashboard, and reports.',
    icon: LockKeyhole,
    title: 'Scoped employee workspace',
  },
  {
    description: 'Admin-managed products flow into orders, invoices, payments, and operational follow-up.',
    icon: Workflow,
    title: 'Sales workflow',
  },
  {
    description: 'Invoice status, payment tracking, and task ownership are visible without disconnected tools.',
    icon: Receipt,
    title: 'Billing and tasks',
  },
  {
    description: 'Dashboards and reports show global admin insight or My scoped employee metrics.',
    icon: BarChart3,
    title: 'Role-aware analytics',
  },
];

const workflowSteps = [
  'Active products',
  'Sales orders',
  'Invoices',
  'Payments',
  'Tasks',
];

const stats = [
  { label: 'Open leads', value: '128' },
  { label: 'Paid invoices', value: '84%' },
  { label: 'Tasks due', value: '23' },
];

const bars = [48, 72, 56, 84, 68, 92, 76, 88];

function Landing() {
  return (
    <main className="min-h-screen bg-white text-crm-ink">
      <header className="sticky top-0 z-30 border-b border-crm-line bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <BrandLogo className="h-8 w-8" textClassName="text-sm" />
          <Link
            className="inline-flex h-9 items-center justify-center rounded-md bg-crm-orange px-3.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-crm-orangeDark"
            to="/login"
          >
            Login
          </Link>
        </nav>
      </header>

      <section className="border-b border-crm-line bg-crm-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.94fr_1.06fr] lg:px-8 xl:py-12">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-1 text-xs font-semibold text-crm-orange shadow-sm">
              <Sparkles size={15} />
              Internal CRM for controlled sales operations
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-crm-ink sm:text-4xl lg:text-[46px]">
              Run customers, sales, billing, and reporting from one focused CRM.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-crm-muted sm:text-[15px]">
              A professional internal workspace for admin-managed teams: customers and companies, leads, products, orders, invoices, payments, tasks, dashboards, and reports.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-crm-orange px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-crm-orangeDark"
                to="/login"
              >
                Open CRM
                <ArrowRight size={17} />
              </Link>
              <div className="flex items-center gap-2 text-[13px] font-medium text-crm-muted">
                <CheckCircle2 className="text-crm-orange" size={17} />
                Secure access for internal users only
              </div>
            </div>

            <div className="mt-7 grid max-w-xl gap-2.5 sm:grid-cols-3">
              {stats.map((item) => (
                <div className="rounded-lg border border-crm-line bg-white p-3 shadow-sm" key={item.label}>
                  <p className="text-xl font-semibold text-crm-ink">{item.value}</p>
                  <p className="mt-1 text-xs font-medium text-crm-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="w-full overflow-hidden rounded-lg border border-crm-line bg-white shadow-soft">
              <div className="flex items-center justify-between border-b border-crm-line bg-white px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Dashboard</p>
                  <p className="mt-1 text-sm font-semibold text-crm-ink">Admin command center</p>
                </div>
                <div className="rounded-md border border-crm-line bg-crm-surface px-2.5 py-1 text-xs font-semibold text-crm-muted">
                  Global view
                </div>
              </div>

              <div className="grid gap-3 p-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  {[
                    ['Revenue', '128,400 MAD', 'Paid and pending billing'],
                    ['Orders', '248', 'Product sales pipeline'],
                    ['Team tasks', '37', 'Assigned follow-ups'],
                  ].map(([label, value, note]) => (
                    <div className="rounded-md border border-crm-line bg-crm-surface p-3" key={label}>
                      <p className="text-xs font-medium text-crm-muted">{label}</p>
                      <p className="mt-1 text-xl font-semibold text-crm-ink">{value}</p>
                      <p className="mt-1 text-xs text-crm-muted">{note}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-md border border-crm-line bg-white p-3">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-crm-ink">Monthly revenue</p>
                      <p className="mt-1 text-xs text-crm-muted">Payments grouped by month</p>
                    </div>
                    <BarChart3 className="text-crm-orange" size={18} />
                  </div>
                  <div className="flex h-40 items-end gap-2">
                    {bars.map((height, index) => (
                      <div className="flex flex-1 items-end rounded-t-md bg-orange-50" key={index} style={{ height: `${height}%` }}>
                        <div className="w-full rounded-t-md bg-crm-orange" style={{ height: '72%' }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-crm-muted sm:grid-cols-2">
                    <div className="rounded-md bg-crm-surface px-3 py-2">Admin sees global CRM data</div>
                    <div className="rounded-md bg-crm-surface px-3 py-2">Employees see My scoped data</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">CRM capabilities</p>
            <h2 className="mt-2 text-2xl font-semibold text-crm-ink">Built around the way the current CRM works</h2>
            <p className="mt-2 text-sm leading-6 text-crm-muted">
              Internal user access, CRM records, and sales workflows stay in one protected system focused on team operations.
            </p>
          </div>
          <div className="rounded-lg border border-crm-line bg-crm-surface px-4 py-3 text-[13px] font-medium text-crm-muted">
            Admin creates users from /users
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <article className="rounded-lg border border-crm-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft" key={feature.title}>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-crm-ink">{feature.title}</h3>
                <p className="mt-1.5 text-[13px] leading-5 text-crm-muted">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-crm-line bg-crm-surface py-10">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Workflow</p>
            <h2 className="mt-2 text-2xl font-semibold text-crm-ink">Products, orders, invoices, payments, and tasks stay connected</h2>
            <p className="mt-3 text-sm leading-6 text-crm-muted">
              Admins manage the product catalog. Employees can view and select active products as part of the sales workflow, while financial and task records remain organized inside the CRM.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {workflowSteps.map((step, index) => (
              <div className="rounded-lg border border-crm-line bg-white p-3 shadow-sm" key={step}>
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-orange-50 text-sm font-semibold text-crm-orange">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold text-crm-ink">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <article className="rounded-lg border border-crm-line bg-white p-5 shadow-sm">
          <PackageCheck className="text-crm-orange" size={22} />
          <h3 className="mt-4 text-lg font-semibold text-crm-ink">Admin-only product management</h3>
          <p className="mt-2 text-sm leading-6 text-crm-muted">
            Product creation, editing, and deletion stay with administrators. Employees use the active catalog without management actions.
          </p>
        </article>
        <article className="rounded-lg border border-crm-line bg-white p-5 shadow-sm">
          <ClipboardList className="text-crm-orange" size={22} />
          <h3 className="mt-4 text-lg font-semibold text-crm-ink">Scoped work queues</h3>
          <p className="mt-2 text-sm leading-6 text-crm-muted">
            Employee dashboards, reports, customers, leads, and tasks stay aligned with assigned ownership and scoped records.
          </p>
        </article>
        <article className="rounded-lg border border-crm-line bg-white p-5 shadow-sm">
          <FileText className="text-crm-orange" size={22} />
          <h3 className="mt-4 text-lg font-semibold text-crm-ink">Operational reporting</h3>
          <p className="mt-2 text-sm leading-6 text-crm-muted">
            Dashboard and reports pages summarize CRM activity with role-aware labels for admin global data and employee My views.
          </p>
        </article>
      </section>

      <footer className="border-t border-crm-line bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-crm-muted md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-crm-ink">CRM by Fahmi</p>
          <p>Internal CRM built with React, Vite, Tailwind CSS, Node.js, Express, and MySQL.</p>
        </div>
      </footer>
    </main>
  );
}

export default Landing;
