import { axiosClient } from '../../../api/axiosClient';

const cleanParams = (params = {}) => {
  const cleaned = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

export const delegationApi = {
  getTasks: async (params = {}) => {
    const res = await axiosClient.get('/delegation', { params: cleanParams(params) });
    return res;
  },

  list: async (params = {}) => {
    const res = await axiosClient.get('/delegation', { params: cleanParams(params) });
    return res;
  },

  getStats: async (params = {}) => {
    const res = await axiosClient.get('/delegation/stats', { params: cleanParams(params) });
    return res?.data !== undefined ? res.data : res;
  },

  getTask: async (id) => {
    const res = await axiosClient.get(`/delegation/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  createTask: async (payload) => {
    const res = await axiosClient.post('/delegation', payload);
    return res?.data !== undefined ? res.data : res;
  },

  updateTask: async (id, payload) => {
    const res = await axiosClient.patch(`/delegation/${id}`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  deleteTask: async (id) => {
    const res = await axiosClient.delete(`/delegation/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  addComment: async (id, { text }) => {
    const res = await axiosClient.post(`/delegation/${id}/comment`, { text });
    return res?.data !== undefined ? res.data : res;
  },

  addAttachment: async (id, { name, size, url }) => {
    const res = await axiosClient.post(`/delegation/${id}/attachment`, { name, size, url });
    return res?.data !== undefined ? res.data : res;
  },

  reviseDate: async (id, { newDueDate, reason, kind = 'revise' }) => {
    const res = await axiosClient.post(`/delegation/${id}/revise`, { newDueDate, reason, kind });
    return res?.data !== undefined ? res.data : res;
  },

  setStatus: async (id, { status, cancelReason = '' }) => {
    const res = await axiosClient.patch(`/delegation/${id}/status`, { status, cancelReason });
    return res?.data !== undefined ? res.data : res;
  },

  reportProgress: async (id, { note, expectedDate }) => {
    const res = await axiosClient.post(`/delegation/${id}/progress`, { note, expectedDate });
    return res?.data !== undefined ? res.data : res;
  },

  reassign: async (id, { toUserId, reason = '' }) => {
    const res = await axiosClient.post(`/delegation/${id}/reassign`, { toUserId, reason });
    return res?.data !== undefined ? res.data : res;
  },

  addFollowUp: async (id, { note, nextOn = null }) => {
    const res = await axiosClient.post(`/delegation/${id}/follow-up`, { note, nextOn });
    return res?.data !== undefined ? res.data : res;
  },

  // Weekly Performance Report
  getWeeklyReport: async (params = {}) => {
    const res = await axiosClient.get('/delegation/report/weekly', { params: cleanParams(params) });
    return res?.data !== undefined ? res.data : res;
  },

  saveWeeklyPlan: async (data) => {
    const res = await axiosClient.post('/delegation/report/weekly/plan', data);
    return res?.data !== undefined ? res.data : res;
  },
};
