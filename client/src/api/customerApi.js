import axiosClient from './axiosClient';

export async function getCustomers() {
  const { data } = await axiosClient.get('/customers');
  return data.customers || [];
}

export async function createCustomer(payload) {
  const { data } = await axiosClient.post('/customers', payload);
  return data.customer;
}

export async function updateCustomer(id, payload) {
  const { data } = await axiosClient.put(`/customers/${id}`, payload);
  return data.customer;
}

export async function deleteCustomer(id) {
  const { data } = await axiosClient.delete(`/customers/${id}`);
  return data;
}

export async function getCustomerFormOptions() {
  const [companiesResponse, usersResponse] = await Promise.all([
    axiosClient.get('/companies'),
    axiosClient.get('/users/assignees'),
  ]);

  return {
    companies: companiesResponse.data.companies || [],
    users: usersResponse.data.users || [],
  };
}
