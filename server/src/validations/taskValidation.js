const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Pending', 'In Progress', 'Completed'];
const UPDATE_FIELDS = ['title', 'description', 'priority', 'status', 'due_date', 'assigned_to'];

function validateCreateTask(data) {
  const errors = {};

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.title = 'Title is required';
  }
  if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
    errors.description = 'Description must be a string';
  }
  if (!data.priority || !VALID_PRIORITIES.includes(data.priority)) {
    errors.priority = `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`;
  }
  if (!data.status || !VALID_STATUSES.includes(data.status)) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
  }
  if (data.due_date !== undefined && data.due_date !== null && typeof data.due_date !== 'string') {
    errors.due_date = 'due_date must be a string';
  }
  if (data.assigned_to !== undefined && !Number.isInteger(data.assigned_to)) {
    errors.assigned_to = 'assigned_to must be a user id';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

function validateUpdateTask(data) {
  const errors = {};
  const invalidFields = Object.keys(data).filter((field) => !UPDATE_FIELDS.includes(field));

  if (invalidFields.length > 0) {
    errors.fields = `Only these fields can be updated: ${UPDATE_FIELDS.join(', ')}`;
  }
  if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim() === '')) {
    errors.title = 'Title cannot be empty';
  }
  if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
    errors.description = 'Description must be a string';
  }
  if (data.priority !== undefined && !VALID_PRIORITIES.includes(data.priority)) {
    errors.priority = `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`;
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
  }
  if (data.due_date !== undefined && data.due_date !== null && typeof data.due_date !== 'string') {
    errors.due_date = 'due_date must be a string';
  }
  if (data.assigned_to !== undefined && !Number.isInteger(data.assigned_to)) {
    errors.assigned_to = 'assigned_to must be a user id';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  VALID_PRIORITIES,
  VALID_STATUSES,
};
