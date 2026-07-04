import {
  Activity,
  AlertCircle,
  BarChart3,
  Banknote,
  CheckCircle2,
  FileText,
  Package,
  RefreshCw,
  ShoppingCart,
  Target,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
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

function ReportCard({ icon: Icon, label, tone, value }) {
  return (
    <article className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-crm-muted">{label}</p>
          <p className="mt-1.5 text-xl font-semibold text-crm-ink">{value}</p>
        </div>
        <div className={`rounded-md p-1.5 ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
    </article>
  );
}

function Reports() {
  const { user } = useAuth();
  const scopeLabel = userIsAdmin(user) ? '' : 'My ';
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [revenue, setRevenue] = useState([]);
  const [stats, setStats] = useState(null);

  async function loadReports() {
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
      const message = requestError.response?.data?.message || 'Unable to load reports';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const revenueData = useMemo(() => (
    revenue.map((item) => ({ ...item, label: formatMonth(item.month) }))
  ), [revenue]);

  const salesData = useMemo(() => [
    { name: 'Orders', value: Number(stats?.total_orders || 0) },
    { name: 'Invoices', value: Number(stats?.total_invoices || 0) },
    { name: 'Paid', value: Number(stats?.total_paid_invoices || 0) },
    { name: 'Unpaid', value: Number(stats?.total_unpaid_invoices || 0) },
  ], [stats]);

  const crmData = useMemo(() => [
    { name: 'Customers', value: Number(stats?.total_customers || 0) },
    { name: 'Leads', value: Number(stats?.total_leads || 0) },
    { name: 'Products', value: Number(stats?.total_products || 0) },
    { name: 'Tasks', value: Number(stats?.total_tasks || 0) },
  ], [stats]);

  const invoiceStatusData = useMemo(() => [
    { name: 'Paid', value: Number(stats?.total_paid_invoices || 0) },
    { name: 'Unpaid', value: Number(stats?.total_unpaid_invoices || 0) },
  ].filter((item) => item.value > 0), [stats]);

  if (isLoading) {
    return (
      <div className="crm-page-stack">
        <div className="h-24 animate-pulse rounded-lg bg-white" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div className="h-28 animate-pulse rounded-lg bg-white" key={item} />)}
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          <div className="h-80 animate-pulse rounded-lg bg-white" />
          <div className="h-80 animate-pulse rounded-lg bg-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-100 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto text-red-500" size={32} />
        <h1 className="mt-4 text-xl font-semibold text-crm-ink">Reports could not load</h1>
        <p className="mt-2 text-[13px] text-crm-muted">{error}</p>
        <button
          className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-crm-orange px-3 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
          onClick={loadReports}
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
          <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Reports</p>
          <h1 className="mt-1 text-xl font-semibold text-crm-ink md:text-2xl">Business reports</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-crm-muted">
            Review sales, revenue, customers, products, invoice health, and recent CRM activity from existing dashboard data.
          </p>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-crm-line bg-white px-3 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
          onClick={loadReports}
          type="button"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard icon={Banknote} label={`${scopeLabel}Revenue report`} tone="bg-orange-50 text-crm-orange" value={formatMoney(stats?.total_revenue)} />
        <ReportCard icon={ShoppingCart} label={`${scopeLabel}Sales orders`} tone="bg-sky-50 text-sky-700" value={formatNumber(stats?.total_orders)} />
        <ReportCard icon={Users} label={`${scopeLabel}Customers`} tone="bg-emerald-50 text-emerald-700" value={formatNumber(stats?.total_customers)} />
        <ReportCard icon={Package} label="Products" tone="bg-violet-50 text-violet-700" value={formatNumber(stats?.total_products)} />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.3fr_0.9fr]">
        <article className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-crm-ink">Revenue report</h2>
              <p className="mt-1 text-xs text-crm-muted">Completed payment revenue grouped by month.</p>
            </div>
            <BarChart3 className="text-crm-orange" size={18} />
          </div>
          <div className="h-56">
            {revenueData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed border-crm-line bg-crm-surface text-[13px] text-crm-muted">
                Revenue data will appear after completed payments are recorded.
              </div>
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={revenueData} margin={{ left: 0, right: 10, top: 10 }}>
                  <CartesianGrid stroke="#edf2f7" vertical={false} />
                  <XAxis axisLine={false} dataKey="label" tickLine={false} />
                  <YAxis axisLine={false} tickFormatter={formatNumber} tickLine={false} width={72} />
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Bar dataKey="revenue" fill="#ff5c35" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-crm-ink">Invoice status</h2>
              <p className="mt-1 text-xs text-crm-muted">Paid and unpaid invoice split.</p>
            </div>
            <FileText className="text-crm-orange" size={18} />
          </div>
          <div className="h-56">
            {invoiceStatusData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed border-crm-line bg-crm-surface text-[13px] text-crm-muted">
                Invoice status data will appear after invoices are created.
              </div>
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie cx="50%" cy="45%" data={invoiceStatusData} dataKey="value" innerRadius={58} nameKey="name" outerRadius={96} paddingAngle={4}>
                    {invoiceStatusData.map((entry, index) => <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <article className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-crm-ink">Sales report</h2>
              <p className="mt-1 text-xs text-crm-muted">Orders and invoice progress.</p>
            </div>
            <ShoppingCart className="text-crm-orange" size={18} />
          </div>
          <div className="h-56">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={salesData} margin={{ left: 0, right: 10, top: 10 }}>
                <CartesianGrid stroke="#edf2f7" vertical={false} />
                <XAxis axisLine={false} dataKey="name" tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {salesData.map((entry, index) => <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-crm-ink">Customers and inventory report</h2>
              <p className="mt-1 text-xs text-crm-muted">Customers, leads, products, and team work volume.</p>
            </div>
            <Target className="text-crm-orange" size={18} />
          </div>
          <div className="h-56">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={crmData} margin={{ left: 0, right: 10, top: 10 }}>
                <CartesianGrid stroke="#edf2f7" vertical={false} />
                <XAxis axisLine={false} dataKey="name" tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {crmData.map((entry, index) => <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-crm-line bg-white p-3.5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-crm-ink">Recent report activity</h2>
            <p className="mt-1 text-xs text-crm-muted">Latest operational records included in dashboard activity.</p>
          </div>
          <Activity className="text-crm-orange" size={18} />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activities.slice(0, 6).map((activity) => (
            <div className="rounded-md border border-crm-line bg-crm-surface p-2.5" key={`${activity.entity_type}-${activity.entity_id}-${activity.created_at}`}>
              <p className="text-sm font-semibold text-crm-ink">{activity.title || `${activity.entity_type} #${activity.entity_id}`}</p>
              <p className="mt-1 text-xs text-crm-muted">{activity.entity_type} #{activity.entity_id}</p>
              <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-crm-muted">
                {activity.status || 'Updated'}
              </span>
            </div>
          ))}
          {activities.length === 0 ? (
            <div className="rounded-md border border-dashed border-crm-line bg-crm-surface p-4 text-center text-[13px] text-crm-muted md:col-span-2 xl:col-span-3">
              Recent CRM activity will appear here after records are created.
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <ReportCard icon={CheckCircle2} label={`${scopeLabel}Completed tasks`} tone="bg-emerald-50 text-emerald-700" value={formatNumber(stats?.completed_tasks)} />
        <ReportCard icon={AlertCircle} label={`${scopeLabel}Pending tasks`} tone="bg-amber-50 text-amber-700" value={formatNumber(stats?.pending_tasks)} />
        <ReportCard icon={Target} label={`${scopeLabel}Leads report`} tone="bg-indigo-50 text-indigo-700" value={formatNumber(stats?.total_leads)} />
      </section>
    </div>
  );
}

export default Reports;
