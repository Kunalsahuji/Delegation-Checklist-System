import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/reminders';

export const crmFollowupApi = {
  getStats: () => axiosClient.get(`${BASE_URL}/stats`),
  listReminders: (params = {}) => axiosClient.get(BASE_URL, { params }),
  createReminder: (data) => axiosClient.post(BASE_URL, data),
  completeReminder: (id, data = {}) => axiosClient.post(`${BASE_URL}/${id}/complete`, data),
  rescheduleReminder: (id, data) => axiosClient.post(`${BASE_URL}/${id}/reschedule`, data),
  deleteReminder: (id) => axiosClient.delete(`${BASE_URL}/${id}`),
  listSpecialFollowups: (params = {}) => axiosClient.get(`${BASE_URL}/special`, { params }),
  toggleSpecialFollowup: (data) => axiosClient.post(`${BASE_URL}/special/toggle`, data),
};
