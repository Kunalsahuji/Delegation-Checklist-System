import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/leads';

export const crmLeadApi = {
  getStages: (params = {}) => axiosClient.get(`${BASE_URL}/stages`, { params }),

  getLeads: (params = {}) => axiosClient.get(BASE_URL, { params }),

  getLeadById: (id) => axiosClient.get(`${BASE_URL}/${id}`),

  createLead: (data) => axiosClient.post(BASE_URL, data),

  convertEnquiry: (enquiryId) => axiosClient.post(`${BASE_URL}/convert-enquiry/${enquiryId}`),

  moveStage: (id, data) => axiosClient.post(`${BASE_URL}/${id}/move-stage`, data),

  undoStage: (id) => axiosClient.post(`${BASE_URL}/${id}/undo-stage`),

  markWon: (id, data) => axiosClient.post(`${BASE_URL}/${id}/mark-won`, data),

  markLost: (id, data) => axiosClient.post(`${BASE_URL}/${id}/mark-lost`, data),

  markDropped: (id, data) => axiosClient.post(`${BASE_URL}/${id}/mark-dropped`, data),
};
