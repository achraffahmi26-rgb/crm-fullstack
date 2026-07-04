const invoiceService = require('../services/invoiceService');
const { validateCreateInvoice, validateUpdateInvoice } = require('../validations/invoiceValidation');

async function getInvoices(req, res) {
  try {
    const invoices = await invoiceService.getAllInvoices(req.user);
    return res.json({ invoices });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch invoices', error: error.message });
  }
}

async function getInvoiceById(req, res) {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    return res.json({ invoice });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch invoice', error: error.message });
  }
}

async function createInvoice(req, res) {
  const { errors, isValid } = validateCreateInvoice(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }
  try {
    const orderExists = await invoiceService.orderExists(req.body.order_id);
    if (!orderExists) {
      return res.status(400).json({ message: 'order_id does not exist' });
    }

    const orderAllowed = await invoiceService.canUseOrder(req.body.order_id, req.user);
    if (!orderAllowed) {
      return res.status(403).json({ message: 'You can only create invoices for your own scoped orders' });
    }

    const invoice = await invoiceService.createInvoice(req.body, req.user);
    return res.status(201).json({ invoice });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function updateInvoice(req, res) {
  const { errors, isValid } = validateUpdateInvoice(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }
  try {
    const existingInvoice = await invoiceService.getInvoiceById(req.params.id, req.user);
    if (!existingInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = await invoiceService.updateInvoice(req.params.id, req.body, req.user);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    return res.json({ invoice });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function deleteInvoice(req, res) {
  try {
    const existingInvoice = await invoiceService.getInvoiceById(req.params.id, req.user);
    if (!existingInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const deleted = await invoiceService.deleteInvoice(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Invoice not found or cannot be deleted' });
    }
    return res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
