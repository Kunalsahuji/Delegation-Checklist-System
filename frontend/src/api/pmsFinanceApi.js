import { axiosClient } from './axiosClient';

export const pmsFinanceApi = {
  // Overview KPIs
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/finance/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res;
  },

  // Paginated List
  listRecords: async (params = {}) => {
    const res = await axiosClient.get('/pms/finance', { params });
    return res;
  },

  // Single Record Detail
  getRecordById: async (id) => {
    const res = await axiosClient.get(`/pms/finance/${id}`);
    return res;
  },

  // Interlink handoff from Project
  createFromProject: async (projectId) => {
    const res = await axiosClient.post('/pms/finance/from-project', { projectId });
    return res;
  },

  // Update Section Data (budgetVsActual, vendorPayments, contractorPayments, costAndProfit)
  updateSection: async (id, sectionKey, patch) => {
    const res = await axiosClient.put(`/pms/finance/${id}/section/${sectionKey}`, patch);
    return res;
  },

  // Complete Section
  completeSection: async (id, sectionKey, remarks = '') => {
    const res = await axiosClient.post(`/pms/finance/${id}/section/${sectionKey}/complete`, { remarks });
    return res;
  },

  // Request Management Approval
  requestApproval: async (id) => {
    const res = await axiosClient.post(`/pms/finance/${id}/request-approval`);
    return res;
  },

  // Management Decision Gate
  decideApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/finance/${id}/decide-approval`, payload);
    return res;
  },
};
