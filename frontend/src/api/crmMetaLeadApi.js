import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/meta-leads';

export const crmMetaLeadApi = {
  getKPIs: () => axiosClient.get(`${BASE_URL}/kpis`),
  listLeads: (params = {}) => axiosClient.get(BASE_URL, { params }),
  createLead: (data) => axiosClient.post(BASE_URL, data),
  syncLeads: () => axiosClient.post(`${BASE_URL}/sync`),
  assignLeads: (data) => axiosClient.post(`${BASE_URL}/assign`, data),
  skipLead: (id, reason) => axiosClient.patch(`${BASE_URL}/${id}/skip`, { reason }),
  deleteLead: (id) => axiosClient.delete(`${BASE_URL}/${id}`),
};
