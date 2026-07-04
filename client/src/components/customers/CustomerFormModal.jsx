import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Blocked'];

const emptyForm = {
  company_id: '',
  assigned_to: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  status: 'Active',
  address: '',
  notes: '',
};

function userLabel(user) {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name ? `${name} (${user.email})` : user.email;
}

function validateForm(form) {
  const errors = {};

  if (!form.company_id) {
    errors.company_id = 'Company is required';
  }
  if (!form.first_name.trim()) {
    errors.first_name = 'First name is required';
  }
  if (!form.last_name.trim()) {
    errors.last_name = 'Last name is required';
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!STATUS_OPTIONS.includes(form.status)) {
    errors.status = 'Choose a valid status';
  }

  return errors;
}

function toPayload(form, canAssignUsers) {
  const payload = {
    company_id: Number(form.company_id),
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    status: form.status,
    address: form.address.trim() || null,
    notes: form.notes.trim() || null,
  };

  if (canAssignUsers) {
    payload.assigned_to = form.assigned_to ? Number(form.assigned_to) : undefined;
  }

  return payload;
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

function CustomerFormModal({ canAssignUsers = false, companies, customer, isOpen, isSaving, onClose, onSubmit, users }) {
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(emptyForm);

  const title = customer ? 'Edit customer' : 'Add customer';

  const companyOptions = useMemo(
    () => companies.map((company) => ({ label: company.name, value: String(company.id) })),
    [companies],
  );

  const userOptions = useMemo(
    () => users.map((user) => ({ label: userLabel(user), value: String(user.id) })),
    [users],
  );

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setErrors({});
      return;
    }

    if (customer) {
      setForm({
        company_id: customer.company_id ? String(customer.company_id) : '',
        assigned_to: customer.assigned_to ? String(customer.assigned_to) : '',
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        status: customer.status || 'Active',
        address: customer.address || '',
        notes: customer.notes || '',
      });
      setErrors({});
    }
  }, [customer, isOpen]);

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

    await onSubmit(toPayload(form, canAssignUsers));
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
            <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Customer</p>
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
              <span className="mb-2 block text-sm font-medium text-crm-ink">Company</span>
              <select
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="company_id"
                onChange={handleChange}
                value={form.company_id}
              >
                <option value="">Select company</option>
                {companyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError>{errors.company_id}</FieldError>
            </label>

            {canAssignUsers ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-crm-ink">Assigned To</span>
                <select
                  className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                  name="assigned_to"
                  onChange={handleChange}
                  value={form.assigned_to}
                >
                  <option value="">Use authenticated user</option>
                  {userOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">First Name</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="first_name"
                onChange={handleChange}
                value={form.first_name}
              />
              <FieldError>{errors.first_name}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Last Name</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="last_name"
                onChange={handleChange}
                value={form.last_name}
              />
              <FieldError>{errors.last_name}</FieldError>
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

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Status</span>
              <select
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="status"
                onChange={handleChange}
                value={form.status}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <FieldError>{errors.status}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Address</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="address"
                onChange={handleChange}
                value={form.address}
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-crm-ink">Notes</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-crm-line bg-white px-3 py-2 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
              name="notes"
              onChange={handleChange}
              value={form.notes}
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
              {isSaving ? 'Saving...' : customer ? 'Save changes' : 'Create customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerFormModal;
