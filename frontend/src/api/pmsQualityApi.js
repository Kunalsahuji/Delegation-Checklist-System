import { axiosClient } from './axiosClient';

export const pmsQualityApi = {
  // Overview KPIs
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/quality/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res.data;
  },

  // Paginated List
  listRecords: async (params = {}) => {
    const res = await axiosClient.get('/pms/quality', { params });
    return res.data;
  },

  // Single Record Detail
  getRecordById: async (id) => {
    const res = await axiosClient.get(`/pms/quality/${id}`);
    return res.data;
  },

  // Interlink handoff from Project
  createFromProject: async (projectId) => {
    const res = await axiosClient.post('/pms/quality/from-project', { projectId });
    return res.data;
  },

  // Update Section Data (stageInspection, engineerApproval, snagList, rectification)
  updateSection: async (id, sectionKey, patch) => {
    const res = await axiosClient.put(`/pms/quality/${id}/section/${sectionKey}`, patch);
    return res.data;
  },

  // Complete Section
  completeSection: async (id, sectionKey, remarks = '') => {
    const res = await axiosClient.post(`/pms/quality/${id}/section/${sectionKey}/complete`, { remarks });
    return res.data;
  },

  // Request Management Approval
  requestApproval: async (id) => {
    const res = await axiosClient.post(`/pms/quality/${id}/request-approval`);
    return res.data;
  },

  // Management Decision Gate
  decideApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/quality/${id}/decide-approval`, payload);
    return res.data;
  },
};
