function safeText(value) {
  return String(value ?? '-');
}

function escapeHtml(value) {
  return safeText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

function escapePdfText(value) {
  return safeText(value)
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function truncate(value, maxLength) {
  const text = safeText(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function buildPdfContent(document) {
  const lines = [];

  function text(x, y, value, size = 10, color = '0.13 0.2 0.26') {
    lines.push(`${color} rg BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
  }

  function line(x1, y1, x2, y2, color = '0.86 0.89 0.93') {
    lines.push(`${color} RG ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  function rect(x, y, width, height, color = '0.96 0.98 0.99') {
    lines.push(`${color} rg ${x} ${y} ${width} ${height} re f`);
  }

  const items = document.items.length > 0 ? document.items : [{
    productName: 'Order total',
    quantity: 1,
    unitPrice: document.invoice.total_amount,
    subtotal: document.invoice.total_amount,
  }];

  rect(0, 792, 595, 50, '1 0.36 0.2');
  text(50, 816, 'CRM', 18, '1 1 1');
  text(50, 802, 'by Fahmi', 9, '1 1 1');
  text(450, 812, 'INVOICE', 22, '1 1 1');

  rect(50, 710, 76, 54, '0.96 0.98 0.99');
  line(50, 710, 126, 710);
  line(50, 764, 126, 764);
  line(50, 710, 50, 764);
  line(126, 710, 126, 764);
  text(64, 741, 'CRM', 12, '0.32 0.44 0.56');
  text(70, 726, 'by Fahmi', 9, '0.32 0.44 0.56');

  text(145, 750, 'CRM', 15);
  text(145, 733, 'Business Management Suite');
  text(145, 718, 'Casablanca, Morocco');
  text(145, 703, 'billing@crmpro.local | +212 000 000 000');

  text(405, 750, `Invoice #: ${document.invoice.invoice_number}`, 10);
  text(405, 733, `Order #: ${document.order.order_number}`, 10);
  text(405, 716, `Invoice date: ${formatDate(document.invoice.invoice_date)}`, 10);
  text(405, 699, `Due date: ${formatDate(document.invoice.due_date)}`, 10);

  rect(50, 625, 495, 54);
  text(65, 657, 'Bill To', 12, '1 0.36 0.2');
  text(65, 639, document.customer.name, 11);
  text(65, 624, document.customer.email);
  text(310, 639, document.customer.phone);
  text(310, 624, document.customer.address);

  rect(50, 560, 495, 28, '0.13 0.2 0.26');
  text(62, 570, 'Product', 10, '1 1 1');
  text(285, 570, 'Qty', 10, '1 1 1');
  text(350, 570, 'Unit Price', 10, '1 1 1');
  text(465, 570, 'Subtotal', 10, '1 1 1');

  let y = 535;
  items.slice(0, 10).forEach((item, index) => {
    if (index % 2 === 0) {
      rect(50, y - 8, 495, 24, '0.96 0.98 0.99');
    }

    text(62, y, truncate(item.productName, 38));
    text(290, y, item.quantity);
    text(350, y, formatMoney(item.unitPrice));
    text(465, y, formatMoney(item.subtotal));
    line(50, y - 14, 545, y - 14);
    y -= 28;
  });

  if (document.items.length > 10) {
    text(62, y, `+ ${document.items.length - 10} more item(s)`);
    y -= 28;
  }

  rect(345, 180, 200, 76);
  text(365, 228, 'Payment Status', 11, '0.32 0.44 0.56');
  text(470, 228, document.invoice.payment_status, 11, '1 0.36 0.2');
  line(365, 212, 525, 212);
  text(365, 192, 'Total', 14);
  text(455, 192, formatMoney(document.invoice.total_amount), 14, '1 0.36 0.2');

  line(50, 100, 545, 100);
  text(50, 75, 'Thank you for your business. This invoice was generated from CRM.');
  text(50, 58, 'For questions about this invoice, contact billing@crmpro.local.');

  return lines.join('\n');
}

function createPdfBlob(document) {
  const content = buildPdfContent(document);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

function buildPrintableHtml(document) {
  const items = document.items.length > 0 ? document.items : [{
    productName: 'Order total',
    quantity: 1,
    unitPrice: document.invoice.total_amount,
    subtotal: document.invoice.total_amount,
  }];

  const rows = items.map((item) => `
    <tr>
      <td>${escapeHtml(item.productName)}</td>
      <td>${escapeHtml(item.quantity)}</td>
      <td>${escapeHtml(formatMoney(item.unitPrice))}</td>
      <td>${escapeHtml(formatMoney(item.subtotal))}</td>
    </tr>
  `).join('');

  return `<!doctype html>
    <html>
      <head>
        <title>${escapeHtml(document.invoice.invoice_number)}</title>
        <style>
          @page { size: A4; margin: 18mm; }
          * { box-sizing: border-box; }
          body { color: #213343; font-family: Inter, Arial, sans-serif; margin: 0; }
          .header { align-items: center; background: #ff5c35; color: white; display: flex; justify-content: space-between; padding: 22px 28px; }
          .brand { font-size: 24px; font-weight: 800; }
          .title { font-size: 30px; font-weight: 800; }
          .grid { display: grid; gap: 24px; grid-template-columns: 1fr 1fr; margin-top: 28px; }
          .box { background: #f6f9fc; border: 1px solid #dbe4ed; padding: 18px; }
          .brand-block { align-items: center; display: flex; gap: 12px; }
          .brand-logo { height: 48px; object-fit: contain; width: 48px; }
          .logo { height: 58px; object-fit: contain; width: 92px; }
          h2 { color: #ff5c35; font-size: 13px; letter-spacing: .08em; margin: 0 0 12px; text-transform: uppercase; }
          p { margin: 4px 0; }
          table { border-collapse: collapse; margin-top: 30px; width: 100%; }
          th { background: #213343; color: white; font-size: 12px; padding: 12px; text-align: left; }
          td { border-bottom: 1px solid #dbe4ed; padding: 12px; }
          .total { margin-left: auto; margin-top: 26px; width: 280px; }
          .total-row { align-items: center; display: flex; justify-content: space-between; padding: 10px 0; }
          .amount { color: #ff5c35; font-size: 22px; font-weight: 800; }
          .footer { border-top: 1px solid #dbe4ed; color: #516f90; font-size: 12px; margin-top: 56px; padding-top: 18px; }
        </style>
      </head>
      <body>
        <section class="header"><div class="brand-block"><img alt="CRM by Fahmi" class="brand-logo" src="/images/logo.png" /><div><div class="brand">CRM</div><div>by Fahmi</div></div></div><div class="title">INVOICE</div></section>
        <section class="grid">
          <div class="box">
            <img alt="CRM by Fahmi" class="logo" src="/images/logo.png" />
            <p><strong>CRM</strong></p>
            <p>Business Management Suite</p>
            <p>Casablanca, Morocco</p>
            <p>billing@crmpro.local | +212 000 000 000</p>
          </div>
          <div class="box">
            <p><strong>Invoice #:</strong> ${escapeHtml(document.invoice.invoice_number)}</p>
            <p><strong>Order #:</strong> ${escapeHtml(document.order.order_number)}</p>
            <p><strong>Invoice date:</strong> ${escapeHtml(formatDate(document.invoice.invoice_date))}</p>
            <p><strong>Due date:</strong> ${escapeHtml(formatDate(document.invoice.due_date))}</p>
            <p><strong>Payment status:</strong> ${escapeHtml(document.invoice.payment_status)}</p>
          </div>
        </section>
        <section class="box" style="margin-top: 24px;">
          <h2>Customer Information</h2>
          <p><strong>${escapeHtml(document.customer.name)}</strong></p>
          <p>${escapeHtml(document.customer.email)}</p>
          <p>${escapeHtml(document.customer.phone)}</p>
          <p>${escapeHtml(document.customer.address)}</p>
        </section>
        <table>
          <thead><tr><th>Product</th><th>Quantity</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <section class="total">
          <div class="total-row"><span>Payment Status</span><strong>${escapeHtml(document.invoice.payment_status)}</strong></div>
          <div class="total-row"><span>Total</span><span class="amount">${escapeHtml(formatMoney(document.invoice.total_amount))}</span></div>
        </section>
        <section class="footer">
          <p>Thank you for your business. This invoice was generated from CRM.</p>
          <p>For questions about this invoice, contact billing@crmpro.local.</p>
        </section>
      </body>
    </html>`;
}

export function downloadInvoicePdf(document) {
  const blob = createPdfBlob(document);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${document.invoice.invoice_number || 'invoice'}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printInvoice(document) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');

  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintableHtml(document));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}

export { formatDate, formatMoney };
