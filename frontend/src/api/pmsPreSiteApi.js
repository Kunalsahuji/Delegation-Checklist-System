import { axiosClient } from './axiosClient';

export const pmsPreSiteApi = {
  // Overview KPIs
  getKPIs: async (projectId = '') => {
    const res = await axiosClient.get('/pms/pre-site-start/kpis', {
      params: projectId ? { projectId } : {},
    });
    return res;
  },

  // Paginated List
  listRecords: async (params = {}) => {
    const res = await axiosClient.get('/pms/pre-site-start', { params });
    return res;
  },

  // Single Record Detail
  getRecordById: async (id) => {
    const res = await axiosClient.get(`/pms/pre-site-start/${id}`);
    return res;
  },

  // Interlink handoff from Project
  createFromProject: async (projectId) => {
    const res = await axiosClient.post('/pms/pre-site-start/from-project', { projectId });
    return res;
  },

  // Update Section Data (contractorSelection, rateFinalization, workOrder, siteSetup)
  updateSection: async (id, section, patch) => {
    const res = await axiosClient.put(`/pms/pre-site-start/${id}/sections/${section}`, patch);
    return res;
  },

  // Complete Section
  completeSection: async (id, section) => {
    const res = await axiosClient.post(`/pms/pre-site-start/${id}/sections/${section}/complete`);
    return res;
  },

  // Request Management Approval
  requestApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/pre-site-start/${id}/request-approval`, payload);
    return res;
  },

  // Management Decision Gate
  decideApproval: async (id, payload) => {
    const res = await axiosClient.post(`/pms/pre-site-start/${id}/decide`, payload);
    return res;
  },
};
