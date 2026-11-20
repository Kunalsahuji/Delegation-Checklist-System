import { axiosClient } from './axiosClient';

export const pmsProcurementApi = {
  // Overview KPIs
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/procurement/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res;
  },

  // Paginated List
  listRecords: async (params = {}) => {
    const res = await axiosClient.get('/pms/procurement', { params });
    return res;
  },

  // Single Record Detail
  getRecordById: async (id) => {
    const res = await axiosClient.get(`/pms/procurement/${id}`);
    return res;
  },

  // Interlink handoff from Project
  createFromProject: async (projectId) => {
    const res = await axiosClient.post('/pms/procurement/from-project', { projectId });
    return res;
  },

  // Update Section Data (vendorSelection, purchaseOrder, materialReceive, stockEntry)
  updateSection: async (id, section, patch) => {
    const res = await axiosClient.put(`/pms/procurement/${id}/sections/${section}`, patch);
    return res;
  },

  // Complete Section
  completeSection: async (id, section) => {
    const res = await axiosClient.post(`/pms/procurement/${id}/sections/${section}/complete`);
    return res;
  },

  // Request Management Approval
  requestApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/procurement/${id}/request-approval`, payload);
    return res;
  },

  // Management Decision Gate
  decideApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/procurement/${id}/decide`, payload);
    return res;
  },
};
