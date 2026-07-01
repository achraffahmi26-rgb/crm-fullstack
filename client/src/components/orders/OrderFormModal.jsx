import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'];

const emptyCreateForm = {
  customer_id: '',
  order_date: '',
  status: 'Pending',
  notes: '',
  items: [{ product_id: '', quantity: '1', unit_price: '0' }],
};

const emptyEditForm = {
  status: 'Pending',
  notes: '',
};

function customerLabel(customer) {
  const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
  return name ? `${name}${customer.email ? ` (${customer.email})` : ''}` : `Customer #${customer.id}`;
}

function productLabel(product) {
  return product.sku ? `${product.name} (${product.sku})` : product.name;
}

function normalizeDateTime(value) {
  if (!value) {
    return '';
  }

  return value.replace('T', ' ');
}

function toDatetimeLocal(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 16);
}

function validateCreateForm(form, products) {
  const errors = {};
  const productIds = new Set(products.map((product) => String(product.id)));

  if (!form.customer_id) {
    errors.customer_id = 'Customer is required';
  }
  if (!form.order_date) {
    errors.order_date = 'Order date is required';
  }
  if (!STATUS_OPTIONS.includes(form.status)) {
    errors.status = 'Choose a valid status';
  }
  if (!form.items.length) {
    errors.items = 'At least one item is required';
  }

  form.items.forEach((item, index) => {
    if (!item.product_id) {
      errors[`item_${index}_product_id`] = 'Product is required';
    } else if (!productIds.has(item.product_id)) {
      errors[`item_${index}_product_id`] = 'Choose a valid product';
    }

    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      errors[`item_${index}_quantity`] = 'Quantity must be a positive integer';
    }

    if (item.unit_price === '' || Number(item.unit_price) < 0) {
      errors[`item_${index}_unit_price`] = 'Unit price must be non-negative';
    }
  });

  return errors;
}

function validateEditForm(form) {
  const errors = {};

  if (!STATUS_OPTIONS.includes(form.status)) {
    errors.status = 'Choose a valid status';
  }

  return errors;
}

function toCreatePayload(form) {
  return {
    customer_id: Number(form.customer_id),
    order_date: normalizeDateTime(form.order_date),
    status: form.status,
    notes: form.notes.trim() || null,
    items: form.items.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      unit_price: item.unit_price === '' ? 0 : Number(item.unit_price),
    })),
  };
}

