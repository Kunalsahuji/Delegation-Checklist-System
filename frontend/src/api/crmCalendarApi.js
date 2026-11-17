import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/calendar';

export const crmCalendarApi = {
  getActivities: (params = {}) => axiosClient.get(`${BASE_URL}/activities`, { params }),
};
