import { axiosClient } from './axiosClient';

export const pmsPlanningApi = {
  // Overview KPIs
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/planning/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res;
  },

  // Paginated List
  listPlans: async (params = {}) => {
    const res = await axiosClient.get('/pms/planning', { params });
    return res;
  },

  // Single Plan Detail
  getPlanById: async (id) => {
    const res = await axiosClient.get(`/pms/planning/${id}`);
    return res;
  },

  // Interlink handoff from Project
  createFromProject: async (projectId) => {
    const res = await axiosClient.post('/pms/planning/from-project', { projectId });
    return res;
  },

  // Update Section Data (Survey, Layout, Roads, Amenities, Plots/Villas, Budget)
  updateSection: async (id, section, patch) => {
    const res = await axiosClient.put(`/pms/planning/${id}/sections/${section}`, patch);
    return res;
  },

  // Complete Section
  completeSection: async (id, section) => {
    const res = await axiosClient.post(`/pms/planning/${id}/sections/${section}/complete`);
    return res;
  },

  // Request Management Approval
  requestApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/planning/${id}/request-approval`, payload);
    return res;
  },

  // Management Decision Gate
  decideApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/planning/${id}/decide`, payload);
    return res;
  },
};
