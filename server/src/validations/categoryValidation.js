function validateCreateCategory(data) {
  const errors = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.name = 'Category name is required';
  }
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.description = 'Description must be a string';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdateCategory(data) {
  const errors = {};

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
    errors.name = 'Category name cannot be empty';
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
  validateCreateCategory,
  validateUpdateCategory,
};
