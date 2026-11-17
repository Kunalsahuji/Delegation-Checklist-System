import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/brokers';

export const crmBrokerApi = {
  getKPIs: async () => {
    const res = await axiosClient.get(`${BASE_URL}/kpis`);
    return res.data;
  },

  listBrokers: async (params = {}) => {
    const res = await axiosClient.get(BASE_URL, { params });
    return res.data;
  },

  getBrokerById: async (id) => {
    const res = await axiosClient.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  createBroker: async (data) => {
    const res = await axiosClient.post(BASE_URL, data);
    return res.data;
  },

  updateBroker: async (id, data) => {
    const res = await axiosClient.patch(`${BASE_URL}/${id}`, data);
    return res.data;
  },

  deleteBroker: async (id) => {
    const res = await axiosClient.delete(`${BASE_URL}/${id}`);
    return res.data;
  },

  getNetwork: async () => {
    const res = await axiosClient.get(`${BASE_URL}/network`);
    return res.data;
  },
};
