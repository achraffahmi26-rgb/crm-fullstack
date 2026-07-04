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
    <div className="crm-page-stack">
      <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Payments</p>
          <h1 className="mt-1 text-xl font-semibold text-crm-ink md:text-2xl">Invoice payments</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-crm-muted">
            Track customer payments, methods, and transaction references against issued invoices.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-crm-line bg-white px-3 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadPayments}
            type="button"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-crm-orange px-3 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
            onClick={openAddModal}
            type="button"
          >
            <Plus size={15} />
            Add Payment
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-crm-line px-3.5 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-orange-50 p-1.5 text-crm-orange">
              <Banknote size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-crm-ink">All payments</h2>
              <p className="text-[13px] text-crm-muted">
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
          <div className="crm-table-loading">
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((item) => (
                <div className="crm-skeleton-row" key={item} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="crm-table-error">
            <p className="text-sm font-semibold text-crm-ink">Could not load payments</p>
            <p className="mt-1.5 text-[13px] text-crm-muted">{error}</p>
            <button
              className="mt-3 rounded-md bg-crm-orange px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadPayments}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="crm-table-empty">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <Banknote size={20} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-crm-ink">No payments found</h3>
            <p className="mt-1.5 text-[13px] text-crm-muted">
              {payments.length === 0 ? 'Add the first payment once an invoice is ready.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="crm-table-shell">
            <table className="crm-table min-w-[1160px] w-full text-left">
              <thead>
                <tr>
                  <SortableHeader columnKey="invoice_number" onSort={table.toggleSort} sortConfig={table.sortConfig}>Invoice Number</SortableHeader>
                  <SortableHeader columnKey="amount" onSort={table.toggleSort} sortConfig={table.sortConfig}>Amount</SortableHeader>
                  <SortableHeader columnKey="payment_method" onSort={table.toggleSort} sortConfig={table.sortConfig}>Payment Method</SortableHeader>
                  <SortableHeader columnKey="status" onSort={table.toggleSort} sortConfig={table.sortConfig}>Status</SortableHeader>
                  <SortableHeader columnKey="payment_date" onSort={table.toggleSort} sortConfig={table.sortConfig}>Payment Date</SortableHeader>
                  <SortableHeader columnKey="reference" onSort={table.toggleSort} sortConfig={table.sortConfig}>Reference</SortableHeader>
                  <SortableHeader columnKey="transaction_id" onSort={table.toggleSort} sortConfig={table.sortConfig}>Transaction ID</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created At</SortableHeader>
                  <th className="text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <p className="font-semibold text-crm-ink">{getInvoiceLabel(payment.invoice_id)}</p>
                      <p className="text-xs text-crm-muted">Payment ID #{payment.id}</p>
                    </td>
                    <td className="text-crm-muted">{formatMoney(payment.amount)}</td>
                    <td className="text-crm-muted">{payment.payment_method || '-'}</td>
                    <td>
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="text-crm-muted">{formatDate(payment.payment_date)}</td>
                    <td className="text-crm-muted">{payment.reference || '-'}</td>
                    <td className="text-crm-muted">{payment.transaction_id || '-'}</td>
                    <td className="text-crm-muted">{formatDate(payment.created_at)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label={`Edit payment #${payment.id}`}
                          className="rounded-md border border-crm-line p-1 text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(payment)}
                          type="button"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          aria-label={`Delete payment #${payment.id}`}
                          className="rounded-md border border-red-100 p-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isDeleting === payment.id}
                          onClick={() => handleDelete(payment)}
                          type="button"
                        >
                          <Trash2 size={14} />
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
