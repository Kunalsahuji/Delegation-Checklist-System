import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/visits';

export const crmVisitApi = {
  getStats: async () => {
    const res = await axiosClient.get(`${BASE_URL}/stats`);
    return res.data;
  },

  listVisits: async (params = {}) => {
    const res = await axiosClient.get(BASE_URL, { params });
    return res.data;
  },

  getVisitById: async (id) => {
    const res = await axiosClient.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  createVisit: async (data) => {
    const res = await axiosClient.post(BASE_URL, data);
    return res.data;
  },

  updateVisit: async (id, data) => {
    const res = await axiosClient.patch(`${BASE_URL}/${id}`, data);
    return res.data;
  },

  deleteVisit: async (id) => {
    const res = await axiosClient.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};
