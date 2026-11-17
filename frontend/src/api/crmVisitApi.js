import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/visits';

export const crmVisitApi = {
  getStats: () => axiosClient.get(`${BASE_URL}/stats`),
  listVisits: (params = {}) => axiosClient.get(BASE_URL, { params }),
  getVisitById: (id) => axiosClient.get(`${BASE_URL}/${id}`),
  createVisit: (data) => axiosClient.post(BASE_URL, data),
  updateVisit: (id, data) => axiosClient.patch(`${BASE_URL}/${id}`, data),
  deleteVisit: (id) => axiosClient.delete(`${BASE_URL}/${id}`),
};
