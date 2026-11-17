import { axiosClient } from './axiosClient';

const BASE_URL = '/crm/dashboard';

export const crmDashboardApi = {
  getDashboardData: () => axiosClient.get(BASE_URL),
};
