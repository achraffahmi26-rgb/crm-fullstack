const VALID_PAYMENT_STATUSES = ['Unpaid', 'Partially Paid', 'Paid'];
const UPDATE_FIELDS = ['due_date', 'payment_status'];

function validateCreateInvoice(data) {
  const errors = {};
  if (!data.order_id) {
    errors.order_id = 'order_id is required';
  }
  if (!data.invoice_date) {
    errors.invoice_date = 'invoice_date is required';
  }
  if (!data.due_date) {
    errors.due_date = 'due_date is required';
  }
  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdateInvoice(data) {
  const errors = {};
  const invalidFields = Object.keys(data).filter((field) => !UPDATE_FIELDS.includes(field));

  if (invalidFields.length > 0) {
    errors.fields = `Only these fields can be updated: ${UPDATE_FIELDS.join(', ')}`;
  }
  if (data.payment_status && !VALID_PAYMENT_STATUSES.includes(data.payment_status)) {
    errors.payment_status = `payment_status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`;
  }
  if (data.due_date && typeof data.due_date !== 'string') {
    errors.due_date = 'due_date must be a string';
  }
  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreateInvoice,
  validateUpdateInvoice,
};
