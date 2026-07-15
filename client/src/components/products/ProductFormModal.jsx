import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const STATUS_OPTIONS = ['Active', 'Inactive'];

const emptyForm = {
  category_id: '',
  name: '',
  sku: '',
  barcode: '',
  description: '',
  purchase_price: '0',
  selling_price: '0',
  image: '',
  status: 'Active',
};

function validateForm(form, categories) {
  const errors = {};
  const categoryIds = new Set(categories.map((category) => String(category.id)));

  if (!form.name.trim()) {
    errors.name = 'Product name is required';
  }
  if (!form.sku.trim()) {
    errors.sku = 'SKU is required';
  }
  if (form.category_id && !categoryIds.has(form.category_id)) {
    errors.category_id = 'Choose a valid category';
  }
  if (form.purchase_price !== '' && Number(form.purchase_price) < 0) {
    errors.purchase_price = 'Purchase price must be non-negative';
  }
  if (form.selling_price !== '' && Number(form.selling_price) < 0) {
    errors.selling_price = 'Selling price must be non-negative';
  }
  if (!STATUS_OPTIONS.includes(form.status)) {
    errors.status = 'Choose a valid status';
  }

  return errors;
}

function toPayload(form) {
  return {
    category_id: form.category_id ? Number(form.category_id) : null,
    name: form.name.trim(),
    sku: form.sku.trim(),
    barcode: form.barcode.trim() || null,
    description: form.description.trim() || null,
    purchase_price: form.purchase_price === '' ? 0 : Number(form.purchase_price),
    selling_price: form.selling_price === '' ? 0 : Number(form.selling_price),
    image: form.image.trim() || null,
    status: form.status,
  };
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

function ProductFormModal({ categories, isOpen, isSaving, onClose, onSubmit, product }) {
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(emptyForm);

  const title = product ? 'Edit product' : 'Add product';

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ label: category.name, value: String(category.id) })),
    [categories],
  );

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setErrors({});
      return;
    }

    if (product) {
      setForm({
        category_id: product.category_id ? String(product.category_id) : '',
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        description: product.description || '',
        purchase_price: product.purchase_price ?? '0',
        selling_price: product.selling_price ?? '0',
        image: product.image || '',
        status: product.status || 'Active',
      });
      setErrors({});
    }
  }, [isOpen, product]);

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
    const nextErrors = validateForm(form, categories);

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
            <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Product</p>
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
              <span className="mb-2 block text-sm font-medium text-crm-ink">Category</span>
              <select
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="category_id"
                onChange={handleChange}
                value={form.category_id}
              >
                <option value="">No category</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError>{errors.category_id}</FieldError>
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
              <span className="mb-2 block text-sm font-medium text-crm-ink">SKU</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="sku"
                onChange={handleChange}
                value={form.sku}
              />
              <FieldError>{errors.sku}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Barcode</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="barcode"
                onChange={handleChange}
                value={form.barcode}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Image URL</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="image"
                onChange={handleChange}
                value={form.image}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Purchase price</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                min="0"
                name="purchase_price"
                onChange={handleChange}
                step="0.01"
                type="number"
                value={form.purchase_price}
              />
              <FieldError>{errors.purchase_price}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Selling price</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                min="0"
                name="selling_price"
                onChange={handleChange}
                step="0.01"
                type="number"
                value={form.selling_price}
              />
              <FieldError>{errors.selling_price}</FieldError>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-crm-ink">Description</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-crm-line bg-white px-3 py-2 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
              name="description"
              onChange={handleChange}
              value={form.description}
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
              {isSaving ? 'Saving...' : product ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductFormModal;
