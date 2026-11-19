import { axiosClient } from './axiosClient';

export const pmsPlotApi = {
  getKPIs: (projectId = '') =>
    axiosClient.get('/pms/plots/kpis', { params: projectId ? { projectId } : {} }),

  listPlots: (params = {}) => axiosClient.get('/pms/plots', { params }),

  getPlotById: (id) => axiosClient.get(`/pms/plots/${id}`),

  createPlot: (payload) => axiosClient.post('/pms/plots', payload),

  updatePlot: (id, payload) => axiosClient.put(`/pms/plots/${id}`, payload),

  deletePlot: (id) => axiosClient.delete(`/pms/plots/${id}`),

  transitionStatus: (id, status, reason = '') =>
    axiosClient.post(`/pms/plots/${id}/transition`, { status, reason }),

  // Feasibility
  saveFeasibility: (plotId, payload) =>
    axiosClient.post(`/pms/feasibility/plot/${plotId}`, payload),

  decideFeasibility: (feasibilityId, payload) =>
    axiosClient.post(`/pms/feasibility/${feasibilityId}/decide`, payload),
};
