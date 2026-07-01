const VALID_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'];

function validateCreateOrder(data) {
  const errors = {};

  if (!data.customer_id) {
    errors.customer_id = 'customer_id is required';
  }
  if (!data.order_date) {
    errors.order_date = 'order_date is required';
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
  }
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.items = 'At least one item is required';
  } else {
    const itemErrors = [];
    data.items.forEach((item, index) => {
      if (!item.product_id) {
        itemErrors.push(`Item ${index + 1}: product_id is required`);
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        itemErrors.push(`Item ${index + 1}: quantity must be a positive integer`);
      }
      if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
        itemErrors.push(`Item ${index + 1}: unit_price must be a non-negative number`);
      }
    });
    if (itemErrors.length > 0) {
      errors.items = itemErrors;
    }
  }
  if (data.notes !== undefined && typeof data.notes !== 'string') {
    errors.notes = 'Notes must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdateOrder(data) {
  const errors = {};

  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
  }
  if (data.notes !== undefined && typeof data.notes !== 'string') {
    errors.notes = 'Notes must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreateOrder,
  validateUpdateOrder,
  VALID_STATUSES,
};
