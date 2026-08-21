import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', res.data.access);
          if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }
    return Promise.reject(error);
  }
);

interface RegisterData {
  email: string;
  full_name: string;
  phone_number?: string;
  password: string;
  password_confirm: string;
}

interface ProfileUpdateData {
  full_name?: string;
  phone_number?: string;
  avatar?: File;
}

interface PasswordChangeData {
  old_password: string;
  new_password: string;
}

interface EmailChangeData {
  current_password: string;
  new_email: string;
}

interface ComplaintListParams {
  page?: number;
  page_size?: number;
  status?: string;
  category?: string;
  ward?: string;
  search?: string;
}

interface ComplaintUpdateData {
  status?: string;
  assigned_to?: number | null;
  resolution_notes?: string;
}

interface FeedbackData {
  complaint: number;
  rating: number;
  comment?: string;
}

interface DateRangeParams {
  date_from?: string;
  date_to?: string;
}

interface TrendParams extends DateRangeParams {
  period?: string;
  days?: number;
}

export const authAPI = {
  register: (data: RegisterData) => api.post('/api/auth/register/', data),
  login: (data: { email: string; password: string }) => api.post('/api/auth/login/', data),
  getProfile: () => api.get('/api/auth/profile/'),
  updateProfile: (data: ProfileUpdateData) => {
    if (data.avatar) {
      const formData = new FormData();
      if (data.full_name !== undefined) formData.append('full_name', data.full_name);
      if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number);
      formData.append('avatar', data.avatar);
      return api.patch('/api/auth/profile/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.patch('/api/auth/profile/', data);
  },
  changePassword: (data: PasswordChangeData) => api.post('/api/auth/change-password/', data),
  changeEmail: (data: EmailChangeData) => api.post('/api/auth/change-email/', data),
  requestPasswordReset: (email: string) => api.post('/api/auth/password-reset/', { email }),
  confirmPasswordReset: (data: { uid: string; token: string; new_password: string }) =>
    api.post('/api/auth/password-reset/confirm/', data),
};

export const notificationsAPI = {
  list: () => api.get('/api/notifications/'),
  unreadCount: () => api.get('/api/notifications/unread-count/'),
  markRead: (id: number) => api.post(`/api/notifications/${id}/read/`),
  markAllRead: () => api.post('/api/notifications/read-all/'),
};

export const complaintsAPI = {
  list: (params?: ComplaintListParams) => api.get('/api/complaints/', { params }),
  create: (data: FormData) => api.post('/api/complaints/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  get: (id: number) => api.get(`/api/complaints/${id}/`),
  update: (id: number, data: ComplaintUpdateData) => api.patch(`/api/complaints/${id}/update/`, data),
  getCategories: () => api.get('/api/complaints/categories/'),
  getWards: () => api.get('/api/complaints/wards/'),
  submitFeedback: (data: FeedbackData) => api.post('/api/complaints/feedback/', data),
};

export const analyticsAPI = {
  getSummary: (params?: DateRangeParams) => api.get('/api/analytics/summary/', { params }),
  getByCategory: (params?: DateRangeParams) => api.get('/api/analytics/by-category/', { params }),
  getByWard: (params?: DateRangeParams) => api.get('/api/analytics/by-ward/', { params }),
  getByStatus: (params?: DateRangeParams) => api.get('/api/analytics/by-status/', { params }),
  getTrends: (params?: TrendParams) => api.get('/api/analytics/trends/', { params }),
  getServicePerformance: (params?: DateRangeParams) => api.get('/api/analytics/service-performance/', { params }),
  getByOfficial: (params?: DateRangeParams) => api.get('/api/analytics/by-official/', { params }),
  exportCSV: (params?: DateRangeParams) => api.get('/api/analytics/export/csv/', { params, responseType: 'blob' }),
};

interface UserUpdateData {
  role?: string;
  departments?: number[];
  is_active?: boolean;
}

interface UserCreateData {
  email: string;
  full_name: string;
  phone_number?: string;
  password: string;
  role: string;
  departments?: number[];
  is_active?: boolean;
}

export const usersAPI = {
  list: (params?: Record<string, string | number>) => api.get('/api/auth/users/', { params }),
  get: (id: number) => api.get(`/api/auth/users/${id}/`),
  create: (data: UserCreateData) => api.post('/api/auth/users/', data),
  update: (id: number, data: UserUpdateData) => api.patch(`/api/auth/users/${id}/`, data),
  delete: (id: number) => api.delete(`/api/auth/users/${id}/`),
};

export const evaluationAPI = {
  submit: (data: Record<string, string | number | boolean>) => api.post('/api/evaluation/submit/', data),
  check: () => api.get('/api/evaluation/check/'),
  getList: () => api.get('/api/evaluation/list/'),
  getAnalytics: () => api.get('/api/evaluation/analytics/'),
  exportExcel: () => api.get('/api/evaluation/export/', { responseType: 'blob' }),
};

export const aiAPI = {
  suggestCategory: (data: { title: string; description: string }) =>
    api.post('/api/ai/suggest-category/', data),
  analyzePriority: (data: { title: string; description: string; category: string }) =>
    api.post('/api/ai/analyze-priority/', data),
  draftResponse: (data: { title: string; description: string; status: string; category: string }) =>
    api.post('/api/ai/draft-response/', data),
  chat: (message: string) => api.post('/api/ai/chat/', { message }),
};

export default api;
