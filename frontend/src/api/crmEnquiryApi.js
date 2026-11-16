import { axiosClient } from './axiosClient';

export const crmEnquiryApi = {
  getEnquiries: (params = {}) => axiosClient.get('/crm/enquiries', { params }),
  getEnquiry: (id) => axiosClient.get(`/crm/enquiries/${id}`),
  createEnquiry: (data) => axiosClient.post('/crm/enquiries', data),
  updateEnquiry: (id, data) => axiosClient.patch(`/crm/enquiries/${id}`, data),
  deleteEnquiry: (id) => axiosClient.delete(`/crm/enquiries/${id}`),

  // Workflow Actions
  addRemark: (id, text) => axiosClient.post(`/crm/enquiries/${id}/remarks`, { text }),
  qualifyEnquiry: (id, data) => axiosClient.post(`/crm/enquiries/${id}/qualify`, data),
  rejectEnquiry: (id, data) => axiosClient.post(`/crm/enquiries/${id}/reject`, data),
  toggleSpecialFollowup: (id) => axiosClient.post(`/crm/enquiries/${id}/special-followup`),
  checkPhone: (phone) => axiosClient.get('/crm/enquiries/check-phone', { params: { phone } }),
};
