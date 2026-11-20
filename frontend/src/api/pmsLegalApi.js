import { axiosClient } from './axiosClient';

export const pmsLegalApi = {
  // KPI Overview
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/legal-cases/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res;
  },

  // Paginated List
  listLegalCases: async (params = {}) => {
    const res = await axiosClient.get('/pms/legal-cases', { params });
    return res;
  },

  // Single Legal Case Detail
  getLegalCaseById: async (id) => {
    const res = await axiosClient.get(`/pms/legal-cases/${id}`);
    return res;
  },

  // Interlink handoff from Plot
  createFromPlot: async (plotId) => {
    const res = await axiosClient.post('/pms/legal-cases/from-plot', { plotId });
    return res;
  },

  // Update Lawyer / Notes
  updateLegalCase: async (id, data) => {
    const res = await axiosClient.put(`/pms/legal-cases/${id}`, data);
    return res;
  },

  // Update Section Items/Fields
  updateSection: async (id, section, patch) => {
    const res = await axiosClient.put(`/pms/legal-cases/${id}/sections/${section}`, patch);
    return res;
  },

  // Mark Section Completed
  completeSection: async (id, section, payload = {}) => {
    const res = await axiosClient.post(`/pms/legal-cases/${id}/sections/${section}/complete`, payload);
    return res;
  },

  // Decision Gate (Approved, Rejected, Clarification, Hold)
  decide: async (id, payload) => {
    const res = await axiosClient.post(`/pms/legal-cases/${id}/decide`, payload);
    return res;
  },
};
