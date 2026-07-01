import axiosClient from './axiosClient';

export async function getOrders() {
  const { data } = await axiosClient.get('/orders');
  return data.orders || [];
}

export async function getOrderById(id) {
  const { data } = await axiosClient.get(`/orders/${id}`);
  return data.order;
}

export async function createOrder(payload) {
  const { data } = await axiosClient.post('/orders', payload);
  return data.order;
}

export async function updateOrder(id, payload) {
  const { data } = await axiosClient.put(`/orders/${id}`, payload);
  return data.order;
}

export async function deleteOrder(id) {
  const { data } = await axiosClient.delete(`/orders/${id}`);
  return data;
}
