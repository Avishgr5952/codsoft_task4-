import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('markethub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // If response follows { statusCode, success, data, timestamp }, unwrap data
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError<any>) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

const http = {
  get: (url: string, config?: any): Promise<any> => apiClient.get(url, config) as any,
  post: (url: string, data?: any, config?: any): Promise<any> => apiClient.post(url, data, config) as any,
  patch: (url: string, data?: any, config?: any): Promise<any> => apiClient.patch(url, data, config) as any,
  put: (url: string, data?: any, config?: any): Promise<any> => apiClient.put(url, data, config) as any,
  delete: (url: string, config?: any): Promise<any> => apiClient.delete(url, config) as any,
};

export const api = {
  // Auth
  auth: {
    register: (data: any) => http.post('/auth/register', data),
    login: (data: any) => http.post('/auth/login', data),
    me: () => http.get('/auth/me'),
    forgotPassword: (data: any) => http.post('/auth/forgot-password', data),
    resetPassword: (data: any) => http.post('/auth/reset-password', data),
  },

  // Users
  users: {
    getProfile: () => http.get('/users/profile'),
    updateProfile: (data: any) => http.patch('/users/profile', data),
    getAll: (params?: any) => http.get('/users', { params }),
    updateRole: (id: string, role: string) => http.patch(`/users/${id}/role`, { role }),
    toggleStatus: (id: string, isActive: boolean) => http.patch(`/users/${id}/status`, { isActive }),
  },

  // Categories
  categories: {
    getAll: (includeInactive = false) => http.get('/categories', { params: { includeInactive } }),
    getBySlug: (slug: string) => http.get(`/categories/slug/${slug}`),
    create: (data: any) => http.post('/categories', data),
    update: (id: string, data: any) => http.patch(`/categories/${id}`, data),
    delete: (id: string) => http.delete(`/categories/${id}`),
  },

  // Products
  products: {
    getAll: (params?: any) => http.get('/products', { params }),
    getFeatured: () => http.get('/products/featured'),
    getDeals: () => http.get('/products/deals'),
    getByIdOrSlug: (idOrSlug: string) => http.get(`/products/${idOrSlug}`),
    compare: (ids: string[]) => http.get(`/products/compare?ids=${ids.join(',')}`),
    getVendorProducts: (params?: any) => http.get('/products/vendor/my-products', { params }),
    create: (data: any) => http.post('/products', data),
    update: (id: string, data: any) => http.patch(`/products/${id}`, data),
    delete: (id: string) => http.delete(`/products/${id}`),
  },

  // Inventory
  inventory: {
    getVendorInventory: (params?: any) => http.get('/inventory/vendor', { params }),
    update: (productId: string, data: any) => http.patch(`/inventory/${productId}`, data),
  },

  // Cart
  cart: {
    get: () => http.get('/cart'),
    addItem: (data: { productId: string; quantity: number }) => http.post('/cart/items', data),
    updateItem: (cartItemId: string, data: { quantity: number }) => http.patch(`/cart/items/${cartItemId}`, data),
    removeItem: (cartItemId: string) => http.delete(`/cart/items/${cartItemId}`),
    clear: () => http.delete('/cart'),
  },

  // Orders
  orders: {
    create: (data: any) => http.post('/orders', data),
    getMyOrders: () => http.get('/orders'),
    getById: (id: string) => http.get(`/orders/${id}`),
    getVendorOrders: (params?: any) => http.get('/orders/vendor', { params }),
    updateVendorOrderStatus: (vendorOrderId: string, data: any) => http.patch(`/orders/vendor/${vendorOrderId}/status`, data),
    getAllAdmin: (params?: any) => http.get('/orders/admin/all', { params }),
    updateStatusAdmin: (orderId: string, status: string) => http.patch(`/orders/admin/${orderId}/status`, { status }),
  },

  // Payments
  payments: {
    process: (data: any) => http.post('/payments/process', data),
    getByOrder: (orderId: string) => http.get(`/payments/order/${orderId}`),
  },

  // Coupons
  coupons: {
    validate: (data: { code: string; cartSubtotal: number }) => http.post('/coupons/validate', data),
    getVendorCoupons: () => http.get('/coupons/vendor'),
    create: (data: any) => http.post('/coupons', data),
    toggleStatus: (id: string) => http.patch(`/coupons/${id}/toggle`),
    delete: (id: string) => http.delete(`/coupons/${id}`),
  },

  // Reviews
  reviews: {
    getByProduct: (productId: string) => http.get(`/reviews/product/${productId}`),
    checkEligibility: (productId: string) => http.get(`/reviews/eligibility/${productId}`),
    create: (data: any) => http.post('/reviews', data),
    update: (id: string, data: any) => http.patch(`/reviews/${id}`, data),
    delete: (id: string) => http.delete(`/reviews/${id}`),
  },

  // Vendors
  vendors: {
    getBySlug: (slug: string) => http.get(`/vendors/store/${slug}`),
    getProfile: () => http.get('/vendors/profile'),
    updateProfile: (data: any) => http.patch('/vendors/profile', data),
    getDashboard: () => http.get('/vendors/dashboard'),
    getAllAdmin: (params?: any) => http.get('/vendors', { params }),
    updateStatusAdmin: (id: string, status: string) => http.patch(`/vendors/${id}/status`, { status }),
  },

  // Admin
  admin: {
    getDashboard: () => http.get('/admin/dashboard'),
    getSettings: () => http.get('/admin/settings'),
    updateSetting: (key: string, value: string, description?: string) =>
      http.put(`/admin/settings/${key}`, { value, description }),
  },

  // Delivery
  delivery: {
    getDashboard: () => http.get('/delivery/dashboard'),
    updateStatus: (deliveryId: string, data: any) => http.patch(`/delivery/deliveries/${deliveryId}/status`, data),
    assignDelivery: (data: any) => http.post('/delivery/assign', data),
    getAllPartners: () => http.get('/delivery/partners'),
  },

  // Notifications
  notifications: {
    getAll: () => http.get('/notifications'),
    getUnreadCount: () => http.get('/notifications/unread-count'),
    markAsRead: (id: string) => http.patch(`/notifications/${id}/read`),
    markAllAsRead: () => http.patch('/notifications/read-all'),
  },

  // Uploads
  uploads: {
    uploadImage: async (file: File, folder = 'products') => {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await http.post(`/uploads?folder=${folder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.url;
    },
  },
};
