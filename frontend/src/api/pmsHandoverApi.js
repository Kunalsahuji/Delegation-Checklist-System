import { axiosClient } from './axiosClient';

export const pmsHandoverApi = {
  // Overview KPIs
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/handover/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res;
  },

  // Paginated List
  listRecords: async (params = {}) => {
    const res = await axiosClient.get('/pms/handover', { params });
    return res;
  },

  // Single Record Detail
  getRecordById: async (id) => {
    const res = await axiosClient.get(`/pms/handover/${id}`);
    return res;
  },

  // Interlink handoff from Project
  createFromProject: async (projectId) => {
    const res = await axiosClient.post('/pms/handover/from-project', { projectId });
    return res;
  },

  // Update Section Data (finalInspection, snagClosure, deepCleaning, customerHandover)
  updateSection: async (id, sectionKey, patch) => {
    const res = await axiosClient.put(`/pms/handover/${id}/section/${sectionKey}`, patch);
    return res;
  },

  // Complete Section
  completeSection: async (id, sectionKey, remarks = '') => {
    const res = await axiosClient.post(`/pms/handover/${id}/section/${sectionKey}/complete`, { remarks });
    return res;
  },

  // Request Management Approval
  requestApproval: async (id) => {
    const res = await axiosClient.post(`/pms/handover/${id}/request-approval`);
    return res;
  },

  // Management Decision Gate
  decideApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/handover/${id}/decide-approval`, payload);
    return res;
  },
};
