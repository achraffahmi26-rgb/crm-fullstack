import axiosClient from './axiosClient';

export async function getPayments() {
  const { data } = await axiosClient.get('/payments');
  return data.payments || [];
}

export async function createPayment(payload) {
  const { data } = await axiosClient.post('/payments', payload);
  return data.payment;
}

export async function updatePayment(id, payload) {
  const { data } = await axiosClient.put(`/payments/${id}`, payload);
  return data.payment;
}

export async function deletePayment(id) {
  const { data } = await axiosClient.delete(`/payments/${id}`);
  return data;
}
