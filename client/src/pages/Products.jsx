import { Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getCategories } from '../api/categoryApi';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../api/productApi';
import DataTableToolbar from '../components/common/DataTableToolbar';
import PaginationControls from '../components/common/PaginationControls';
import SortableHeader from '../components/common/SortableHeader';
import ProductFormModal from '../components/products/ProductFormModal';
import { useDataTable } from '../utils/tableUtils';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return `${new Intl.NumberFormat('en-US').format(Number(value))} MAD`;
}

function getProductName(product) {
  return product.name || 'Unnamed product';
}

function StatusBadge({ status }) {
  const colorMap = {
    Active: 'bg-emerald-50 text-emerald-700',
    Inactive: 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[status] || 'bg-slate-100 text-slate-600'}`}
    >
      {status || 'Unknown'}
    </span>
  );
}

function Products() {
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState([]);

  async function loadProducts() {
    setError('');
    setIsLoading(true);

    try {
      const data = await getProducts();
      setProducts(data);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load products';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to load categories');
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [Number(category.id), category])),
    [categories],
  );

  const getCategoryLabel = useCallback((categoryId) => {
    const category = categoryById.get(Number(categoryId));
    return category?.name || (categoryId ? `Category #${categoryId}` : '-');
  }, [categoryById]);

  const statusOptions = useMemo(() => (
    [...new Set(products.map((product) => product.status).filter(Boolean))]
      .sort()
      .map((status) => ({ label: status, value: status }))
  ), [products]);

  const categoryOptions = useMemo(() => (
    categories.map((category) => ({ label: category.name, value: String(category.id) }))
  ), [categories]);

  const table = useDataTable({
    data: products,
    filterDefinitions: [
      { key: 'status', getValue: (product) => product.status },
      { key: 'category', getValue: (product) => product.category_id },
    ],
    initialSort: { key: 'created_at', direction: 'desc' },
    searchFields: (product) => [
      product.name,
      product.sku,
      product.barcode,
      getCategoryLabel(product.category_id),
      product.purchase_price,
      formatMoney(product.purchase_price),
      product.selling_price,
      formatMoney(product.selling_price),
      product.status,
      formatDate(product.created_at),
    ],
    sortAccessors: {
      name: (product) => product.name,
      sku: (product) => product.sku,
      barcode: (product) => product.barcode,
      category: (product) => getCategoryLabel(product.category_id),
      purchase_price: (product) => product.purchase_price,
      selling_price: (product) => product.selling_price,
      status: (product) => product.status,
      created_at: (product) => product.created_at,
    },
  });

  function openAddModal() {
    setEditingProduct(null);
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingProduct(null);
  }

  async function handleSave(payload) {
    setIsSaving(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product created');
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save product';
      const fieldErrors = requestError.response?.data?.errors;

      if (fieldErrors) {
        toast.error(Object.values(fieldErrors).join(', '));
      } else {
        toast.error(message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(`Delete ${getProductName(product)}?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(product.id);

    try {
      await deleteProduct(product.id);
      toast.success('Product deleted');
      await loadProducts();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to delete product');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Products</p>
          <h1 className="mt-2 text-2xl font-semibold text-crm-ink md:text-3xl">Product catalog</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-crm-muted">
            Manage the sellable products used by orders, invoices, and stock workflows.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-crm-line bg-white px-4 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadProducts}
            type="button"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-crm-orange px-4 text-sm font-semibold text-white hover:bg-crm-orangeDark"
            onClick={openAddModal}
            type="button"
          >
            <Plus size={17} />
            Add Product
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-crm-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-orange-50 p-2 text-crm-orange">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-crm-ink">All products</h2>
              <p className="text-sm text-crm-muted">
                {table.filteredRows.length} of {products.length} records
              </p>
            </div>
          </div>

          <DataTableToolbar
            filterValues={table.filterValues}
            filters={[
              { key: 'status', label: 'All statuses', options: statusOptions },
              { key: 'category', label: 'All categories', options: categoryOptions },
            ]}
            onClear={table.clearFilters}
            onFilterChange={table.setFilterValue}
            onSearchChange={table.setSearchTerm}
            searchPlaceholder="Search name, SKU, barcode, category, status"
            searchTerm={table.searchTerm}
          />
        </div>

        {isLoading ? (
          <div className="p-8">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div className="h-12 animate-pulse rounded-md bg-crm-surface" key={item} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-crm-ink">Could not load products</p>
            <p className="mt-2 text-sm text-crm-muted">{error}</p>
            <button
              className="mt-4 rounded-md bg-crm-orange px-4 py-2 text-sm font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadProducts}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <Package size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-crm-ink">No products found</h3>
            <p className="mt-2 text-sm text-crm-muted">
              {products.length === 0 ? 'Add your first product to start building the catalog.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left">
              <thead className="bg-crm-surface text-xs uppercase tracking-wide text-crm-muted">
                <tr>
                  <SortableHeader columnKey="name" onSort={table.toggleSort} sortConfig={table.sortConfig}>Name</SortableHeader>
                  <SortableHeader columnKey="sku" onSort={table.toggleSort} sortConfig={table.sortConfig}>SKU</SortableHeader>
                  <SortableHeader columnKey="barcode" onSort={table.toggleSort} sortConfig={table.sortConfig}>Barcode</SortableHeader>
                  <SortableHeader columnKey="category" onSort={table.toggleSort} sortConfig={table.sortConfig}>Category</SortableHeader>
                  <SortableHeader columnKey="purchase_price" onSort={table.toggleSort} sortConfig={table.sortConfig}>Purchase Price</SortableHeader>
                  <SortableHeader columnKey="selling_price" onSort={table.toggleSort} sortConfig={table.sortConfig}>Selling Price</SortableHeader>
                  <SortableHeader columnKey="status" onSort={table.toggleSort} sortConfig={table.sortConfig}>Status</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created At</SortableHeader>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-line text-sm">
                {table.rows.map((product) => (
                  <tr className="bg-white hover:bg-crm-surface/70" key={product.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-crm-ink">{getProductName(product)}</p>
                      <p className="text-xs text-crm-muted">ID #{product.id}</p>
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{product.sku || '-'}</td>
                    <td className="px-4 py-4 text-crm-muted">{product.barcode || '-'}</td>
                    <td className="px-4 py-4 text-crm-muted">{getCategoryLabel(product.category_id)}</td>
                    <td className="px-4 py-4 text-crm-muted">{formatMoney(product.purchase_price)}</td>
                    <td className="px-4 py-4 text-crm-muted">{formatMoney(product.selling_price)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{formatDate(product.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Edit ${getProductName(product)}`}
                          className="rounded-md border border-crm-line p-2 text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(product)}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={`Delete ${getProductName(product)}`}
                          className="rounded-md border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isDeleting === product.id}
                          onClick={() => handleDelete(product)}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !error && table.filteredRows.length > 0 ? (
          <PaginationControls
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            page={table.page}
            pageSize={table.pageSize}
            startIndex={table.startIndex}
            totalPages={table.totalPages}
            totalRows={table.filteredRows.length}
          />
        ) : null}
      </section>

      <ProductFormModal
        categories={categories}
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={closeModal}
        onSubmit={handleSave}
        product={editingProduct}
      />
    </div>
  );
}

export default Products;
