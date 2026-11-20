import { axiosClient } from './axiosClient';

export const pmsControlApi = {
  // Overview KPIs
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/project-control/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res;
  },

  // Paginated List
  listRecords: async (params = {}) => {
    const res = await axiosClient.get('/pms/project-control', { params });
    return res;
  },

  // Single Record Detail
  getRecordById: async (id) => {
    const res = await axiosClient.get(`/pms/project-control/${id}`);
    return res;
  },

  // Interlink handoff from Project
  createFromProject: async (projectId) => {
    const res = await axiosClient.post('/pms/project-control/from-project', { projectId });
    return res;
  },

  // Update Section Data (costVariance, scheduleVariance, changeOrders, evmTracking)
  updateSection: async (id, sectionKey, patch) => {
    const res = await axiosClient.put(`/pms/project-control/section/${sectionKey}`, patch);
    return res;
  },

  // Complete Section
  completeSection: async (id, sectionKey, remarks = '') => {
    const res = await axiosClient.post(`/pms/project-control/section/${sectionKey}/complete`, { remarks });
    return res;
  },

  // Request Management Approval
  requestApproval: async (id) => {
    const res = await axiosClient.post(`/pms/project-control/${id}/request-approval`);
    return res;
  },

  // Management Decision Gate
  decideApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/project-control/${id}/decide-approval`, payload);
    return res;
  },
};
