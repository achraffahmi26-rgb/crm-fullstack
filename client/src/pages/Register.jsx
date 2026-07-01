import { Lock, Mail, Phone, User } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';
import { useAuth } from '../hooks/useAuth';

const initialForm = {
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  phone: '',
};

function validateForm(form) {
  const errors = {};

  if (!form.first_name.trim()) {
    errors.first_name = 'First name is required';
  }

  if (!form.last_name.trim()) {
    errors.last_name = 'Last name is required';
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

function Register() {
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        ...form,
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        role_id: 1,
      });
      toast.success('Account created');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const fieldErrors = error.response?.data?.errors;

      if (fieldErrors) {
        setErrors(fieldErrors);
        toast.error(Object.values(fieldErrors).join(', '));
      } else {
        toast.error(error.response?.data?.message || 'Unable to create account');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-lg border border-crm-line bg-white p-5 shadow-soft sm:p-6">
      <div className="mb-8">
        <div className="mb-5 lg:hidden">
          <BrandLogo className="h-12 w-12" showText={false} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Create account</p>
        <h1 className="mt-2 text-2xl font-semibold text-crm-ink sm:text-3xl">Start using CRM</h1>
        <p className="mt-2 text-sm leading-6 text-crm-muted">
          Create your account and continue to the protected CRM dashboard.
        </p>
        <Link className="mt-3 inline-flex text-sm font-semibold text-crm-orange hover:underline" to="/">
          Back to CRM
        </Link>
      </div>

      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-crm-ink">First name</span>
          <span className="flex items-center gap-2 rounded-md border border-crm-line bg-white px-3 focus-within:border-crm-orange focus-within:ring-2 focus-within:ring-orange-100">
            <User className="text-crm-muted" size={18} />
            <input
              autoComplete="given-name"
              className="h-11 w-full border-0 bg-transparent text-sm text-crm-ink outline-none placeholder:text-slate-400"
              name="first_name"
              onChange={handleChange}
              placeholder="Achraf"
              type="text"
              value={form.first_name}
            />
          </span>
          <FieldError>{errors.first_name}</FieldError>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-crm-ink">Last name</span>
          <span className="flex items-center gap-2 rounded-md border border-crm-line bg-white px-3 focus-within:border-crm-orange focus-within:ring-2 focus-within:ring-orange-100">
            <User className="text-crm-muted" size={18} />
            <input
              autoComplete="family-name"
              className="h-11 w-full border-0 bg-transparent text-sm text-crm-ink outline-none placeholder:text-slate-400"
              name="last_name"
              onChange={handleChange}
              placeholder="Fahmi"
              type="text"
              value={form.last_name}
            />
          </span>
          <FieldError>{errors.last_name}</FieldError>
        </label>

        <label className="block sm:col-span-2">
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
          <FieldError>{errors.email}</FieldError>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-crm-ink">Password</span>
          <span className="flex items-center gap-2 rounded-md border border-crm-line bg-white px-3 focus-within:border-crm-orange focus-within:ring-2 focus-within:ring-orange-100">
            <Lock className="text-crm-muted" size={18} />
            <input
              autoComplete="new-password"
              className="h-11 w-full border-0 bg-transparent text-sm text-crm-ink outline-none placeholder:text-slate-400"
              name="password"
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              type="password"
              value={form.password}
            />
          </span>
          <FieldError>{errors.password}</FieldError>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-crm-ink">Phone</span>
          <span className="flex items-center gap-2 rounded-md border border-crm-line bg-white px-3 focus-within:border-crm-orange focus-within:ring-2 focus-within:ring-orange-100">
            <Phone className="text-crm-muted" size={18} />
            <input
              autoComplete="tel"
              className="h-11 w-full border-0 bg-transparent text-sm text-crm-ink outline-none placeholder:text-slate-400"
              name="phone"
              onChange={handleChange}
              placeholder="+212 600 000 000"
              type="tel"
              value={form.phone}
            />
          </span>
        </label>

        <button
          className="flex h-11 w-full items-center justify-center rounded-md bg-crm-orange px-4 text-sm font-semibold text-white transition hover:bg-crm-orangeDark disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-crm-muted">
        Already have an account?{' '}
        <Link className="font-semibold text-crm-orange hover:underline" to="/login">
          Login
        </Link>
      </p>
    </div>
  );
}

export default Register;
