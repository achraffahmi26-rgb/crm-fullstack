const VALID_TYPES = ['Info', 'Success', 'Warning', 'Error'];

function validateCreateNotification(data) {
  const errors = {};

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.title = 'Title is required';
  }
  if (!data.message || typeof data.message !== 'string' || data.message.trim() === '') {
    errors.message = 'Message is required';
  }
  if (data.type !== undefined && !VALID_TYPES.includes(data.type)) {
    errors.type = `Type must be one of: ${VALID_TYPES.join(', ')}`;
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreateNotification,
  VALID_TYPES,
};
