import { Download, Eye, FileText, Pencil, Plus, Printer, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getCustomers } from '../api/customerApi';
import { createInvoice, deleteInvoice, getInvoices, updateInvoice } from '../api/invoiceApi';
import { getOrderById, getOrders } from '../api/orderApi';
import { getProducts } from '../api/productApi';
import DataTableToolbar from '../components/common/DataTableToolbar';
import PaginationControls from '../components/common/PaginationControls';
import SortableHeader from '../components/common/SortableHeader';
import InvoiceFormModal from '../components/invoices/InvoiceFormModal';
import InvoicePreviewModal from '../components/invoices/InvoicePreviewModal';
import { downloadInvoicePdf, printInvoice } from '../utils/invoiceExport';
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

function PaymentStatusBadge({ status }) {
  const colorMap = {
    Unpaid: 'bg-red-50 text-red-700',
    'Partially Paid': 'bg-amber-50 text-amber-700',
    Paid: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[status] || 'bg-slate-100 text-slate-600'}`}>
      {status || 'Unknown'}
    </span>
  );
}

function getCustomerName(customer) {
  return `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || customer?.email || 'Customer';
}

function Invoices() {
  const [customers, setCustomers] = useState([]);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [error, setError] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isExporting, setIsExporting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [products, setProducts] = useState([]);

  async function loadInvoices() {
    setError('');
    setIsLoading(true);

    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load invoices';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadReferenceData() {
    try {
      const [orderData, customerData, productData] = await Promise.all([getOrders(), getCustomers(), getProducts()]);
      setOrders(orderData);
      setCustomers(customerData);
      setProducts(productData);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to load invoice form options');
    }
  }

  useEffect(() => {
    loadInvoices();
    loadReferenceData();
  }, []);

  const orderById = useMemo(
    () => new Map(orders.map((order) => [Number(order.id), order])),
    [orders],
  );

  const getOrderLabel = useCallback((orderId) => {
    const order = orderById.get(Number(orderId));
    return order?.order_number || (orderId ? `Order #${orderId}` : '-');
  }, [orderById]);

  const customerById = useMemo(
    () => new Map(customers.map((customer) => [Number(customer.id), customer])),
    [customers],
  );

  const productById = useMemo(
    () => new Map(products.map((product) => [Number(product.id), product])),
    [products],
  );

  const paymentStatusOptions = useMemo(() => (
    [...new Set(invoices.map((invoice) => invoice.payment_status).filter(Boolean))]
      .sort()
      .map((status) => ({ label: status, value: status }))
  ), [invoices]);

  const table = useDataTable({
    data: invoices,
    filterDefinitions: [
      { key: 'payment_status', getValue: (invoice) => invoice.payment_status },
    ],
    initialSort: { key: 'created_at', direction: 'desc' },
    searchFields: (invoice) => [
      invoice.invoice_number,
      getOrderLabel(invoice.order_id),
      formatDate(invoice.invoice_date),
      formatDate(invoice.due_date),
      invoice.total_amount,
      formatMoney(invoice.total_amount),
      invoice.payment_status,
      formatDate(invoice.created_at),
    ],
    sortAccessors: {
      invoice_number: (invoice) => invoice.invoice_number,
      order_number: (invoice) => getOrderLabel(invoice.order_id),
      invoice_date: (invoice) => invoice.invoice_date,
      due_date: (invoice) => invoice.due_date,
      total_amount: (invoice) => invoice.total_amount,
      payment_status: (invoice) => invoice.payment_status,
      created_at: (invoice) => invoice.created_at,
    },
  });

  function openAddModal() {
    setEditingInvoice(null);
    setIsModalOpen(true);
  }

  function openEditModal(invoice) {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  }

  async function buildInvoiceDocument(invoice) {
    const orderSummary = orderById.get(Number(invoice.order_id));
    const order = orderSummary?.items ? orderSummary : await getOrderById(invoice.order_id);
    const customer = customerById.get(Number(order?.customer_id));
    const items = Array.isArray(order?.items) ? order.items.map((item) => {
      const product = productById.get(Number(item.product_id));

      return {
        productName: product?.name || `Product #${item.product_id}`,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
      };
    }) : [];

    return {
      invoice,
      order: {
        ...order,
        order_number: order?.order_number || getOrderLabel(invoice.order_id),
      },
      customer: {
        name: getCustomerName(customer),
        email: customer?.email || '-',
        phone: customer?.phone || '-',
        address: customer?.address || '-',
      },
      items,
    };
  }

  async function handlePreview(invoice) {
    setIsExporting(invoice.id);

    try {
      const document = await buildInvoiceDocument(invoice);
      setPreviewDocument(document);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to prepare invoice preview');
    } finally {
      setIsExporting(null);
    }
  }

  async function handleDownload(invoice) {
    setIsExporting(invoice.id);

    try {
      const document = await buildInvoiceDocument(invoice);
      downloadInvoicePdf(document);
      toast.success('Invoice PDF downloaded');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to download invoice PDF');
    } finally {
      setIsExporting(null);
    }
  }

  async function handlePrint(invoice) {
    setIsExporting(invoice.id);

    try {
      const document = await buildInvoiceDocument(invoice);
      const opened = printInvoice(document);

      if (!opened) {
        toast.error('Allow pop-ups to print the invoice');
      }
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to print invoice');
    } finally {
      setIsExporting(null);
    }
  }

  function handlePreviewDownload() {
    if (!previewDocument) {
      return;
    }

    downloadInvoicePdf(previewDocument);
    toast.success('Invoice PDF downloaded');
  }

  function handlePreviewPrint() {
    if (!previewDocument) {
      return;
    }

    const opened = printInvoice(previewDocument);

    if (!opened) {
      toast.error('Allow pop-ups to print the invoice');
    }
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingInvoice(null);
  }

  async function handleSave(payload) {
    setIsSaving(true);

    try {
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, payload);
        toast.success('Invoice updated');
      } else {
        await createInvoice(payload);
        toast.success('Invoice created');
      }

      setIsModalOpen(false);
      setEditingInvoice(null);
      await loadInvoices();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save invoice';
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

  async function handleDelete(invoice) {
    const confirmed = window.confirm(`Delete invoice ${invoice.invoice_number}?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(invoice.id);

    try {
      await deleteInvoice(invoice.id);
      toast.success('Invoice deleted');
      await loadInvoices();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to delete invoice');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="crm-page-stack">
      <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Invoices</p>
          <h1 className="mt-1 text-xl font-semibold text-crm-ink md:text-2xl">Customer invoices</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-crm-muted">
            Generate invoices from confirmed orders and keep payment status visible for the sales team.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-crm-line bg-white px-3 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadInvoices}
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
            Add Invoice
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-crm-line px-3.5 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-orange-50 p-1.5 text-crm-orange">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-crm-ink">All invoices</h2>
              <p className="text-[13px] text-crm-muted">
                {table.filteredRows.length} of {invoices.length} records
              </p>
            </div>
          </div>

          <DataTableToolbar
            filterValues={table.filterValues}
            filters={[
              { key: 'payment_status', label: 'All payment statuses', options: paymentStatusOptions },
            ]}
            onClear={table.clearFilters}
            onFilterChange={table.setFilterValue}
            onSearchChange={table.setSearchTerm}
            searchPlaceholder="Search invoice, order, status"
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
            <p className="text-sm font-semibold text-crm-ink">Could not load invoices</p>
            <p className="mt-1.5 text-[13px] text-crm-muted">{error}</p>
            <button
              className="mt-3 rounded-md bg-crm-orange px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadInvoices}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="crm-table-empty">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <FileText size={20} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-crm-ink">No invoices found</h3>
            <p className="mt-1.5 text-[13px] text-crm-muted">
              {invoices.length === 0 ? 'Create invoices from existing orders when billing starts.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="crm-table-shell">
            <table className="crm-table min-w-[1080px] w-full text-left">
              <thead>
                <tr>
                  <SortableHeader columnKey="invoice_number" onSort={table.toggleSort} sortConfig={table.sortConfig}>Invoice Number</SortableHeader>
                  <SortableHeader columnKey="order_number" onSort={table.toggleSort} sortConfig={table.sortConfig}>Order Number</SortableHeader>
                  <SortableHeader columnKey="invoice_date" onSort={table.toggleSort} sortConfig={table.sortConfig}>Invoice Date</SortableHeader>
                  <SortableHeader columnKey="due_date" onSort={table.toggleSort} sortConfig={table.sortConfig}>Due Date</SortableHeader>
                  <SortableHeader columnKey="total_amount" onSort={table.toggleSort} sortConfig={table.sortConfig}>Total Amount</SortableHeader>
                  <SortableHeader columnKey="payment_status" onSort={table.toggleSort} sortConfig={table.sortConfig}>Payment Status</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created At</SortableHeader>
                  <th className="text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <p className="font-semibold text-crm-ink">{invoice.invoice_number}</p>
                      <p className="text-xs text-crm-muted">ID #{invoice.id}</p>
                    </td>
                    <td className="text-crm-muted">{getOrderLabel(invoice.order_id)}</td>
                    <td className="text-crm-muted">{formatDate(invoice.invoice_date)}</td>
                    <td className="text-crm-muted">{formatDate(invoice.due_date)}</td>
                    <td className="text-crm-muted">{formatMoney(invoice.total_amount)}</td>
                    <td>
                      <PaymentStatusBadge status={invoice.payment_status} />
                    </td>
                    <td className="text-crm-muted">{formatDate(invoice.created_at)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label={`Preview ${invoice.invoice_number}`}
                          className="rounded-md border border-crm-line p-1 text-crm-muted hover:bg-white hover:text-crm-ink"
                          disabled={isExporting === invoice.id}
                          onClick={() => handlePreview(invoice)}
                          title="Preview invoice"
                          type="button"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          aria-label={`Download ${invoice.invoice_number} PDF`}
                          className="rounded-md border border-crm-line p-1 text-crm-muted hover:bg-white hover:text-crm-ink disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isExporting === invoice.id}
                          onClick={() => handleDownload(invoice)}
                          title="Download PDF"
                          type="button"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          aria-label={`Print ${invoice.invoice_number}`}
                          className="rounded-md border border-crm-line p-1 text-crm-muted hover:bg-white hover:text-crm-ink disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isExporting === invoice.id}
                          onClick={() => handlePrint(invoice)}
                          title="Print Invoice"
                          type="button"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          aria-label={`Edit ${invoice.invoice_number}`}
                          className="rounded-md border border-crm-line p-1 text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(invoice)}
                          type="button"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          aria-label={`Delete ${invoice.invoice_number}`}
                          className="rounded-md border border-red-100 p-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isDeleting === invoice.id}
                          onClick={() => handleDelete(invoice)}
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

      <InvoiceFormModal
        invoice={editingInvoice}
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={closeModal}
        onSubmit={handleSave}
        orders={orders}
      />

      <InvoicePreviewModal
        document={previewDocument}
        isOpen={Boolean(previewDocument)}
        onClose={() => setPreviewDocument(null)}
        onDownload={handlePreviewDownload}
        onPrint={handlePreviewPrint}
      />
    </div>
  );
}

export default Invoices;
