const VALID_PAYMENT_METHODS = ['Cash', 'Credit Card', 'Bank Transfer'];
const VALID_PAYMENT_STATUSES = ['Pending', 'Completed', 'Failed'];
const UPDATE_FIELDS = ['invoice_id', 'amount', 'payment_method', 'payment_date', 'transaction_id', 'reference', 'status'];

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validateCreatePayment(data) {
  const errors = {};

  if (!data.invoice_id) {
    errors.invoice_id = 'invoice_id is required';
  }
  if (!isPositiveNumber(data.amount)) {
    errors.amount = 'amount must be a positive number';
  }
  if (!data.payment_method || !VALID_PAYMENT_METHODS.includes(data.payment_method)) {
    errors.payment_method = `payment_method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`;
  }
  if (!data.payment_date) {
    errors.payment_date = 'payment_date is required';
  }
  if (!data.status || !VALID_PAYMENT_STATUSES.includes(data.status)) {
    errors.status = `status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`;
  }
  if (data.reference !== undefined && data.reference !== null && typeof data.reference !== 'string') {
    errors.reference = 'reference must be a string';
  }
  if (data.transaction_id !== undefined && data.transaction_id !== null && typeof data.transaction_id !== 'string') {
    errors.transaction_id = 'transaction_id must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdatePayment(data) {
  const errors = {};
  const invalidFields = Object.keys(data).filter((field) => !UPDATE_FIELDS.includes(field));

  if (invalidFields.length > 0) {
    errors.fields = `Only these fields can be updated: ${UPDATE_FIELDS.join(', ')}`;
  }
  if (data.amount !== undefined && !isPositiveNumber(data.amount)) {
    errors.amount = 'amount must be a positive number';
  }
  if (data.payment_method !== undefined && !VALID_PAYMENT_METHODS.includes(data.payment_method)) {
    errors.payment_method = `payment_method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`;
  }
  if (data.status !== undefined && !VALID_PAYMENT_STATUSES.includes(data.status)) {
    errors.status = `status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`;
  }
  if (data.reference !== undefined && data.reference !== null && typeof data.reference !== 'string') {
    errors.reference = 'reference must be a string';
  }
  if (data.transaction_id !== undefined && data.transaction_id !== null && typeof data.transaction_id !== 'string') {
    errors.transaction_id = 'transaction_id must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreatePayment,
  validateUpdatePayment,
  VALID_PAYMENT_METHODS,
  VALID_PAYMENT_STATUSES,
};
