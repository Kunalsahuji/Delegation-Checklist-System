import { axiosClient } from '../../../api/axiosClient';

const cleanParams = (params = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== null && v !== undefined) {
      out[k] = v;
    }
  }
  return out;
};

export const checklistApi = {
  // Occurrences (Items to tick)
  listOccurrences: (params = {}) =>
    axiosClient.get('/checklist/occurrences', { params: cleanParams(params) }),
  getOccurrences: (params = {}) =>
    axiosClient.get('/checklist/occurrences', { params: cleanParams(params) }),
  getStats: (params = {}) =>
    axiosClient.get('/checklist/occurrences/stats', { params: cleanParams(params) }),
  setStatus: (id, status, remarks = '') =>
    axiosClient.patch(`/checklist/occurrences/${id}/status`, { status, remarks }),
  completeOccurrence: (id) =>
    axiosClient.patch(`/checklist/occurrences/${id}/status`, { status: 'done' }),
  skipOccurrence: (id, data = {}) =>
    axiosClient.patch(`/checklist/occurrences/${id}/status`, { status: 'skipped', remarks: data.reason || 'Skipped' }),
  reportProgress: (id, note, expectedDate) =>
    axiosClient.post(`/checklist/occurrences/${id}/progress`, { note, expectedDate }),
  reportDelay: (id, data = {}) =>
    axiosClient.post(`/checklist/occurrences/${id}/progress`, { note: data.remarks || data.note, expectedDate: data.expectedDate }),
  reassignItem: (id, toUserId, reason = '') =>
    axiosClient.post(`/checklist/occurrences/${id}/reassign`, { toUserId, reason }),
  reassignOccurrence: (id, data = {}) =>
    axiosClient.post(`/checklist/occurrences/${id}/reassign`, { toUserId: data.toUserId, reason: data.reason || '' }),

  // Weekly Performance Report
  getWeeklyReport: (params = {}) =>
    axiosClient.get('/checklist/report/weekly', { params: cleanParams(params) }),
  saveWeeklyPlan: (data) =>
    axiosClient.post('/checklist/report/weekly/plan', data),

  // Task definitions (Setup)
  listTasks: (params = {}) =>
    axiosClient.get('/checklist/tasks', { params: cleanParams(params) }),
  getTask: (id) => axiosClient.get(`/checklist/tasks/${id}`),
  createTask: (data) => axiosClient.post('/checklist/tasks', data),
  updateTask: (id, data) => axiosClient.patch(`/checklist/tasks/${id}`, data),
  toggleTaskActive: (id) => axiosClient.patch(`/checklist/tasks/${id}/active`),
  deleteTask: (id) => axiosClient.delete(`/checklist/tasks/${id}`),
  addComment: (id, data) => axiosClient.post(`/checklist/tasks/${id}/comment`, data),
  addAttachment: (id, data) => axiosClient.post(`/checklist/tasks/${id}/attachment`, data),
  previewDates: (data) => axiosClient.post('/checklist/tasks/preview', data),
};
