import { Eye, Lock, Mail } from 'lucide-react';
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
    <div className="w-full max-w-md rounded-lg border border-crm-line bg-white p-5 shadow-soft sm:p-6">
      <div className="mb-8">
        <div className="mb-5 lg:hidden">
          <BrandLogo className="h-12 w-12" showText={false} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Sign in</p>
        <h1 className="mt-2 text-2xl font-semibold text-crm-ink sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-crm-muted">
          Use your CRM account to continue to the dashboard.
        </p>
        <Link className="mt-3 inline-flex text-sm font-semibold text-crm-orange hover:underline" to="/">
          Back to CRM
        </Link>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-crm-ink">Email</span>
          <span className="flex items-center gap-2 rounded-md border border-crm-line bg-white px-3 focus-within:border-crm-orange focus-within:ring-2 focus-within:ring-orange-100">
            <Mail className="text-crm-muted" size={18} />
            <input
              autoComplete="email"
              className="h-11 w-full border-0 bg-transparent text-sm text-crm-ink outline-none placeholder:text-slate-400"
              name="email"
              onChange={handleChange}
              placeholder="you@example.com"
              type="email"
              value={form.email}
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-crm-ink">Password</span>
          <span className="flex items-center gap-2 rounded-md border border-crm-line bg-white px-3 focus-within:border-crm-orange focus-within:ring-2 focus-within:ring-orange-100">
            <Lock className="text-crm-muted" size={18} />
            <input
              autoComplete="current-password"
              className="h-11 w-full border-0 bg-transparent text-sm text-crm-ink outline-none placeholder:text-slate-400"
              name="password"
              onChange={handleChange}
              placeholder="••••••••"
              type="password"
              value={form.password}
            />
            <Eye className="text-crm-muted" size={18} />
          </span>
        </label>

        <button
          className="flex h-11 w-full items-center justify-center rounded-md bg-crm-orange px-4 text-sm font-semibold text-white transition hover:bg-crm-orangeDark disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-crm-muted">
        New to CRM?{' '}
        <Link className="font-semibold text-crm-orange hover:underline" to="/register">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default Login;
