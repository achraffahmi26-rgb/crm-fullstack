const { getDatabase } = require('../database/connection');
const { createNotificationSafely } = require('./notificationService');

async function getAllTasks() {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, assigned_to, created_by, title, description, priority, status, due_date, created_at, updated_at
     FROM tasks
     ORDER BY created_at DESC`
  );
  return rows;
}

async function getTaskById(id) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, assigned_to, created_by, title, description, priority, status, due_date, created_at, updated_at
     FROM tasks
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function userExists(userId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
  return rows.length > 0;
}

async function createTask(data, authUserId) {
  const db = getDatabase();
  const assignedTo = data.assigned_to !== undefined ? data.assigned_to : authUserId;

  const [result] = await db.execute(
    `INSERT INTO tasks (assigned_to, created_by, title, description, priority, status, due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      assignedTo,
      authUserId,
      data.title,
      data.description || null,
      data.priority,
      data.status,
      data.due_date || null,
    ]
  );
  const task = await getTaskById(result.insertId);
  createNotificationSafely({
    title: 'New task assigned',
    message: `Task "${task.title}" was assigned with ${task.priority} priority.`,
    type: 'Info',
  }, task.assigned_to || authUserId);

  return task;
}

async function updateTask(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  if (data.assigned_to !== undefined) {
    fields.push('assigned_to = ?');
    params.push(data.assigned_to);
  }
  if (data.title !== undefined) {
    fields.push('title = ?');
    params.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    params.push(data.description || null);
  }
  if (data.priority !== undefined) {
    fields.push('priority = ?');
    params.push(data.priority);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.due_date !== undefined) {
    fields.push('due_date = ?');
    params.push(data.due_date || null);
  }

  if (fields.length === 0) {
    return getTaskById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  await db.execute(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);
  return getTaskById(id);
}

async function deleteTask(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM tasks WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllTasks,
  getTaskById,
  userExists,
  createTask,
  updateTask,
  deleteTask,
};
