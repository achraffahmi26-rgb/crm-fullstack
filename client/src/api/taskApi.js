import axiosClient from './axiosClient';

export async function getTasks() {
  const { data } = await axiosClient.get('/tasks');
  return data.tasks || [];
}

export async function createTask(payload) {
  const { data } = await axiosClient.post('/tasks', payload);
  return data.task;
}

export async function updateTask(id, payload) {
  const { data } = await axiosClient.put(`/tasks/${id}`, payload);
  return data.task;
}

export async function deleteTask(id) {
  const { data } = await axiosClient.delete(`/tasks/${id}`);
  return data;
}

export async function getUsers() {
  const { data } = await axiosClient.get('/users');
  return data.users || [];
}
