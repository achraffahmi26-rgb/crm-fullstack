import axiosClient from './axiosClient';

export async function getInvoices() {
  const { data } = await axiosClient.get('/invoices');
  return data.invoices || [];
}

export async function createInvoice(payload) {
  const { data } = await axiosClient.post('/invoices', payload);
  return data.invoice;
}

export async function updateInvoice(id, payload) {
  const { data } = await axiosClient.put(`/invoices/${id}`, payload);
  return data.invoice;
}

export async function deleteInvoice(id) {
  const { data } = await axiosClient.delete(`/invoices/${id}`);
  return data;
}
