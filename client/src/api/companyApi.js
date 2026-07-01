import axiosClient from './axiosClient';

export async function getCompanies() {
  const { data } = await axiosClient.get('/companies');
  return data.companies || [];
}

export async function createCompany(payload) {
  const { data } = await axiosClient.post('/companies', payload);
  return data.company;
}

export async function updateCompany(id, payload) {
  const { data } = await axiosClient.put(`/companies/${id}`, payload);
  return data.company;
}

export async function deleteCompany(id) {
  const { data } = await axiosClient.delete(`/companies/${id}`);
  return data;
}
