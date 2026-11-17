import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/calendar';

export const crmCalendarApi = {
  getActivities: async (params = {}) => {
    const res = await axiosClient.get(`${BASE_URL}/activities`, { params });
    return res.data;
  },
};
