import { axiosClient } from './axiosClient';

export const pmsPurchaseApi = {
  // KPI Overview
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/land-purchases/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res.data;
  },

  // Paginated List
  listPurchases: async (params = {}) => {
    const res = await axiosClient.get('/pms/land-purchases', { params });
    return res.data;
  },

  // Single Land Purchase Detail
  getPurchaseById: async (id) => {
    const res = await axiosClient.get(`/pms/land-purchases/${id}`);
    return res.data;
  },

  // Interlink handoff from Plot
  createFromPlot: async (plotId) => {
    const res = await axiosClient.post('/pms/land-purchases/from-plot', { plotId });
    return res.data;
  },

  // Update Section Data (Negotiation round, Registry witnesses, etc.)
  updateSection: async (id, section, patch) => {
    const res = await axiosClient.put(`/pms/land-purchases/${id}/sections/${section}`, patch);
    return res.data;
  },

  // Mark Section Completed
  completeSection: async (id, section) => {
    const res = await axiosClient.post(`/pms/land-purchases/${id}/sections/${section}/complete`);
    return res.data;
  },

  // Request Price Approval
  requestApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/land-purchases/${id}/request-approval`, payload);
    return res.data;
  },

  // Price Decision Gate
  decidePrice: async (id, payload) => {
    const res = await axiosClient.post(`/pms/land-purchases/${id}/decide-price`, payload);
    return res.data;
  },

  // Final Complete Purchase
  completePurchase: async (id, payload = {}) => {
    const res = await axiosClient.post(`/pms/land-purchases/${id}/complete`, payload);
    return res.data;
  },
};
