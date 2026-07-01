import { Banknote, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getInvoices } from '../api/invoiceApi';
import { createPayment, deletePayment, getPayments, updatePayment } from '../api/paymentApi';
import DataTableToolbar from '../components/common/DataTableToolbar';
import PaginationControls from '../components/common/PaginationControls';
import SortableHeader from '../components/common/SortableHeader';
import PaymentFormModal from '../components/payments/PaymentFormModal';
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

function StatusBadge({ status }) {
  const colorMap = {
    Pending: 'bg-amber-50 text-amber-700',
    Completed: 'bg-emerald-50 text-emerald-700',
    Failed: 'bg-red-50 text-red-700',
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[status] || 'bg-slate-100 text-slate-600'}`}>
      {status || 'Unknown'}
    </span>
  );
}

function Payments() {
  const [editingPayment, setEditingPayment] = useState(null);
  const [error, setError] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [payments, setPayments] = useState([]);

  async function loadPayments() {
    setError('');
    setIsLoading(true);

    try {
      const data = await getPayments();
      setPayments(data);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load payments';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadInvoices() {
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to load payment form options');
    }
  }

  useEffect(() => {
    loadPayments();
    loadInvoices();
  }, []);

  const invoiceById = useMemo(
    () => new Map(invoices.map((invoice) => [Number(invoice.id), invoice])),
    [invoices],
  );

  const getInvoiceLabel = useCallback((invoiceId) => {
    const invoice = invoiceById.get(Number(invoiceId));
    return invoice?.invoice_number || (invoiceId ? `Invoice #${invoiceId}` : '-');
  }, [invoiceById]);

  const statusOptions = useMemo(() => (
    [...new Set(payments.map((payment) => payment.status).filter(Boolean))]
      .sort()
      .map((status) => ({ label: status, value: status }))
  ), [payments]);

  const methodOptions = useMemo(() => (
    [...new Set(payments.map((payment) => payment.payment_method).filter(Boolean))]
      .sort()
      .map((method) => ({ label: method, value: method }))
  ), [payments]);

  const table = useDataTable({
    data: payments,
    filterDefinitions: [
      { key: 'status', getValue: (payment) => payment.status },
      { key: 'payment_method', getValue: (payment) => payment.payment_method },
    ],
    initialSort: { key: 'created_at', direction: 'desc' },
    searchFields: (payment) => [
      getInvoiceLabel(payment.invoice_id),
      payment.amount,
      formatMoney(payment.amount),
      payment.payment_method,
      payment.status,
      formatDate(payment.payment_date),
      payment.reference,
      payment.transaction_id,
      formatDate(payment.created_at),
    ],
    sortAccessors: {
      invoice_number: (payment) => getInvoiceLabel(payment.invoice_id),
      amount: (payment) => payment.amount,
      payment_method: (payment) => payment.payment_method,
      status: (payment) => payment.status,
      payment_date: (payment) => payment.payment_date,
      reference: (payment) => payment.reference,
      transaction_id: (payment) => payment.transaction_id,
      created_at: (payment) => payment.created_at,
    },
  });

  function openAddModal() {
    setEditingPayment(null);
    setIsModalOpen(true);
  }

  function openEditModal(payment) {
    setEditingPayment(payment);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingPayment(null);
  }

  async function handleSave(payload) {
    setIsSaving(true);

    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id, payload);
        toast.success('Payment updated');
      } else {
        await createPayment(payload);
        toast.success('Payment created');
      }

      setIsModalOpen(false);
      setEditingPayment(null);
      await Promise.all([loadPayments(), loadInvoices()]);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save payment';
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

  async function handleDelete(payment) {
    const confirmed = window.confirm(`Delete payment for ${getInvoiceLabel(payment.invoice_id)}?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(payment.id);

    try {
      await deletePayment(payment.id);
      toast.success('Payment deleted');
      await Promise.all([loadPayments(), loadInvoices()]);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to delete payment');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Payments</p>
          <h1 className="mt-2 text-2xl font-semibold text-crm-ink md:text-3xl">Invoice payments</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-crm-muted">
            Track customer payments, methods, and transaction references against issued invoices.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-crm-line bg-white px-4 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadPayments}
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
            Add Payment
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-crm-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-orange-50 p-2 text-crm-orange">
              <Banknote size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-crm-ink">All payments</h2>
              <p className="text-sm text-crm-muted">
                {table.filteredRows.length} of {payments.length} records
              </p>
            </div>
          </div>

          <DataTableToolbar
            filterValues={table.filterValues}
            filters={[
              { key: 'status', label: 'All statuses', options: statusOptions },
              { key: 'payment_method', label: 'All methods', options: methodOptions },
            ]}
            onClear={table.clearFilters}
            onFilterChange={table.setFilterValue}
            onSearchChange={table.setSearchTerm}
            searchPlaceholder="Search invoice, method, status, reference"
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
            <p className="text-sm font-semibold text-crm-ink">Could not load payments</p>
            <p className="mt-2 text-sm text-crm-muted">{error}</p>
            <button
              className="mt-4 rounded-md bg-crm-orange px-4 py-2 text-sm font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadPayments}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <Banknote size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-crm-ink">No payments found</h3>
            <p className="mt-2 text-sm text-crm-muted">
              {payments.length === 0 ? 'Add the first payment once an invoice is ready.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1160px] w-full text-left">
              <thead className="bg-crm-surface text-xs uppercase tracking-wide text-crm-muted">
                <tr>
                  <SortableHeader columnKey="invoice_number" onSort={table.toggleSort} sortConfig={table.sortConfig}>Invoice Number</SortableHeader>
                  <SortableHeader columnKey="amount" onSort={table.toggleSort} sortConfig={table.sortConfig}>Amount</SortableHeader>
                  <SortableHeader columnKey="payment_method" onSort={table.toggleSort} sortConfig={table.sortConfig}>Payment Method</SortableHeader>
                  <SortableHeader columnKey="status" onSort={table.toggleSort} sortConfig={table.sortConfig}>Status</SortableHeader>
                  <SortableHeader columnKey="payment_date" onSort={table.toggleSort} sortConfig={table.sortConfig}>Payment Date</SortableHeader>
                  <SortableHeader columnKey="reference" onSort={table.toggleSort} sortConfig={table.sortConfig}>Reference</SortableHeader>
                  <SortableHeader columnKey="transaction_id" onSort={table.toggleSort} sortConfig={table.sortConfig}>Transaction ID</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created At</SortableHeader>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-line text-sm">
                {table.rows.map((payment) => (
                  <tr className="bg-white hover:bg-crm-surface/70" key={payment.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-crm-ink">{getInvoiceLabel(payment.invoice_id)}</p>
                      <p className="text-xs text-crm-muted">Payment ID #{payment.id}</p>
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{formatMoney(payment.amount)}</td>
                    <td className="px-4 py-4 text-crm-muted">{payment.payment_method || '-'}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{formatDate(payment.payment_date)}</td>
                    <td className="px-4 py-4 text-crm-muted">{payment.reference || '-'}</td>
                    <td className="px-4 py-4 text-crm-muted">{payment.transaction_id || '-'}</td>
                    <td className="px-4 py-4 text-crm-muted">{formatDate(payment.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Edit payment #${payment.id}`}
                          className="rounded-md border border-crm-line p-2 text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(payment)}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={`Delete payment #${payment.id}`}
                          className="rounded-md border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isDeleting === payment.id}
                          onClick={() => handleDelete(payment)}
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

      <PaymentFormModal
        invoices={invoices}
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={closeModal}
        onSubmit={handleSave}
        payment={editingPayment}
      />
    </div>
  );
}

export default Payments;
