import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/lead-assignments';

export const crmLeadAssignmentApi = {
  getKPIs: () => axiosClient.get(`${BASE_URL}/kpis`),
  getWorkload: () => axiosClient.get(`${BASE_URL}/workload`),
  listLeads: (params = {}) => axiosClient.get(`${BASE_URL}/leads`, { params }),
  assignLead: (leadId, data) => axiosClient.post(`${BASE_URL}/leads/${leadId}/assign`, data),
  unassignLead: (leadId, data = {}) => axiosClient.post(`${BASE_URL}/leads/${leadId}/unassign`, data),
  getLeadHistory: (leadId) => axiosClient.get(`${BASE_URL}/leads/${leadId}/history`),
  bulkAssign: (data) => axiosClient.post(`${BASE_URL}/bulk-assign`, data),
  autoDistribute: (data = {}) => axiosClient.post(`${BASE_URL}/auto-distribute`, data),
};