function toEditPayload(form) {
  return {
    status: form.status,
    notes: form.notes.trim() || null,
  };
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

function OrderFormModal({ customers, isOpen, isSaving, onClose, onSubmit, order, products }) {
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [errors, setErrors] = useState({});

  const isEditMode = Boolean(order);
  const title = isEditMode ? 'Edit order' : 'Add order';

  const customerOptions = useMemo(
    () => customers.map((customer) => ({ label: customerLabel(customer), value: String(customer.id) })),
    [customers],
  );

  const productOptions = useMemo(
    () => products.map((product) => ({ label: productLabel(product), value: String(product.id), price: product.selling_price })),
    [products],
  );

  const previewTotal = useMemo(
    () =>
      createForm.items.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        return sum + quantity * unitPrice;
      }, 0),
    [createForm.items],
  );

  useEffect(() => {
    if (!isOpen) {
      setCreateForm(emptyCreateForm);
      setEditForm(emptyEditForm);
      setErrors({});
      return;
    }

    if (order) {
      setEditForm({
        status: order.status || 'Pending',
        notes: order.notes || '',
      });
      setErrors({});
      return;
    }

    setCreateForm(emptyCreateForm);
    setErrors({});
  }, [isOpen, order]);

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

  function updateItem(index, name, value) {
    setCreateForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [name]: value } : item)),
    }));
    setErrors((current) => ({ ...current, [`item_${index}_${name}`]: undefined }));
  }

  function handleProductChange(index, productId) {
    const product = products.find((item) => String(item.id) === productId);
    updateItem(index, 'product_id', productId);

    if (product && createForm.items[index]?.unit_price === '0') {
      updateItem(index, 'unit_price', String(product.selling_price ?? 0));
    }
  }

  function addItem() {
    setCreateForm((current) => ({
      ...current,
      items: [...current.items, { product_id: '', quantity: '1', unit_price: '0' }],
    }));
  }

  function removeItem(index) {
    setCreateForm((current) => ({
      ...current,
      items: current.items.filter((item, itemIndex) => itemIndex !== index),
    }));
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

    const nextErrors = validateCreateForm(createForm, products);
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
      <div className="flex max-h-screen w-full max-w-4xl flex-col rounded-t-lg border border-crm-line bg-white shadow-soft sm:max-h-[92vh] sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-crm-line px-5 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Order</p>
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
          {isEditMode ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-crm-ink">Status</span>
                <select
                  className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                  name="status"
                  onChange={(event) => updateEditField(event.target.name, event.target.value)}
                  value={editForm.status}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.status}</FieldError>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-crm-ink">Notes</span>
                <textarea
                  className="min-h-28 w-full rounded-md border border-crm-line bg-white px-3 py-2 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                  name="notes"
                  onChange={(event) => updateEditField(event.target.name, event.target.value)}
                  value={editForm.notes}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-crm-ink">Customer</span>
                  <select
                    className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                    name="customer_id"
                    onChange={(event) => updateCreateField(event.target.name, event.target.value)}
                    value={createForm.customer_id}
                  >
                    <option value="">Select customer</option>
                    {customerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.customer_id}</FieldError>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-crm-ink">Order Date</span>
                  <input
                    className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                    name="order_date"
                    onChange={(event) => updateCreateField(event.target.name, event.target.value)}
                    type="datetime-local"
                    value={toDatetimeLocal(createForm.order_date)}
                  />
                  <FieldError>{errors.order_date}</FieldError>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-crm-ink">Status</span>
                  <select
                    className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                    name="status"
                    onChange={(event) => updateCreateField(event.target.name, event.target.value)}
                    value={createForm.status}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.status}</FieldError>
                </label>
              </div>

              <section className="rounded-lg border border-crm-line">
                <div className="flex items-center justify-between border-b border-crm-line bg-crm-surface px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-crm-ink">Order items</h3>
                    <p className="text-xs text-crm-muted">Add at least one product line.</p>
                  </div>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-crm-line bg-white px-3 text-sm font-semibold text-crm-muted hover:text-crm-ink"
                    onClick={addItem}
                    type="button"
                  >
                    <Plus size={16} />
                    Add item
                  </button>
                </div>

                <div className="space-y-4 p-4">
                  {createForm.items.map((item, index) => (
                    <div className="grid gap-3 rounded-md border border-crm-line p-3 md:grid-cols-[1.5fr_0.7fr_0.8fr_auto]" key={index}>
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-crm-muted">Product</span>
                        <select
                          className="h-10 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                          onChange={(event) => handleProductChange(index, event.target.value)}
                          value={item.product_id}
                        >
                          <option value="">Select product</option>
                          {productOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <FieldError>{errors[`item_${index}_product_id`]}</FieldError>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-crm-muted">Quantity</span>
                        <input
                          className="h-10 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                          min="1"
                          onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                          step="1"
                          type="number"
                          value={item.quantity}
                        />
                        <FieldError>{errors[`item_${index}_quantity`]}</FieldError>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-crm-muted">Unit Price</span>
                        <input
                          className="h-10 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                          min="0"
                          onChange={(event) => updateItem(index, 'unit_price', event.target.value)}
                          step="0.01"
                          type="number"
                          value={item.unit_price}
                        />
                        <FieldError>{errors[`item_${index}_unit_price`]}</FieldError>
                      </label>

                      <div className="flex items-end justify-between gap-3 md:justify-end">
                        <p className="pb-2 text-sm font-semibold text-crm-ink">
                          {new Intl.NumberFormat('en-US').format((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))} MAD
                        </p>
                        <button
                          className="mb-0.5 rounded-md border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={createForm.items.length === 1}
                          onClick={() => removeItem(index)}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <FieldError>{errors.items}</FieldError>
                </div>
              </section>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-crm-ink">Notes</span>
                <textarea
                  className="min-h-24 w-full rounded-md border border-crm-line bg-white px-3 py-2 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                  name="notes"
                  onChange={(event) => updateCreateField(event.target.name, event.target.value)}
                  value={createForm.notes}
                />
              </label>

              <div className="rounded-md bg-orange-50 px-4 py-3 text-sm text-crm-ink">
                Preview total: <span className="font-semibold text-crm-orange">{new Intl.NumberFormat('en-US').format(previewTotal)} MAD</span>
              </div>
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
              {isSaving ? 'Saving...' : isEditMode ? 'Save changes' : 'Create order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrderFormModal;
