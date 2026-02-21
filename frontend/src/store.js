// ═══════════════════════════════════════════════════════════
//  GLOBAL STORE — manages auth state + API calls
// ═══════════════════════════════════════════════════════════

const API_BASE = 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE;

// Attach JWT token to every request if it exists
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global reactive store using Vue's reactivity
const store = Vue.reactive({
  // ── Auth State ──────────────────────────────────────────
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  toasts: [],

  // ── Computed helpers ────────────────────────────────────
  get isLoggedIn() { return !!this.token; },
  get role()       { return this.user?.role || null; },
  get isAdmin()    { return this.role === 'admin'; },
  get isCompany()  { return this.role === 'company'; },
  get isStudent()  { return this.role === 'student'; },

  // ── Auth actions ────────────────────────────────────────
  async login(email, password) {
    const res = await axios.post('/auth/login', { email, password });
    this.token = res.data.token;
    this.user  = { id: res.data.user_id, role: res.data.role, email };
    localStorage.setItem('token', this.token);
    localStorage.setItem('user', JSON.stringify(this.user));
    return res.data;
  },

  async logout(router) {
    this.token = null;
    this.user  = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (router) router.push('/login');
  },

  // ── Toast notifications ─────────────────────────────────
  addToast(message, type = 'info', duration = 3500) {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, duration);
  },
  success(msg) { this.addToast(msg, 'success'); },
  error(msg)   { this.addToast(msg, 'error'); },
  info(msg)    { this.addToast(msg, 'info'); },
});

// ── API helpers ─────────────────────────────────────────────
const api = {
  // Auth
  me:       ()   => axios.get('/auth/me'),

  // Admin
  adminDashboard:        ()         => axios.get('/admin/dashboard'),
  adminCompanies:        (params)   => axios.get('/admin/companies', { params }),
  adminStudents:         (params)   => axios.get('/admin/students', { params }),
  adminDrives:           (params)   => axios.get('/admin/drives', { params }),
  adminApplications:     ()         => axios.get('/admin/applications'),
  updateCompanyStatus:   (id, action) => axios.put(`/admin/companies/${id}/status`, { action }),
  blacklistCompany:      (id, v)    => axios.put(`/admin/companies/${id}/blacklist`, { blacklist: v }),
  blacklistStudent:      (id, v)    => axios.put(`/admin/students/${id}/blacklist`, { blacklist: v }),
  deactivateUser:        (id, v)    => axios.put(`/admin/users/${id}/deactivate`, { is_active: v }),
  updateDriveStatus:     (id, action) => axios.put(`/admin/drives/${id}/status`, { action }),

  // Company
  companyDashboard:      ()         => axios.get('/company/dashboard'),
  companyDrives:         ()         => axios.get('/company/drives'),
  createDrive:           (data)     => axios.post('/company/drives', data),
  driveApplications:     (id)       => axios.get(`/company/drives/${id}/applications`),
  updateAppStatus:       (id, status) => axios.put(`/company/applications/${id}/status`, { status }),
  updateCompanyProfile:  (data)     => axios.put('/company/profile', data),

  // Student
  studentDashboard:      ()         => axios.get('/student/dashboard'),
  studentDrives:         (params)   => axios.get('/student/drives', { params }),
  applyToDrive:          (id)       => axios.post(`/student/drives/${id}/apply`),
  myApplications:        ()         => axios.get('/student/applications'),
  updateStudentProfile:  (data)     => axios.put('/student/profile', data),
  uploadResume:          (formData) => axios.post('/student/profile/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' }}),
  exportCSV:             ()         => axios.post('/student/export-applications'),
};