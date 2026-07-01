import axiosClient from './axiosClient';

export async function getProducts() {
  const { data } = await axiosClient.get('/products');
  return data.products || [];
}

export async function createProduct(payload) {
  const { data } = await axiosClient.post('/products', payload);
  return data.product;
}

export async function updateProduct(id, payload) {
  const { data } = await axiosClient.put(`/products/${id}`, payload);
  return data.product;
}

export async function deleteProduct(id) {
  const { data } = await axiosClient.delete(`/products/${id}`);
  return data;
}
