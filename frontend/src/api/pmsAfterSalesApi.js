import { axiosClient } from './axiosClient';

export const pmsAfterSalesApi = {
  // Overview KPIs
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/after-sales/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res.data;
  },

  // Paginated List
  listRecords: async (params = {}) => {
    const res = await axiosClient.get('/pms/after-sales', { params });
    return res.data;
  },

  // Single Record Detail
  getRecordById: async (id) => {
    const res = await axiosClient.get(`/pms/after-sales/${id}`);
    return res.data;
  },

  // Interlink handoff from Project
  createFromProject: async (projectId) => {
    const res = await axiosClient.post('/pms/after-sales/from-project', { projectId });
    return res.data;
  },

  // Update Section Data (warrantyClaims, amcVisits, customerSupport, feedback)
  updateSection: async (id, sectionKey, patch) => {
    const res = await axiosClient.put(`/pms/after-sales/section/${sectionKey}`, patch);
    return res.data;
  },

  // Complete Section
  completeSection: async (id, sectionKey, remarks = '') => {
    const res = await axiosClient.post(`/pms/after-sales/section/${sectionKey}/complete`, { remarks });
    return res.data;
  },

  // Request Management Approval
  requestApproval: async (id) => {
    const res = await axiosClient.post(`/pms/after-sales/${id}/request-approval`);
    return res.data;
  },

  // Management Decision Gate
  decideApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/after-sales/${id}/decide-approval`, payload);
    return res.data;
  },
};
