const { getDatabase } = require('../database/connection');
const { createNotificationSafely } = require('./notificationService');

function isAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

const TASK_SELECT = `SELECT tasks.id, tasks.assigned_to, tasks.created_by, tasks.title, tasks.description,
        tasks.priority, tasks.status, tasks.due_date, tasks.created_at, tasks.updated_at,
        CONCAT(assignee.first_name, ' ', assignee.last_name) AS assigned_user_name,
        assignee.email AS assigned_user_email,
        CONCAT(creator.first_name, ' ', creator.last_name) AS creator_user_name,
        creator.email AS creator_user_email
     FROM tasks
     LEFT JOIN users assignee ON assignee.id = tasks.assigned_to
     LEFT JOIN users creator ON creator.id = tasks.created_by`;

function appendTaskScope(query, params, user) {
  if (isAdmin(user)) {
    return { query, params };
  }

  const scope = '(tasks.created_by = ? OR tasks.assigned_to = ?)';
  const scopedQuery = query.includes('WHERE') ? `${query} AND ${scope}` : `${query} WHERE ${scope}`;

  return {
    query: scopedQuery,
    params: [...params, user.id, user.id],
  };
}

async function getAllTasks(user) {
  const db = getDatabase();
  const scoped = appendTaskScope(TASK_SELECT, [], user);
  const [rows] = await db.execute(`${scoped.query} ORDER BY tasks.created_at DESC`, scoped.params);
  return rows;
}

async function getTaskById(id, user) {
  const db = getDatabase();
  const scoped = appendTaskScope(`${TASK_SELECT} WHERE tasks.id = ?`, [id], user);
  const [rows] = await db.execute(scoped.query, scoped.params);
  return rows[0] || null;
}

async function activeUserExists(userId) {
  const db = getDatabase();
  const [rows] = await db.execute('SELECT id FROM users WHERE id = ? AND status = ?', [userId, 'Active']);
  return rows.length > 0;
}

async function createTask(data, user) {
  const db = getDatabase();
  const assignedTo = isAdmin(user) ? (data.assigned_to || user.id) : user.id;

  const [result] = await db.execute(
    `INSERT INTO tasks (assigned_to, created_by, title, description, priority, status, due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      assignedTo,
      user.id,
      data.title,
      data.description || null,
      data.priority,
      data.status,
      data.due_date || null,
    ]
  );
  const task = await getTaskById(result.insertId, user);
  createNotificationSafely({
    title: 'New task assigned',
    message: `Task "${task.title}" was assigned with ${task.priority} priority.`,
    type: 'Info',
  }, task.assigned_to || user.id);

  return task;
}

async function updateTask(id, data, user) {
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
    return getTaskById(id, user);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  await db.execute(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);
  return getTaskById(id, user);
}

async function deleteTask(id) {
  const db = getDatabase();
  await db.execute('DELETE FROM tasks WHERE id = ?', [id]);
  return true;
}

module.exports = {
  getAllTasks,
  getTaskById,
  activeUserExists,
  createTask,
  updateTask,
  deleteTask,
  isAdmin,
};
