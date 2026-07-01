import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

const emptyForm = {
  name: '',
  industry: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  country: '',
};

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateForm(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Company name is required';
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (form.website && !isValidUrl(form.website)) {
    errors.website = 'Enter a valid URL including http:// or https://';
  }

  return errors;
}

function toPayload(form) {
  return {
    name: form.name.trim(),
    industry: form.industry.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    website: form.website.trim() || null,
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    country: form.country.trim() || null,
  };
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

function CompanyFormModal({ company, isOpen, isSaving, onClose, onSubmit }) {
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(emptyForm);

  const title = company ? 'Edit company' : 'Add company';

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setErrors({});
      return;
    }

    if (company) {
      setForm({
        name: company.name || '',
        industry: company.industry || '',
        email: company.email || '',
        phone: company.phone || '',
        website: company.website || '',
        address: company.address || '',
        city: company.city || '',
        country: company.country || '',
      });
      setErrors({});
    }
  }, [company, isOpen]);

  if (!isOpen) {
    return null;
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

    await onSubmit(toPayload(form));
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-crm-ink/40 p-0 sm:items-center sm:px-4 sm:py-6"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !isSaving) {
          onClose();
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div className="flex max-h-screen w-full max-w-3xl flex-col rounded-t-lg border border-crm-line bg-white shadow-soft sm:max-h-[92vh] sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-crm-line px-5 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Company</p>
            <h2 className="mt-1 text-xl font-semibold text-crm-ink">{title}</h2>
          </div>
          <button
            aria-label="Close modal"
            className="rounded-md p-2 text-crm-muted hover:bg-crm-surface"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form className="overflow-y-auto px-5 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Name</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="name"
                onChange={handleChange}
                value={form.name}
              />
              <FieldError>{errors.name}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Industry</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="industry"
                onChange={handleChange}
                value={form.industry}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Email</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="email"
                onChange={handleChange}
                type="email"
                value={form.email}
              />
              <FieldError>{errors.email}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Phone</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="phone"
                onChange={handleChange}
                value={form.phone}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Website</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="website"
                onChange={handleChange}
                placeholder="https://example.com"
                value={form.website}
              />
              <FieldError>{errors.website}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">City</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="city"
                onChange={handleChange}
                value={form.city}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Country</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="country"
                onChange={handleChange}
                value={form.country}
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-crm-ink">Address</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-crm-line bg-white px-3 py-2 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
              name="address"
              onChange={handleChange}
              value={form.address}
            />
          </label>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-crm-line pt-4 sm:flex-row sm:justify-end">
            <button
              className="h-10 rounded-md border border-crm-line bg-white px-4 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-10 rounded-md bg-crm-orange px-4 text-sm font-semibold text-white hover:bg-crm-orangeDark disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Saving...' : company ? 'Save changes' : 'Create company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyFormModal;
