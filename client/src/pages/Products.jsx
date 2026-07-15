import { Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getCategories } from '../api/categoryApi';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../api/productApi';
import DataTableToolbar from '../components/common/DataTableToolbar';
import PaginationControls from '../components/common/PaginationControls';
import SortableHeader from '../components/common/SortableHeader';
import ProductFormModal from '../components/products/ProductFormModal';
import { useAuth } from '../hooks/useAuth';
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

function userIsAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
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
  const { user } = useAuth();
  const canManageProducts = userIsAdmin(user);
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
    if (!canManageProducts) {
      return;
    }

    setEditingProduct(null);
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    if (!canManageProducts) {
      return;
    }

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
    if (!canManageProducts) {
      return;
    }

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
    if (!canManageProducts) {
      return;
    }

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
    <div className="crm-page-stack">
      <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Products</p>
          <h1 className="mt-1 text-xl font-semibold text-crm-ink md:text-2xl">Product catalog</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-crm-muted">
            Manage the sellable products used by orders, invoices, and stock workflows.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-crm-line bg-white px-3 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadProducts}
            type="button"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          {canManageProducts ? (
            <button
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-crm-orange px-3 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
              onClick={openAddModal}
              type="button"
            >
              <Plus size={15} />
              Add product
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-crm-line px-3.5 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-orange-50 p-1.5 text-crm-orange">
              <Package size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-crm-ink">All products</h2>
              <p className="text-[13px] text-crm-muted">
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
          <div className="crm-table-loading">
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((item) => (
                <div className="crm-skeleton-row" key={item} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="crm-table-error">
            <p className="text-sm font-semibold text-crm-ink">Could not load products</p>
            <p className="mt-1.5 text-[13px] text-crm-muted">{error}</p>
            <button
              className="mt-3 rounded-md bg-crm-orange px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadProducts}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="crm-table-empty">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <Package size={20} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-crm-ink">No products found</h3>
            <p className="mt-1.5 text-[13px] text-crm-muted">
              {products.length === 0 ? 'Add your first product to start building the catalog.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="crm-table-shell">
            <table className="crm-table min-w-[1120px] w-full text-left">
              <thead>
                <tr>
                  <SortableHeader columnKey="name" onSort={table.toggleSort} sortConfig={table.sortConfig}>Name</SortableHeader>
                  <SortableHeader columnKey="sku" onSort={table.toggleSort} sortConfig={table.sortConfig}>SKU</SortableHeader>
                  <SortableHeader columnKey="barcode" onSort={table.toggleSort} sortConfig={table.sortConfig}>Barcode</SortableHeader>
                  <SortableHeader columnKey="category" onSort={table.toggleSort} sortConfig={table.sortConfig}>Category</SortableHeader>
                  <SortableHeader columnKey="purchase_price" onSort={table.toggleSort} sortConfig={table.sortConfig}>Purchase price</SortableHeader>
                  <SortableHeader columnKey="selling_price" onSort={table.toggleSort} sortConfig={table.sortConfig}>Selling price</SortableHeader>
                  <SortableHeader columnKey="status" onSort={table.toggleSort} sortConfig={table.sortConfig}>Status</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created at</SortableHeader>
                  {canManageProducts ? <th className="text-right font-semibold">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <p className="font-semibold text-crm-ink">{getProductName(product)}</p>
                      <p className="text-xs text-crm-muted">ID #{product.id}</p>
                    </td>
                    <td className="text-crm-muted">{product.sku || '-'}</td>
                    <td className="text-crm-muted">{product.barcode || '-'}</td>
                    <td className="text-crm-muted">{getCategoryLabel(product.category_id)}</td>
                    <td className="text-crm-muted">{formatMoney(product.purchase_price)}</td>
                    <td className="text-crm-muted">{formatMoney(product.selling_price)}</td>
                    <td>
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="text-crm-muted">{formatDate(product.created_at)}</td>
                    {canManageProducts ? (
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            aria-label={`Edit ${getProductName(product)}`}
                            className="rounded-md border border-crm-line p-1 text-crm-muted hover:bg-white hover:text-crm-ink"
                            onClick={() => openEditModal(product)}
                            type="button"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            aria-label={`Delete ${getProductName(product)}`}
                            className="rounded-md border border-red-100 p-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isDeleting === product.id}
                            onClick={() => handleDelete(product)}
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    ) : null}
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

      {canManageProducts ? (
        <ProductFormModal
          categories={categories}
          isOpen={isModalOpen}
          isSaving={isSaving}
          onClose={closeModal}
          onSubmit={handleSave}
          product={editingProduct}
        />
      ) : null}
    </div>
  );
}

export default Products;
