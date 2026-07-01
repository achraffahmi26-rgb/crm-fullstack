import axiosClient from './axiosClient';

export async function getCategories() {
  const { data } = await axiosClient.get('/categories');
  return data.categories || [];
}
