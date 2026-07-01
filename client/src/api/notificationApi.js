import axiosClient from './axiosClient';

export async function getNotifications() {
  const { data } = await axiosClient.get('/notifications');
  return data.notifications || [];
}

export async function getUnreadNotificationsCount() {
  const { data } = await axiosClient.get('/notifications/unread-count');
  return data.count || 0;
}

export async function createNotification(payload) {
  const { data } = await axiosClient.post('/notifications', payload);
  return data.notification;
}

export async function markNotificationAsRead(id) {
  const { data } = await axiosClient.put(`/notifications/${id}/read`);
  return data.notification;
}

export async function markAllNotificationsAsRead() {
  const { data } = await axiosClient.put('/notifications/read-all');
  return data;
}

export async function deleteNotification(id) {
  const { data } = await axiosClient.delete(`/notifications/${id}`);
  return data;
}
