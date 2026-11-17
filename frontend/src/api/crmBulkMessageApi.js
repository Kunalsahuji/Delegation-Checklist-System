import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/bulk-messages';

export const crmBulkMessageApi = {
  getKPIs: async () => {
    const res = await axiosClient.get(`${BASE_URL}/kpis`);
    return res.data;
  },

  getTemplates: async () => {
    const res = await axiosClient.get(`${BASE_URL}/templates`);
    return res.data;
  },

  previewAudience: async (selection) => {
    const res = await axiosClient.post(`${BASE_URL}/preview`, { selection });
    return res.data;
  },

  createCampaign: async (data) => {
    const res = await axiosClient.post(BASE_URL, data);
    return res.data;
  },

  listCampaigns: async (params = {}) => {
    const res = await axiosClient.get(BASE_URL, { params });
    return res.data;
  },

  getCampaignById: async (id) => {
    const res = await axiosClient.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  deleteCampaign: async (id) => {
    const res = await axiosClient.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};
