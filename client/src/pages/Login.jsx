import { BarChart3, CheckCircle2, Eye, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(form);
      toast.success('Welcome back');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to login');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[390px] overflow-hidden rounded-lg border border-crm-line bg-white shadow-soft">
      <div className="border-b border-crm-line bg-crm-surface px-5 py-4">
        <div className="mb-4 lg:hidden">
          <BrandLogo className="h-9 w-9" textClassName="text-sm" />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Secure login</p>
            <h1 className="mt-1.5 text-2xl font-semibold text-crm-ink">Welcome back</h1>
            <p className="mt-1.5 text-[13px] leading-5 text-crm-muted">
              Sign in with your internal CRM account.
            </p>
          </div>
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-orange-50 text-crm-orange sm:flex">
            <ShieldCheck size={21} />
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">Email</span>
            <span className="flex h-10 items-center gap-2 rounded-md border border-crm-line bg-white px-3 focus-within:border-crm-orange focus-within:ring-2 focus-within:ring-orange-100">
              <Mail className="text-crm-muted" size={17} />
              <input
                autoComplete="email"
                className="h-full w-full border-0 bg-transparent text-[13px] text-crm-ink outline-none placeholder:text-slate-400"
                name="email"
                onChange={handleChange}
                placeholder="name@company.com"
                type="email"
                value={form.email}
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">Password</span>
            <span className="flex h-10 items-center gap-2 rounded-md border border-crm-line bg-white px-3 focus-within:border-crm-orange focus-within:ring-2 focus-within:ring-orange-100">
              <Lock className="text-crm-muted" size={17} />
              <input
                autoComplete="current-password"
                className="h-full w-full border-0 bg-transparent text-[13px] text-crm-ink outline-none placeholder:text-slate-400"
                name="password"
                onChange={handleChange}
                placeholder="Password"
                type="password"
                value={form.password}
              />
              <Eye className="text-crm-muted" size={17} />
            </span>
          </label>

          <button
            className="flex h-10 w-full items-center justify-center rounded-md bg-crm-orange px-3 text-sm font-semibold text-white transition hover:bg-crm-orangeDark disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 rounded-md border border-crm-line bg-crm-surface p-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-crm-ink">
            <BarChart3 className="text-crm-orange" size={16} />
            CRM access is managed by administrators
          </div>
          <p className="mt-1.5 text-xs leading-5 text-crm-muted">
            Users are created inside the admin workspace. Customer records are not login accounts.
          </p>
        </div>

        <Link className="mt-4 inline-flex text-[13px] font-semibold text-crm-orange hover:underline" to="/">
          Back to CRM
        </Link>

        <div className="mt-4 flex items-center gap-2 border-t border-crm-line pt-3 text-xs font-medium text-crm-muted">
          <CheckCircle2 className="text-crm-orange" size={15} />
          Protected internal workspace
        </div>
      </div>
    </div>
  );
}

export default Login;
