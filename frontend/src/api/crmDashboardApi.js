import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/dashboard';

export const crmDashboardApi = {
  getDashboardData: async () => {
    const res = await axiosClient.get(BASE_URL);
    return res.data;
  },
};
