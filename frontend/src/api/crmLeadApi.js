import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/leads';

export const crmLeadApi = {
  getStages: async () => {
    const res = await axiosClient.get(`${BASE_URL}/stages`);
    return res.data;
  },

  getLeads: async (params = {}) => {
    const res = await axiosClient.get(BASE_URL, { params });
    return res.data;
  },

  getLeadById: async (id) => {
    const res = await axiosClient.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  createLead: async (data) => {
    const res = await axiosClient.post(BASE_URL, data);
    return res.data;
  },

  convertEnquiry: async (enquiryId) => {
    const res = await axiosClient.post(`${BASE_URL}/convert-enquiry/${enquiryId}`);
    return res.data;
  },

  moveStage: async (id, data) => {
    const res = await axiosClient.post(`${BASE_URL}/${id}/move-stage`, data);
    return res.data;
  },

  undoStage: async (id) => {
    const res = await axiosClient.post(`${BASE_URL}/${id}/undo-stage`);
    return res.data;
  },

  markWon: async (id, data) => {
    const res = await axiosClient.post(`${BASE_URL}/${id}/mark-won`, data);
    return res.data;
  },

  markLost: async (id, data) => {
    const res = await axiosClient.post(`${BASE_URL}/${id}/mark-lost`, data);
    return res.data;
  },

  markDropped: async (id, data) => {
    const res = await axiosClient.post(`${BASE_URL}/${id}/mark-dropped`, data);
    return res.data;
  },
};
