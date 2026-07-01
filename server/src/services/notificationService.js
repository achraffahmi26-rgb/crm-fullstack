const { getDatabase } = require('../database/connection');

async function getNotificationsByUser(userId) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, user_id, title, message, type, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function getUnreadCount(userId) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM notifications
     WHERE user_id = ? AND is_read = false`,
    [userId]
  );
  return Number(rows[0]?.count || 0);
}

async function getNotificationById(id, userId) {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, user_id, title, message, type, is_read, created_at
     FROM notifications
     WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return rows[0] || null;
}

async function createNotification(data, userId) {
  const db = getDatabase();
  const [result] = await db.execute(
    `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
     VALUES (?, ?, ?, ?, false, CURRENT_TIMESTAMP)`,
    [userId, data.title, data.message, data.type || 'Info']
  );
  return getNotificationById(result.insertId, userId);
}

function createNotificationSafely(data, userId) {
  if (!userId) {
    return;
  }

  createNotification(data, userId).catch((error) => {
    console.error('Notification creation failed:', error.message);
  });
}

async function markNotificationAsRead(id, userId) {
  const db = getDatabase();
  await db.execute(
    `UPDATE notifications
     SET is_read = true
     WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return getNotificationById(id, userId);
}

async function markAllNotificationsAsRead(userId) {
  const db = getDatabase();
  await db.execute(
    `UPDATE notifications
     SET is_read = true
     WHERE user_id = ?`,
    [userId]
  );
  return true;
}

async function deleteNotification(id, userId) {
  const db = getDatabase();
  await db.execute(
    `DELETE FROM notifications
     WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return true;
}

module.exports = {
  getNotificationsByUser,
  getUnreadCount,
  getNotificationById,
  createNotification,
  createNotificationSafely,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
