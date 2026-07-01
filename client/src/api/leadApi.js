import axiosClient from './axiosClient';

export async function getLeads() {
  const { data } = await axiosClient.get('/leads');
  return data.leads || [];
}

export async function createLead(payload) {
  const { data } = await axiosClient.post('/leads', payload);
  return data.lead;
}

export async function updateLead(id, payload) {
  const { data } = await axiosClient.put(`/leads/${id}`, payload);
  return data.lead;
}

export async function deleteLead(id) {
  const { data } = await axiosClient.delete(`/leads/${id}`);
  return data;
}

export async function getLeadFormOptions() {
  const [companiesResponse, usersResponse] = await Promise.all([
    axiosClient.get('/companies'),
    axiosClient.get('/users'),
  ]);

  return {
    companies: companiesResponse.data.companies || [],
    users: usersResponse.data.users || [],
  };
}
