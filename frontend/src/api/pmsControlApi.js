import { axiosClient } from './axiosClient';

export const pmsControlApi = {
  // Overview KPIs
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/project-control/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res.data;
  },

  // Paginated List
  listRecords: async (params = {}) => {
    const res = await axiosClient.get('/pms/project-control', { params });
    return res.data;
  },

  // Single Record Detail
  getRecordById: async (id) => {
    const res = await axiosClient.get(`/pms/project-control/${id}`);
    return res.data;
  },

  // Interlink handoff from Project
  createFromProject: async (projectId) => {
    const res = await axiosClient.post('/pms/project-control/from-project', { projectId });
    return res.data;
  },

  // Update Section Data (materialVariance, labourVariance, timeVariance, costVariance)
  updateSection: async (id, sectionKey, patch) => {
    const res = await axiosClient.put(`/pms/project-control/${id}/section/${sectionKey}`, patch);
    return res.data;
  },

  // Complete Section
  completeSection: async (id, sectionKey, remarks = '') => {
    const res = await axiosClient.post(`/pms/project-control/${id}/section/${sectionKey}/complete`, { remarks });
    return res.data;
  },

  // Request Management Approval
  requestApproval: async (id) => {
    const res = await axiosClient.post(`/pms/project-control/${id}/request-approval`);
    return res.data;
  },

  // Management Decision Gate
  decideApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/project-control/${id}/decide-approval`, payload);
    return res.data;
  },
};
