import { Pencil, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getCustomers } from '../api/customerApi';
import { createOrder, deleteOrder, getOrders, updateOrder } from '../api/orderApi';
import { getProducts } from '../api/productApi';
import DataTableToolbar from '../components/common/DataTableToolbar';
import PaginationControls from '../components/common/PaginationControls';
import SortableHeader from '../components/common/SortableHeader';
import OrderFormModal from '../components/orders/OrderFormModal';
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

function getCustomerName(customer) {
  return `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || customer?.email || '';
}

function StatusBadge({ status }) {
  const colorMap = {
    Pending: 'bg-amber-50 text-amber-700',
    Confirmed: 'bg-sky-50 text-sky-700',
    Processing: 'bg-indigo-50 text-indigo-700',
    Completed: 'bg-emerald-50 text-emerald-700',
    Cancelled: 'bg-red-50 text-red-700',
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[status] || 'bg-slate-100 text-slate-600'}`}>
      {status || 'Unknown'}
    </span>
  );
}

function Orders() {
  const [customers, setCustomers] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  async function loadOrders() {
    setError('');
    setIsLoading(true);

    try {
      const data = await getOrders();
      setOrders(data);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load orders';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFormOptions() {
    try {
      const [customerData, productData] = await Promise.all([getCustomers(), getProducts()]);
      setCustomers(customerData);
      setProducts(productData);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to load order form options');
    }
  }

  useEffect(() => {
    loadOrders();
    loadFormOptions();
  }, []);

  const customerById = useMemo(
    () => new Map(customers.map((customer) => [Number(customer.id), customer])),
    [customers],
  );

  const getCustomerLabel = useCallback((customerId) => {
    const customer = customerById.get(Number(customerId));
    return getCustomerName(customer) || (customerId ? `Customer #${customerId}` : '-');
  }, [customerById]);

  const statusOptions = useMemo(() => (
    [...new Set(orders.map((order) => order.status).filter(Boolean))]
      .sort()
      .map((status) => ({ label: status, value: status }))
  ), [orders]);

  const table = useDataTable({
    data: orders,
    filterDefinitions: [
      { key: 'status', getValue: (order) => order.status },
    ],
    initialSort: { key: 'created_at', direction: 'desc' },
    searchFields: (order) => [
      order.order_number,
      getCustomerLabel(order.customer_id),
      formatDate(order.order_date),
      order.total_amount,
      formatMoney(order.total_amount),
      order.status,
      formatDate(order.created_at),
    ],
    sortAccessors: {
      order_number: (order) => order.order_number,
      customer: (order) => getCustomerLabel(order.customer_id),
      order_date: (order) => order.order_date,
      total_amount: (order) => order.total_amount,
      status: (order) => order.status,
      created_at: (order) => order.created_at,
    },
  });

  function openAddModal() {
    setEditingOrder(null);
    setIsModalOpen(true);
  }

  function openEditModal(order) {
    setEditingOrder(order);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingOrder(null);
  }

  async function handleSave(payload) {
    setIsSaving(true);

    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, payload);
        toast.success('Order updated');
      } else {
        await createOrder(payload);
        toast.success('Order created');
      }

      setIsModalOpen(false);
      setEditingOrder(null);
      await loadOrders();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save order';
      const fieldErrors = requestError.response?.data?.errors;

      if (fieldErrors) {
        const values = Array.isArray(fieldErrors.items) ? fieldErrors.items : Object.values(fieldErrors);
        toast.error(values.join(', '));
      } else {
        toast.error(message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(order) {
    const confirmed = window.confirm(`Delete order ${order.order_number}?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(order.id);

    try {
      await deleteOrder(order.id);
      toast.success('Order deleted');
      await loadOrders();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to delete order');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Orders</p>
          <h1 className="mt-2 text-2xl font-semibold text-crm-ink md:text-3xl">Sales orders</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-crm-muted">
            Create customer orders, manage fulfillment status, and keep revenue records current.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-crm-line bg-white px-4 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadOrders}
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
            Add Order
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-crm-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-orange-50 p-2 text-crm-orange">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-crm-ink">All orders</h2>
              <p className="text-sm text-crm-muted">
                {table.filteredRows.length} of {orders.length} records
              </p>
            </div>
          </div>

          <DataTableToolbar
            filterValues={table.filterValues}
            filters={[
              { key: 'status', label: 'All statuses', options: statusOptions },
            ]}
            onClear={table.clearFilters}
            onFilterChange={table.setFilterValue}
            onSearchChange={table.setSearchTerm}
            searchPlaceholder="Search order number, customer, status"
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
            <p className="text-sm font-semibold text-crm-ink">Could not load orders</p>
            <p className="mt-2 text-sm text-crm-muted">{error}</p>
            <button
              className="mt-4 rounded-md bg-crm-orange px-4 py-2 text-sm font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadOrders}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <ShoppingCart size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-crm-ink">No orders found</h3>
            <p className="mt-2 text-sm text-crm-muted">
              {orders.length === 0 ? 'Add your first order once customers and products are ready.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full text-left">
              <thead className="bg-crm-surface text-xs uppercase tracking-wide text-crm-muted">
                <tr>
                  <SortableHeader columnKey="order_number" onSort={table.toggleSort} sortConfig={table.sortConfig}>Order Number</SortableHeader>
                  <SortableHeader columnKey="customer" onSort={table.toggleSort} sortConfig={table.sortConfig}>Customer</SortableHeader>
                  <SortableHeader columnKey="order_date" onSort={table.toggleSort} sortConfig={table.sortConfig}>Order Date</SortableHeader>
                  <SortableHeader columnKey="total_amount" onSort={table.toggleSort} sortConfig={table.sortConfig}>Total Amount</SortableHeader>
                  <SortableHeader columnKey="status" onSort={table.toggleSort} sortConfig={table.sortConfig}>Status</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created At</SortableHeader>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-line text-sm">
                {table.rows.map((order) => (
                  <tr className="bg-white hover:bg-crm-surface/70" key={order.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-crm-ink">{order.order_number}</p>
                      <p className="text-xs text-crm-muted">ID #{order.id}</p>
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{getCustomerLabel(order.customer_id)}</td>
                    <td className="px-4 py-4 text-crm-muted">{formatDate(order.order_date)}</td>
                    <td className="px-4 py-4 text-crm-muted">{formatMoney(order.total_amount)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Edit ${order.order_number}`}
                          className="rounded-md border border-crm-line p-2 text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(order)}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={`Delete ${order.order_number}`}
                          className="rounded-md border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isDeleting === order.id}
                          onClick={() => handleDelete(order)}
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

      <OrderFormModal
        customers={customers}
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={closeModal}
        onSubmit={handleSave}
        order={editingOrder}
        products={products}
      />
    </div>
  );
}

export default Orders;
