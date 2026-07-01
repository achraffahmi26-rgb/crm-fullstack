import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const PAYMENT_METHOD_OPTIONS = ['Cash', 'Credit Card', 'Bank Transfer'];
const STATUS_OPTIONS = ['Pending', 'Completed', 'Failed'];

const emptyForm = {
  invoice_id: '',
  amount: '',
  payment_method: 'Cash',
  payment_date: '',
  reference: '',
  transaction_id: '',
  status: 'Pending',
};

function toDateInputValue(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
}

function invoiceLabel(invoice) {
  return `${invoice.invoice_number || `Invoice #${invoice.id}`} - ${new Intl.NumberFormat('en-US').format(Number(invoice.total_amount || 0))} MAD`;
}

function validateForm(form, invoices) {
  const errors = {};
  const invoiceIds = new Set(invoices.map((invoice) => String(invoice.id)));

  if (!form.invoice_id) {
    errors.invoice_id = 'Invoice is required';
  } else if (!invoiceIds.has(form.invoice_id)) {
    errors.invoice_id = 'Choose a valid invoice';
  }

  if (form.amount === '' || Number(form.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (!PAYMENT_METHOD_OPTIONS.includes(form.payment_method)) {
    errors.payment_method = 'Choose a valid payment method';
  }

  if (!form.payment_date) {
    errors.payment_date = 'Payment date is required';
  }

  if (!STATUS_OPTIONS.includes(form.status)) {
    errors.status = 'Choose a valid status';
  }

  return errors;
}

function toPayload(form) {
  return {
    invoice_id: Number(form.invoice_id),
    amount: Number(form.amount),
    payment_method: form.payment_method,
    payment_date: form.payment_date,
    reference: form.reference.trim() || null,
    transaction_id: form.transaction_id.trim() || null,
    status: form.status,
  };
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

function PaymentFormModal({ invoices, isOpen, isSaving, onClose, onSubmit, payment }) {
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(emptyForm);

  const isEditMode = Boolean(payment);
  const title = isEditMode ? 'Edit payment' : 'Add payment';

  const invoiceOptions = useMemo(
    () => invoices.map((invoice) => ({ label: invoiceLabel(invoice), value: String(invoice.id) })),
    [invoices],
  );

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setErrors({});
      return;
    }

    if (payment) {
      setForm({
        invoice_id: payment.invoice_id ? String(payment.invoice_id) : '',
        amount: payment.amount ?? '',
        payment_method: payment.payment_method || 'Cash',
        payment_date: toDateInputValue(payment.payment_date),
        reference: payment.reference || '',
        transaction_id: payment.transaction_id || '',
        status: payment.status || 'Pending',
      });
      setErrors({});
      return;
    }

    setForm(emptyForm);
    setErrors({});
  }, [isOpen, payment]);

  if (!isOpen) {
    return null;
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm(form, invoices);
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
            <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Payment</p>
            <h2 className="mt-1 text-xl font-semibold text-crm-ink">{title}</h2>
          </div>
          <button
            aria-label="Close modal"
            className="rounded-md p-2 text-crm-muted hover:bg-crm-surface disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form className="overflow-y-auto px-5 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Invoice</span>
              <select
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="invoice_id"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                value={form.invoice_id}
              >
                <option value="">Select invoice</option>
                {invoiceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError>{errors.invoice_id}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Amount</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                min="0.01"
                name="amount"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                step="0.01"
                type="number"
                value={form.amount}
              />
              <FieldError>{errors.amount}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Payment Method</span>
              <select
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="payment_method"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                value={form.payment_method}
              >
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <FieldError>{errors.payment_method}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Payment Date</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="payment_date"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                type="date"
                value={form.payment_date}
              />
              <FieldError>{errors.payment_date}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Status</span>
              <select
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="status"
                onChange={(event) => updateField(event.target.name, event.target.value)}
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
              <span className="mb-2 block text-sm font-medium text-crm-ink">Reference</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="reference"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                value={form.reference}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Transaction ID</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="transaction_id"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                value={form.transaction_id}
              />
            </label>
          </div>

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
              {isSaving ? 'Saving...' : isEditMode ? 'Save changes' : 'Create payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentFormModal;
