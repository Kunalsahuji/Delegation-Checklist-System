import { axiosClient } from './axiosClient';

export const crmProjectApi = {
  getProjects: (params = {}) => axiosClient.get('/crm/projects', { params }),
  getProject: (id) => axiosClient.get(`/crm/projects/${id}`),
  createProject: (data) => axiosClient.post('/crm/projects', data),
  updateProject: (id, data) => axiosClient.patch(`/crm/projects/${id}`, data),
  deleteProject: (id) => axiosClient.delete(`/crm/projects/${id}`),

  // Units / Inventory
  addUnit: (projectId, data) => axiosClient.post(`/crm/projects/${projectId}/units`, data),
  updateUnit: (projectId, unitId, data) => axiosClient.patch(`/crm/projects/${projectId}/units/${unitId}`, data),
  deleteUnit: (projectId, unitId) => axiosClient.delete(`/crm/projects/${projectId}/units/${unitId}`),
};
