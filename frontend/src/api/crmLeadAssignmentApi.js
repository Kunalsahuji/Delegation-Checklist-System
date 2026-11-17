import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/lead-assignments';

export const crmLeadAssignmentApi = {
  getKPIs: async () => {
    const res = await axiosClient.get(`${BASE_URL}/kpis`);
    return res.data;
  },

  getWorkload: async () => {
    const res = await axiosClient.get(`${BASE_URL}/workload`);
    return res.data;
  },

  listLeads: async (params = {}) => {
    const res = await axiosClient.get(`${BASE_URL}/leads`, { params });
    return res.data;
  },

  assignLead: async (leadId, data) => {
    const res = await axiosClient.post(`${BASE_URL}/leads/${leadId}/assign`, data);
    return res.data;
  },

  unassignLead: async (leadId, data = {}) => {
    const res = await axiosClient.post(`${BASE_URL}/leads/${leadId}/unassign`, data);
    return res.data;
  },

  getLeadHistory: async (leadId) => {
    const res = await axiosClient.get(`${BASE_URL}/leads/${leadId}/history`);
    return res.data;
  },

  bulkAssign: async (data) => {
    const res = await axiosClient.post(`${BASE_URL}/bulk-assign`, data);
    return res.data;
  },

  autoDistribute: async (data = {}) => {
    const res = await axiosClient.post(`${BASE_URL}/auto-distribute`, data);
    return res.data;
  },
};
