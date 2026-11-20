import { axiosClient } from './axiosClient';

export const pmsPurchaseApi = {
  // KPI Overview
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/land-purchases/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res;
  },

  // Paginated List
  listPurchases: async (params = {}) => {
    const res = await axiosClient.get('/pms/land-purchases', { params });
    return res;
  },

  // Single Land Purchase Detail
  getPurchaseById: async (id) => {
    const res = await axiosClient.get(`/pms/land-purchases/${id}`);
    return res;
  },

  // Interlink handoff from Plot
  createFromPlot: async (plotId) => {
    const res = await axiosClient.post('/pms/land-purchases/from-plot', { plotId });
    return res;
  },

  // Update Section Items/Fields
  updateSection: async (id, section, patch) => {
    const res = await axiosClient.put(`/pms/land-purchases/${id}/sections/${section}`, patch);
    return res;
  },

  // Mark Section Completed
  completeSection: async (id, section, payload = {}) => {
    const res = await axiosClient.post(`/pms/land-purchases/${id}/sections/${section}/complete`, payload);
    return res;
  },

  // Decision Gate (Approved, Rejected)
  decide: async (id, payload) => {
    const res = await axiosClient.post(`/pms/land-purchases/${id}/decide`, payload);
    return res;
  },
};
