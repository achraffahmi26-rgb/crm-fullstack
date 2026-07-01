const notificationService = require('../services/notificationService');
const { validateCreateNotification } = require('../validations/notificationValidation');

async function getNotifications(req, res) {
  try {
    const notifications = await notificationService.getNotificationsByUser(req.user.id);
    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch notifications', error: error.message });
  }
}

async function getUnreadCount(req, res) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    return res.json({ count });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch unread notifications count', error: error.message });
  }
}

async function createNotification(req, res) {
  const { errors, isValid } = validateCreateNotification(req.body);
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  try {
    const notification = await notificationService.createNotification(req.body, req.user.id);
    return res.status(201).json({ notification });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create notification', error: error.message });
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const existingNotification = await notificationService.getNotificationById(req.params.id, req.user.id);
    if (!existingNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const notification = await notificationService.markNotificationAsRead(req.params.id, req.user.id);
    return res.json({ notification });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to mark notification as read', error: error.message });
  }
}

async function markAllNotificationsAsRead(req, res) {
  try {
    await notificationService.markAllNotificationsAsRead(req.user.id);
    return res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to mark notifications as read', error: error.message });
  }
}

async function deleteNotification(req, res) {
  try {
    const existingNotification = await notificationService.getNotificationById(req.params.id, req.user.id);
    if (!existingNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notificationService.deleteNotification(req.params.id, req.user.id);
    return res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete notification', error: error.message });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
