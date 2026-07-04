import axiosClient from './axiosClient';

export async function getUsers() {
  const { data } = await axiosClient.get('/users');
  return data.users || [];
}

export async function createUser(payload) {
  const { data } = await axiosClient.post('/users', payload);
  return data.user;
}

export async function updateUser(id, payload) {
  const { data } = await axiosClient.put(`/users/${id}`, payload);
  return data.user;
}

export async function resetUserPassword(id, payload) {
  const { data } = await axiosClient.patch(`/users/${id}/password`, payload);
  return data;
}
