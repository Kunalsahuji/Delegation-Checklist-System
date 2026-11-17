import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/brokers';

export const crmBrokerApi = {
  getKPIs: () => axiosClient.get(`${BASE_URL}/kpis`),
  listBrokers: (params = {}) => axiosClient.get(BASE_URL, { params }),
  getBrokerById: (id) => axiosClient.get(`${BASE_URL}/${id}`),
  createBroker: (data) => axiosClient.post(BASE_URL, data),
  updateBroker: (id, data) => axiosClient.patch(`${BASE_URL}/${id}`, data),
  deleteBroker: (id) => axiosClient.delete(`${BASE_URL}/${id}`),
  getNetwork: () => axiosClient.get(`${BASE_URL}/network`),
};
