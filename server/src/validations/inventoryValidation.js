function validateCreateInventory(data) {
  const errors = {};

  if (!data.product_id) {
    errors.product_id = 'product_id is required';
  }
  if (data.quantity !== undefined && (!Number.isInteger(data.quantity) || data.quantity < 0)) {
    errors.quantity = 'Quantity must be a non-negative integer';
  }
  if (data.minimum_stock !== undefined && (!Number.isInteger(data.minimum_stock) || data.minimum_stock < 0)) {
    errors.minimum_stock = 'Minimum stock must be a non-negative integer';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdateInventory(data) {
  const errors = {};

  if (data.quantity !== undefined && (!Number.isInteger(data.quantity) || data.quantity < 0)) {
    errors.quantity = 'Quantity must be a non-negative integer';
  }
  if (data.minimum_stock !== undefined && (!Number.isInteger(data.minimum_stock) || data.minimum_stock < 0)) {
    errors.minimum_stock = 'Minimum stock must be a non-negative integer';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreateInventory,
  validateUpdateInventory,
};
