import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const PAYMENT_STATUS_OPTIONS = ['Unpaid', 'Partially Paid', 'Paid'];

const emptyCreateForm = {
  order_id: '',
  invoice_date: '',
  due_date: '',
};

const emptyEditForm = {
  due_date: '',
  payment_status: 'Unpaid',
};

function toDateInputValue(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
}

function orderLabel(order) {
  return `${order.order_number || `Order #${order.id}`} - ${new Intl.NumberFormat('en-US').format(Number(order.total_amount || 0))} MAD`;
}

function validateCreateForm(form, orders) {
  const errors = {};
  const orderIds = new Set(orders.map((order) => String(order.id)));

  if (!form.order_id) {
    errors.order_id = 'Order is required';
  } else if (!orderIds.has(form.order_id)) {
    errors.order_id = 'Choose a valid order';
  }

  if (!form.invoice_date) {
    errors.invoice_date = 'Invoice date is required';
  }

  if (!form.due_date) {
    errors.due_date = 'Due date is required';
  }

  return errors;
}

function validateEditForm(form) {
  const errors = {};

  if (!form.due_date) {
    errors.due_date = 'Due date is required';
  }

  if (!PAYMENT_STATUS_OPTIONS.includes(form.payment_status)) {
    errors.payment_status = 'Choose a valid payment status';
  }

  return errors;
}

function toCreatePayload(form) {
  return {
    order_id: Number(form.order_id),
    invoice_date: form.invoice_date,
    due_date: form.due_date,
  };
}

function toEditPayload(form) {
  return {
    due_date: form.due_date,
    payment_status: form.payment_status,
  };
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

function InvoiceFormModal({ invoice, isOpen, isSaving, onClose, onSubmit, orders }) {
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [errors, setErrors] = useState({});

  const isEditMode = Boolean(invoice);
  const title = isEditMode ? 'Edit invoice' : 'Add invoice';

  const orderOptions = useMemo(
    () => orders.map((order) => ({ label: orderLabel(order), value: String(order.id) })),
    [orders],
  );

  useEffect(() => {
    if (!isOpen) {
      setCreateForm(emptyCreateForm);
      setEditForm(emptyEditForm);
      setErrors({});
      return;
    }

    if (invoice) {
      setEditForm({
        due_date: toDateInputValue(invoice.due_date),
        payment_status: invoice.payment_status || 'Unpaid',
      });
      setErrors({});
      return;
    }

    setCreateForm(emptyCreateForm);
    setErrors({});
  }, [invoice, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateCreateField(name, value) {
    setCreateForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function updateEditField(name, value) {
    setEditForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isEditMode) {
      const nextErrors = validateEditForm(editForm);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      await onSubmit(toEditPayload(editForm));
      return;
    }

    const nextErrors = validateCreateForm(createForm, orders);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit(toCreatePayload(createForm));
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
      <div className="flex max-h-screen w-full max-w-2xl flex-col rounded-t-lg border border-crm-line bg-white shadow-soft sm:max-h-[92vh] sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-crm-line px-5 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Invoice</p>
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
          {isEditMode ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-crm-ink">Due Date</span>
                <input
                  className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                  name="due_date"
                  onChange={(event) => updateEditField(event.target.name, event.target.value)}
                  type="date"
                  value={editForm.due_date}
                />
                <FieldError>{errors.due_date}</FieldError>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-crm-ink">Payment Status</span>
                <select
                  className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                  name="payment_status"
                  onChange={(event) => updateEditField(event.target.name, event.target.value)}
                  value={editForm.payment_status}
                >
                  {PAYMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.payment_status}</FieldError>
              </label>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-crm-ink">Order</span>
                <select
                  className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                  name="order_id"
                  onChange={(event) => updateCreateField(event.target.name, event.target.value)}
                  value={createForm.order_id}
                >
                  <option value="">Select order</option>
                  {orderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.order_id}</FieldError>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-crm-ink">Invoice Date</span>
                <input
                  className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                  name="invoice_date"
                  onChange={(event) => updateCreateField(event.target.name, event.target.value)}
                  type="date"
                  value={createForm.invoice_date}
                />
                <FieldError>{errors.invoice_date}</FieldError>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-crm-ink">Due Date</span>
                <input
                  className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                  name="due_date"
                  onChange={(event) => updateCreateField(event.target.name, event.target.value)}
                  type="date"
                  value={createForm.due_date}
                />
                <FieldError>{errors.due_date}</FieldError>
              </label>
            </div>
          )}

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
              {isSaving ? 'Saving...' : isEditMode ? 'Save changes' : 'Create invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InvoiceFormModal;
