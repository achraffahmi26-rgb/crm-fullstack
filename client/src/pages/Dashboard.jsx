import {
  Activity,
  AlertCircle,
  Banknote,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Package,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../hooks/useAuth';

const chartColors = ['#ff5c35', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function formatMoney(value) {
  return `${formatNumber(value)} MAD`;
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatMonth(value) {
  if (!value) {
    return '-';
  }

  const [year, month] = String(value).split('-');
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(new Date(Number(year), Number(month) - 1));
}

function userIsAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

function statusClass(status) {
  const statusMap = {
    Active: 'bg-emerald-50 text-emerald-700',
    Cancelled: 'bg-red-50 text-red-700',
    Completed: 'bg-emerald-50 text-emerald-700',
    Confirmed: 'bg-sky-50 text-sky-700',
    Failed: 'bg-red-50 text-red-700',
    Lost: 'bg-red-50 text-red-700',
    New: 'bg-sky-50 text-sky-700',
    Paid: 'bg-emerald-50 text-emerald-700',
    Pending: 'bg-amber-50 text-amber-700',
    Processing: 'bg-indigo-50 text-indigo-700',
    Qualified: 'bg-emerald-50 text-emerald-700',
    Unpaid: 'bg-red-50 text-red-700',
    Won: 'bg-green-50 text-green-700',
  };

  return statusMap[status] || 'bg-slate-100 text-slate-600';
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
      <div className="h-4 w-28 animate-pulse rounded bg-crm-surface" />
      <div className="mt-4 h-8 w-24 animate-pulse rounded bg-crm-surface" />
      <div className="mt-4 h-3 w-36 animate-pulse rounded bg-crm-surface" />
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-full min-h-56 items-center justify-center rounded-md border border-dashed border-crm-line bg-crm-surface text-center">
      <div>
        <BarChart3 className="mx-auto text-crm-muted" size={28} />
        <p className="mt-3 text-sm font-semibold text-crm-ink">No chart data yet</p>
        <p className="mt-1 text-xs text-crm-muted">{message}</p>
      </div>
    </div>
  );
}

function KpiCard({ accent, description, icon: Icon, isMoney, label, value }) {
  return (
    <article className="crm-elevated rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-crm-muted">{label}</p>
          <p className="crm-count-pop mt-1.5 text-xl font-semibold text-crm-ink">
            {isMoney ? formatMoney(value) : formatNumber(value)}
          </p>
        </div>
        <div className={`rounded-md p-1.5 ${accent}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-2 text-xs text-crm-muted">{description}</p>
    </article>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const isAdminUser = userIsAdmin(user);
  const scopeLabel = isAdminUser ? '' : 'My ';
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [revenue, setRevenue] = useState([]);
  const [stats, setStats] = useState(null);

  async function loadDashboard() {
    setError('');
    setIsLoading(true);

    try {
      const [statsResponse, revenueResponse, activitiesResponse] = await Promise.all([
        axiosClient.get('/dashboard/stats'),
        axiosClient.get('/dashboard/revenue'),
        axiosClient.get('/dashboard/recent-activities'),
      ]);

      setStats(statsResponse.data.stats || {});
      setRevenue(revenueResponse.data.revenue || []);
      setActivities(activitiesResponse.data.activities || []);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load dashboard';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const kpis = useMemo(() => [
    {
      accent: 'bg-orange-50 text-crm-orange',
      description: 'Completed payment revenue',
      icon: Banknote,
      isMoney: true,
      label: `${scopeLabel}Revenue`,
      value: stats?.total_revenue,
    },
    {
      accent: 'bg-sky-50 text-sky-700',
      description: 'Sales orders in the system',
      icon: ShoppingCart,
      label: `${scopeLabel}Orders`,
      value: stats?.total_orders,
    },
    {
      accent: 'bg-emerald-50 text-emerald-700',
      description: 'Customer records managed',
      icon: Users,
      label: `${scopeLabel}Customers`,
      value: stats?.total_customers,
    },
    {
      accent: 'bg-indigo-50 text-indigo-700',
      description: 'Pipeline opportunities',
      icon: Target,
      label: `${scopeLabel}Leads`,
      value: stats?.total_leads,
    },
    {
      accent: 'bg-violet-50 text-violet-700',
      description: 'Catalog items available',
      icon: Package,
      label: 'Products',
      value: stats?.total_products,
    },
    {
      accent: 'bg-amber-50 text-amber-700',
      description: `${formatNumber(stats?.pending_tasks)} pending follow-ups`,
      icon: CheckCircle2,
      label: `${scopeLabel}Tasks`,
      value: stats?.total_tasks,
    },
    {
      accent: 'bg-green-50 text-green-700',
      description: 'Invoices marked as paid',
      icon: FileText,
      label: 'Paid invoices',
      value: stats?.total_paid_invoices,
    },
    {
      accent: 'bg-red-50 text-red-700',
      description: 'Invoices still unpaid',
      icon: AlertCircle,
      label: 'Unpaid invoices',
      value: stats?.total_unpaid_invoices,
    },
  ], [scopeLabel, stats]);

  const revenueData = useMemo(() => (
    revenue.map((item) => ({
      ...item,
      label: formatMonth(item.month),
    }))
  ), [revenue]);

  const operationsData = useMemo(() => [
    { name: 'Orders', value: Number(stats?.total_orders || 0) },
    { name: 'Invoices', value: Number(stats?.total_invoices || 0) },
    { name: 'Paid', value: Number(stats?.total_paid_invoices || 0) },
    { name: 'Unpaid', value: Number(stats?.total_unpaid_invoices || 0) },
  ], [stats]);

  const invoiceStatusData = useMemo(() => [
    { name: 'Paid', value: Number(stats?.total_paid_invoices || 0) },
    { name: 'Unpaid', value: Number(stats?.total_unpaid_invoices || 0) },
  ].filter((item) => item.value > 0), [stats]);

  const taskSummary = useMemo(() => [
    { label: 'Pending tasks', value: stats?.pending_tasks, icon: Clock3, color: 'text-amber-700 bg-amber-50' },
    { label: 'Completed tasks', value: stats?.completed_tasks, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
    { label: `${scopeLabel}active leads`, value: stats?.total_leads, icon: Target, color: 'text-indigo-700 bg-indigo-50' },
  ], [scopeLabel, stats]);

  if (isLoading) {
    return (
      <div className="crm-page-stack">
        <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <div className="h-4 w-28 animate-pulse rounded bg-orange-100" />
            <div className="mt-3 h-9 w-80 max-w-full animate-pulse rounded bg-crm-surface" />
            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-crm-surface" />
          </div>
          <div className="h-11 w-44 animate-pulse rounded-md bg-crm-surface" />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <SkeletonCard key={item} />)}
        </section>

        <section className="grid gap-3 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="h-96 animate-pulse rounded-lg border border-crm-line bg-white shadow-sm" />
          <div className="h-96 animate-pulse rounded-lg border border-crm-line bg-white shadow-sm" />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-100 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto text-red-500" size={32} />
        <h1 className="mt-4 text-xl font-semibold text-crm-ink">Dashboard could not load</h1>
        <p className="mt-2 text-[13px] text-crm-muted">{error}</p>
        <button
          className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-crm-orange px-3 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
          onClick={loadDashboard}
          type="button"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="crm-page-stack">
      <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Dashboard</p>
          <h1 className="mt-1 text-xl font-semibold text-crm-ink md:text-2xl">Enterprise CRM command center</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-crm-muted">
            Track revenue, sales activity, invoice health, and team execution from one operational workspace.
          </p>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-crm-line bg-white px-3 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
          onClick={loadDashboard}
          type="button"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-crm-ink">Monthly revenue</h2>
              <p className="mt-1 text-xs text-crm-muted">Completed payments grouped by month.</p>
            </div>
            <TrendingUp className="text-crm-orange" size={18} />
          </div>

          <div className="h-56">
            {revenueData.length === 0 ? (
              <EmptyChart message="Completed payments will appear here once revenue is recorded." />
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={revenueData} margin={{ bottom: 8, left: 0, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#ff5c35" stopOpacity={0.34} />
                      <stop offset="95%" stopColor="#ff5c35" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#edf2f7" vertical={false} />
                  <XAxis axisLine={false} dataKey="label" tickLine={false} />
                  <YAxis axisLine={false} tickFormatter={formatNumber} tickLine={false} width={72} />
                  <Tooltip formatter={(value) => formatMoney(value)} labelStyle={{ color: '#213343' }} />
                  <Area dataKey="revenue" fill="url(#revenueFill)" stroke="#ff5c35" strokeWidth={3} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-crm-ink">Invoice status</h2>
              <p className="mt-1 text-xs text-crm-muted">Paid versus unpaid invoice balance.</p>
            </div>
            <FileText className="text-crm-orange" size={18} />
          </div>

          <div className="h-56">
            {invoiceStatusData.length === 0 ? (
              <EmptyChart message="Invoice payment status appears after invoices are created." />
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="46%"
                    data={invoiceStatusData}
                    dataKey="value"
                    innerRadius={58}
                    nameKey="name"
                    outerRadius={96}
                    paddingAngle={4}
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-crm-ink">Orders overview</h2>
              <p className="mt-1 text-xs text-crm-muted">Sales order volume compared with invoice progress.</p>
            </div>
            <ShoppingCart className="text-crm-orange" size={18} />
          </div>

          <div className="h-56">
            {operationsData.every((item) => item.value === 0) ? (
              <EmptyChart message="Orders and invoices will appear here once sales activity starts." />
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={operationsData} margin={{ bottom: 8, left: 0, right: 10, top: 10 }}>
                  <CartesianGrid stroke="#edf2f7" vertical={false} />
                  <XAxis axisLine={false} dataKey="name" tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {operationsData.map((entry, index) => (
                      <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-crm-ink">Quick summary</h2>
              <p className="mt-1 text-xs text-crm-muted">Operational signals from dashboard stats.</p>
            </div>
            <Activity className="text-crm-orange" size={18} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {taskSummary.map((item) => {
              const Icon = item.icon;

              return (
                <div className="flex items-center justify-between gap-3 rounded-md bg-crm-surface px-3 py-2.5" key={item.label}>
                  <div className="flex items-center gap-2.5">
                    <div className={`rounded-md p-1.5 ${item.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-xs font-medium text-crm-muted">{item.label}</span>
                  </div>
                  <span className="text-base font-semibold text-crm-ink">{formatNumber(item.value)}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-crm-ink">Recent activities</h2>
            <p className="mt-1 text-xs text-crm-muted">Latest customer, sales, payment, lead, and task updates.</p>
          </div>
          <Activity className="text-crm-orange" size={18} />
        </div>

        {activities.length === 0 ? (
          <div className="rounded-md border border-dashed border-crm-line bg-crm-surface p-5 text-center">
            <Activity className="mx-auto text-crm-muted" size={28} />
            <p className="mt-3 text-sm font-semibold text-crm-ink">No recent activity</p>
            <p className="mt-1 text-xs text-crm-muted">New CRM actions will appear here as the team works.</p>
          </div>
        ) : (
          <div className="divide-y divide-crm-line">
            {activities.slice(0, 10).map((activity) => (
              <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between" key={`${activity.entity_type}-${activity.entity_id}-${activity.created_at}`}>
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-1 rounded-md bg-orange-50 p-2 text-crm-orange">
                    <Activity size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-crm-ink">{activity.title || `${activity.entity_type} #${activity.entity_id}`}</p>
                    <p className="mt-1 text-xs text-crm-muted">
                      {activity.entity_type} #{activity.entity_id} · {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
                <span className={`w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(activity.status)}`}>
                  {activity.status || 'Updated'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
