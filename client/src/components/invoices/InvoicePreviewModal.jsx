import { Download, Printer, X } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import { formatDate, formatMoney } from '../../utils/invoiceExport';

function InvoicePreviewModal({ document, isOpen, onClose, onDownload, onPrint }) {
  if (!isOpen || !document) {
    return null;
  }

  const items = document.items.length > 0 ? document.items : [{
    productName: 'Order total',
    quantity: 1,
    unitPrice: document.invoice.total_amount,
    subtotal: document.invoice.total_amount,
  }];

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-crm-ink/40 p-0 sm:items-center sm:px-4 sm:py-6"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div className="flex max-h-screen w-full max-w-5xl flex-col rounded-t-lg border border-crm-line bg-white shadow-soft sm:max-h-[94vh] sm:rounded-lg">
        <div className="flex flex-col gap-3 border-b border-crm-line px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Invoice Preview</p>
            <h2 className="mt-1 text-xl font-semibold text-crm-ink">{document.invoice.invoice_number}</h2>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-crm-line bg-white px-4 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
              onClick={onPrint}
              type="button"
            >
              <Printer size={17} />
              Print Invoice
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-crm-orange px-4 text-sm font-semibold text-white hover:bg-crm-orangeDark"
              onClick={onDownload}
              type="button"
            >
              <Download size={17} />
              Download PDF
            </button>
            <button
              aria-label="Close modal"
              className="rounded-md p-2 text-crm-muted hover:bg-crm-surface"
              onClick={onClose}
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto bg-crm-surface p-4 sm:p-6">
          <article className="mx-auto min-h-[920px] max-w-[794px] bg-white text-crm-ink shadow-soft">
            <header className="flex items-center justify-between bg-crm-orange px-6 py-6 text-white sm:px-8">
              <div className="rounded-md bg-white px-3 py-2">
                <BrandLogo className="h-10 w-10" />
              </div>
              <div className="text-3xl font-extrabold">INVOICE</div>
            </header>

            <section className="grid gap-5 px-6 py-7 sm:grid-cols-2 sm:px-8">
              <div className="rounded-md border border-crm-line bg-crm-surface p-4">
                <img alt="CRM by Fahmi" className="mb-4 h-14 w-24 object-contain" src="/images/logo.png" />
                <p className="font-semibold">CRM</p>
                <p className="mt-1 text-sm text-crm-muted">Business Management Suite</p>
                <p className="mt-1 text-sm text-crm-muted">Casablanca, Morocco</p>
                <p className="mt-1 text-sm text-crm-muted">billing@crmpro.local</p>
              </div>

              <div className="rounded-md border border-crm-line bg-white p-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <span className="font-medium text-crm-muted">Invoice #</span>
                  <span className="text-right font-semibold">{document.invoice.invoice_number}</span>
                  <span className="font-medium text-crm-muted">Order #</span>
                  <span className="text-right font-semibold">{document.order.order_number}</span>
                  <span className="font-medium text-crm-muted">Invoice Date</span>
                  <span className="text-right">{formatDate(document.invoice.invoice_date)}</span>
                  <span className="font-medium text-crm-muted">Due Date</span>
                  <span className="text-right">{formatDate(document.invoice.due_date)}</span>
                  <span className="font-medium text-crm-muted">Payment Status</span>
                  <span className="text-right font-semibold text-crm-orange">{document.invoice.payment_status}</span>
                </div>
              </div>
            </section>

            <section className="mx-6 rounded-md border border-crm-line bg-crm-surface p-4 sm:mx-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Customer Information</p>
              <p className="mt-2 font-semibold">{document.customer.name}</p>
              <p className="mt-1 text-sm text-crm-muted">{document.customer.email}</p>
              <p className="mt-1 text-sm text-crm-muted">{document.customer.phone}</p>
              <p className="mt-1 text-sm text-crm-muted">{document.customer.address}</p>
            </section>

            <section className="px-6 py-7 sm:px-8">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-crm-ink text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Quantity</th>
                      <th className="px-4 py-3 font-semibold">Unit Price</th>
                      <th className="px-4 py-3 font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-crm-line">
                    {items.map((item, index) => (
                      <tr className="odd:bg-crm-surface/70" key={`${item.productName}-${index}`}>
                        <td className="px-4 py-3 font-medium">{item.productName}</td>
                        <td className="px-4 py-3 text-crm-muted">{item.quantity}</td>
                        <td className="px-4 py-3 text-crm-muted">{formatMoney(item.unitPrice)}</td>
                        <td className="px-4 py-3 font-semibold">{formatMoney(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ml-auto mt-6 w-full max-w-xs rounded-md border border-crm-line bg-crm-surface p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-crm-muted">Payment Status</span>
                  <span className="font-semibold text-crm-orange">{document.invoice.payment_status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-crm-line pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-extrabold text-crm-orange">{formatMoney(document.invoice.total_amount)}</span>
                </div>
              </div>
            </section>

            <footer className="mx-6 border-t border-crm-line py-5 text-sm text-crm-muted sm:mx-8">
              <p>Thank you for your business. This invoice was generated from CRM.</p>
              <p className="mt-1">For questions about this invoice, contact billing@crmpro.local.</p>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}

export default InvoicePreviewModal;
