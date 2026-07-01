import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Lock,
  Receipt,
  ShoppingCart,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';

const features = [
  {
    description: 'Organize customers, companies, ownership, status, and relationship history in one focused workspace.',
    icon: Users,
    title: 'Customer Management',
  },
  {
    description: 'Track leads, convert sales activity into orders, and keep pipeline movement visible for the team.',
    icon: ShoppingCart,
    title: 'Sales & Orders',
  },
  {
    description: 'Create invoices, record payments, monitor payment status, and export professional invoice PDFs.',
    icon: Receipt,
    title: 'Invoices & Payments',
  },
  {
    description: 'Measure revenue, orders, leads, invoices, tasks, and recent activity through an enterprise dashboard.',
    icon: BarChart3,
    title: 'Dashboard Analytics',
  },
  {
    description: 'Assign work, follow priorities, and keep follow-ups clear across sales and operations teams.',
    icon: Target,
    title: 'Tasks & Productivity',
  },
  {
    description: 'JWT-based authentication keeps internal CRM pages protected behind secure login flows.',
    icon: Lock,
    title: 'Secure Authentication',
  },
];

const screenshotCards = [
  { label: 'Dashboard', path: 'screenshots/dashboard.png' },
  { label: 'Companies', path: 'screenshots/companies.png' },
  { label: 'Invoices', path: 'screenshots/invoices.png' },
];

function Landing() {
  return (
    <main className="min-h-screen bg-white text-crm-ink">
      <header className="sticky top-0 z-30 border-b border-crm-line bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandLogo className="h-10 w-10" />

          <div className="flex items-center gap-2">
            <Link
              className="hidden h-10 items-center justify-center rounded-md border border-crm-line bg-white px-4 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink sm:inline-flex"
              to="/login"
            >
              Login
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-crm-orange px-4 text-sm font-semibold text-white hover:bg-crm-orangeDark"
              to="/register"
            >
              Create Account
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-sm font-semibold text-crm-orange">
            <Sparkles size={16} />
            CRM for modern teams
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-crm-ink sm:text-5xl lg:text-6xl">
            Modern CRM for growing businesses
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-crm-muted sm:text-lg">
            Manage customers, sales, invoices, payments, tasks, and analytics from one professional CRM workspace built for small and medium businesses.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-crm-orange px-5 text-sm font-semibold text-white hover:bg-crm-orangeDark"
              to="/register"
            >
              Get Started
              <ArrowRight size={17} />
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-crm-line bg-white px-5 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
              to="/login"
            >
              Login
            </Link>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-crm-muted sm:grid-cols-3">
            {['JWT authentication', 'PDF invoice export', 'Enterprise data tables'].map((item) => (
              <div className="flex items-center gap-2" key={item}>
                <CheckCircle2 className="text-crm-orange" size={17} />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-lg border border-crm-line bg-white shadow-soft">
            <div className="border-b border-crm-line bg-crm-surface px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-300" />
                <span className="h-3 w-3 rounded-full bg-amber-300" />
                <span className="h-3 w-3 rounded-full bg-emerald-300" />
              </div>
            </div>
            <div className="p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-crm-line bg-orange-50 p-4">
                  <p className="text-sm font-medium text-crm-muted">Revenue</p>
                  <p className="mt-3 text-2xl font-semibold text-crm-orange">128,400 MAD</p>
                </div>
                <div className="rounded-md border border-crm-line bg-crm-surface p-4">
                  <p className="text-sm font-medium text-crm-muted">Orders</p>
                  <p className="mt-3 text-2xl font-semibold text-crm-ink">248</p>
                </div>
                <div className="rounded-md border border-crm-line bg-crm-surface p-4 sm:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-semibold">Monthly Revenue</p>
                    <BarChart3 className="text-crm-orange" size={18} />
                  </div>
                  <div className="flex h-36 items-end gap-3">
                    {[42, 64, 48, 78, 58, 92, 72].map((height, index) => (
                      <div className="flex flex-1 items-end rounded-t-md bg-orange-100" key={index} style={{ height: `${height}%` }}>
                        <div className="w-full rounded-t-md bg-crm-orange" style={{ height: '72%' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-crm-surface py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Features</p>
            <h2 className="mt-2 text-3xl font-semibold text-crm-ink">Everything needed to run a focused CRM operation</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="rounded-lg border border-crm-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft" key={feature.title}>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
                    <Icon size={21} />
                  </div>
                  <h3 className="text-lg font-semibold text-crm-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-crm-muted">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">About CRM</p>
          <h2 className="mt-2 text-3xl font-semibold text-crm-ink">Designed for small and medium businesses</h2>
          <p className="mt-4 text-sm leading-7 text-crm-muted">
            CRM gives growing teams a clean internal system for managing customer records, sales workflows, billing, payments, and follow-up tasks without switching between disconnected tools.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {screenshotCards.map((card) => (
            <div className="rounded-lg border border-crm-line bg-white p-4 shadow-sm" key={card.path}>
              <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-crm-surface text-center">
                <div>
                  <FileText className="mx-auto text-crm-orange" size={26} />
                  <p className="mt-2 text-sm font-semibold text-crm-ink">{card.label}</p>
                </div>
              </div>
              <p className="mt-3 break-all text-xs text-crm-muted">{card.path}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-crm-line bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Project Creator</p>
          <h2 className="mt-2 text-3xl font-semibold text-crm-ink">Built by Achraf Fahmi</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-crm-muted">
            Full-stack CRM project developed with React, Node.js, Express, and MySQL.
          </p>
        </div>
      </section>

      <footer className="bg-crm-ink px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold">CRM</p>
            <p className="mt-1 text-sm text-white/70">Developed by Achraf Fahmi</p>
          </div>
          <p className="text-sm text-white/70">React · Vite · Tailwind CSS · Node.js · Express · MySQL</p>
        </div>
      </footer>
    </main>
  );
}

export default Landing;
