import { axiosClient } from './axiosClient';

export const pmsBaselineApi = {
  // Overview KPIs
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/baseline/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res.data;
  },

  // Paginated List
  listBaselines: async (params = {}) => {
    const res = await axiosClient.get('/pms/baseline', { params });
    return res.data;
  },

  // Single Baseline Detail
  getBaselineById: async (id) => {
    const res = await axiosClient.get(`/pms/baseline/${id}`);
    return res.data;
  },

  // Interlink handoff from Project
  createFromProject: async (projectId) => {
    const res = await axiosClient.post('/pms/baseline/from-project', { projectId });
    return res.data;
  },

  // Update Section Data (plannedMaterial, plannedLabour, plannedTimeline, plannedCashflow)
  updateSection: async (id, section, patch) => {
    const res = await axiosClient.put(`/pms/baseline/${id}/sections/${section}`, patch);
    return res.data;
  },

  // Complete Section
  completeSection: async (id, section) => {
    const res = await axiosClient.post(`/pms/baseline/${id}/sections/${section}/complete`);
    return res.data;
  },

  // Request Baseline Lock
  requestBaselineLock: async (id, payload) => {
    const res = await axiosClient.post(`/pms/baseline/${id}/request-lock`, payload);
    return res.data;
  },

  // Governance Baseline Lock
  lockBaseline: async (id, payload) => {
    const res = await axiosClient.post(`/pms/baseline/${id}/lock`, payload);
    return res.data;
  },
};
