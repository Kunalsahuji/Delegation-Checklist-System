import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/reminders';

export const crmFollowupApi = {
  getStats: async () => {
    const res = await axiosClient.get(`${BASE_URL}/stats`);
    return res.data;
  },

  listReminders: async (params = {}) => {
    const res = await axiosClient.get(BASE_URL, { params });
    return res.data;
  },

  createReminder: async (data) => {
    const res = await axiosClient.post(BASE_URL, data);
    return res.data;
  },

  completeReminder: async (id, data = {}) => {
    const res = await axiosClient.post(`${BASE_URL}/${id}/complete`, data);
    return res.data;
  },

  rescheduleReminder: async (id, data) => {
    const res = await axiosClient.post(`${BASE_URL}/${id}/reschedule`, data);
    return res.data;
  },

  deleteReminder: async (id) => {
    const res = await axiosClient.delete(`${BASE_URL}/${id}`);
    return res.data;
  },

  listSpecialFollowups: async (params = {}) => {
    const res = await axiosClient.get(`${BASE_URL}/special`, { params });
    return res.data;
  },

  toggleSpecialFollowup: async (data) => {
    const res = await axiosClient.post(`${BASE_URL}/special/toggle`, data);
    return res.data;
  },
};
