function validateCreateProduct(data) {
  const errors = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.name = 'Product name is required';
  }
  if (!data.sku || typeof data.sku !== 'string' || data.sku.trim() === '') {
    errors.sku = 'SKU is required';
  }
  if (data.category_id !== undefined && data.category_id !== null && !Number.isInteger(data.category_id)) {
    errors.category_id = 'category_id must be a number';
  }
  if (data.barcode !== undefined && typeof data.barcode !== 'string') {
    errors.barcode = 'Barcode must be a string';
  }
  if (data.purchase_price !== undefined && data.purchase_price !== null) {
    if (typeof data.purchase_price !== 'number' || data.purchase_price < 0) {
      errors.purchase_price = 'Purchase price must be a non-negative number';
    }
  }
  if (data.selling_price !== undefined && data.selling_price !== null) {
    if (typeof data.selling_price !== 'number' || data.selling_price < 0) {
      errors.selling_price = 'Selling price must be a non-negative number';
    }
  }
  if (data.status !== undefined && !['Active', 'Inactive'].includes(data.status)) {
    errors.status = 'Status must be Active or Inactive';
  }
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.description = 'Description must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdateProduct(data) {
  const errors = {};

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
    errors.name = 'Product name cannot be empty';
  }
  if (data.sku !== undefined && (typeof data.sku !== 'string' || data.sku.trim() === '')) {
    errors.sku = 'SKU cannot be empty';
  }
  if (data.category_id !== undefined && data.category_id !== null && !Number.isInteger(data.category_id)) {
    errors.category_id = 'category_id must be a number';
  }
  if (data.barcode !== undefined && typeof data.barcode !== 'string') {
    errors.barcode = 'Barcode must be a string';
  }
  if (data.purchase_price !== undefined && data.purchase_price !== null) {
    if (typeof data.purchase_price !== 'number' || data.purchase_price < 0) {
      errors.purchase_price = 'Purchase price must be a non-negative number';
    }
  }
  if (data.selling_price !== undefined && data.selling_price !== null) {
    if (typeof data.selling_price !== 'number' || data.selling_price < 0) {
      errors.selling_price = 'Selling price must be a non-negative number';
    }
  }
  if (data.status !== undefined && !['Active', 'Inactive'].includes(data.status)) {
    errors.status = 'Status must be Active or Inactive';
  }
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.description = 'Description must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
};
