import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/bulk-messages';

export const crmBulkMessageApi = {
  getKPIs: () => axiosClient.get(`${BASE_URL}/kpis`),
  getTemplates: () => axiosClient.get(`${BASE_URL}/templates`),
  previewAudience: (selection) => axiosClient.post(`${BASE_URL}/preview`, { selection }),
  createCampaign: (data) => axiosClient.post(BASE_URL, data),
  listCampaigns: (params = {}) => axiosClient.get(BASE_URL, { params }),
  getCampaignById: (id) => axiosClient.get(`${BASE_URL}/${id}`),
  deleteCampaign: (id) => axiosClient.delete(`${BASE_URL}/${id}`),
};
