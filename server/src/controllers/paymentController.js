const paymentService = require('../services/paymentService');
const { validateCreatePayment, validateUpdatePayment } = require('../validations/paymentValidation');

async function getPayments(req, res) {
  try {
    const payments = await paymentService.getAllPayments(req.user);
    return res.json({ payments });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch payments', error: error.message });
  }
}

async function getPaymentById(req, res) {
  try {
    const payment = await paymentService.getPaymentById(req.params.id, req.user);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    return res.json({ payment });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch payment', error: error.message });
  }
}

async function createPayment(req, res) {
  const { errors, isValid } = validateCreatePayment(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const invoiceExists = await paymentService.invoiceExists(req.body.invoice_id);
    if (!invoiceExists) {
      return res.status(400).json({ message: 'invoice_id does not exist' });
    }

    const invoiceAllowed = await paymentService.canUseInvoice(req.body.invoice_id, req.user);
    if (!invoiceAllowed) {
      return res.status(403).json({ message: 'You can only create payments for your own scoped invoices' });
    }

    const payment = await paymentService.createPayment(req.body, req.user);
    return res.status(201).json({ payment });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function updatePayment(req, res) {
  const { errors, isValid } = validateUpdatePayment(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const existingPayment = await paymentService.getPaymentById(req.params.id, req.user);
    if (!existingPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (req.body.invoice_id !== undefined) {
      const invoiceExists = await paymentService.invoiceExists(req.body.invoice_id);
      if (!invoiceExists) {
        return res.status(400).json({ message: 'invoice_id does not exist' });
      }

      const invoiceAllowed = await paymentService.canUseInvoice(req.body.invoice_id, req.user);
      if (!invoiceAllowed) {
        return res.status(403).json({ message: 'You can only move payments to your own scoped invoices' });
      }
    }

    const payment = await paymentService.updatePayment(req.params.id, req.body, req.user);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    return res.json({ payment });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function deletePayment(req, res) {
  try {
    const existingPayment = await paymentService.getPaymentById(req.params.id, req.user);
    if (!existingPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const deleted = await paymentService.deletePayment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    return res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
};
