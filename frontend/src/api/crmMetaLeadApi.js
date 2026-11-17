import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/meta-leads';

export const crmMetaLeadApi = {
  getKPIs: async () => {
    const res = await axiosClient.get(`${BASE_URL}/kpis`);
    return res.data;
  },

  listLeads: async (params = {}) => {
    const res = await axiosClient.get(BASE_URL, { params });
    return res.data;
  },

  createLead: async (data) => {
    const res = await axiosClient.post(BASE_URL, data);
    return res.data;
  },

  syncLeads: async () => {
    const res = await axiosClient.post(`${BASE_URL}/sync`);
    return res.data;
  },

  assignLeads: async ({ leadIds, userIds }) => {
    const res = await axiosClient.post(`${BASE_URL}/assign`, { leadIds, userIds });
    return res.data;
  },

  skipLead: async (id, reason) => {
    const res = await axiosClient.patch(`${BASE_URL}/${id}/skip`, { reason });
    return res.data;
  },

  deleteLead: async (id) => {
    const res = await axiosClient.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};
