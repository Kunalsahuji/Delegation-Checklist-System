import { axiosClient } from './axiosClient';

export const pmsProjectApi = {
  getKPIs: () => axiosClient.get('/pms/projects/kpis'),

  listProjects: (params = {}) => axiosClient.get('/pms/projects', { params }),

  getProjectById: (id) => axiosClient.get(`/pms/projects/${id}`),

  createProject: (payload) => axiosClient.post('/pms/projects', payload),

  updateProject: (id, payload) => axiosClient.put(`/pms/projects/${id}`, payload),

  deleteProject: (id) => axiosClient.delete(`/pms/projects/${id}`),

  toggleChecklistItem: (id, stageOrder, itemIndex) =>
    axiosClient.post(`/pms/projects/${id}/toggle-checklist`, { stageOrder, itemIndex }),

  advanceStage: (id) => axiosClient.post(`/pms/projects/${id}/advance-stage`),
};
