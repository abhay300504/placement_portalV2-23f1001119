const API_BASE = 'http://localhost:5000/api';
axios.defaults.baseURL = API_BASE;

axios.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = 'Bearer ' + t;
  return cfg;
});

const store = Vue.reactive({
  token:  localStorage.getItem('token') || null,
  user:   JSON.parse(localStorage.getItem('user')  || 'null'),
  toasts: [],

  // Both isAuthenticated and isLoggedIn work (used in different places)
  get isAuthenticated() { return !!this.token; },
  get isLoggedIn()      { return !!this.token; },
  get role()            { return this.user?.role || null; },

  async login(email, password) {
    const res = await axios.post('/auth/login', { email, password });
    // Backend returns "token" field (not access_token)
    this.token = res.data.token || res.data.access_token;
    this.user  = { id: res.data.user_id, role: res.data.role, email: email };
    localStorage.setItem('token', this.token);
    localStorage.setItem('user',  JSON.stringify(this.user));
    return res.data;
  },

  logout(router) {
    this.token = null; this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (router) router.push('/login');
  },

  success(msg) { this._toast(msg, 'success'); },
  error(msg)   { this._toast(msg, 'error'); },
  info(msg)    { this._toast(msg, 'info'); },
  _toast(message, type) {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 3500);
  }
});

// Shared state for passing drive data between components
const sharedState = {
  selectedDrive: null
};

const api = {
  // Admin
  adminDashboard:     ()        => axios.get('/admin/dashboard'),
  adminStudents:      (p)       => axios.get('/admin/students',     { params: p }),
  adminCompanies:     (p)       => axios.get('/admin/companies',    { params: p }),
  adminCompanyDetail: (id)      => axios.get(`/admin/companies/${id}`),
  adminDriveDetail:   (id)      => axios.get(`/admin/drives/${id}`),
  adminDrives:        (p)       => axios.get('/admin/drives',       { params: p }),
  adminApplications:  ()        => axios.get('/admin/applications'),
  updateCompanyStatus:(id, a)   => axios.put(`/admin/companies/${id}/status`, { action: a }),
  updateDriveStatus:  (id, a)   => axios.put(`/admin/drives/${id}/status`,    { action: a }),
  blacklistStudent:   (id, v)   => axios.put(`/admin/students/${id}/blacklist`,  { blacklist: v }),
  adminUpdateStudent: (id, d)   => axios.put(`/admin/students/${id}`, d),
  blacklistCompany:   (id, v)   => axios.put(`/admin/companies/${id}/blacklist`, { blacklist: v }),

  // Company
  companyDashboard:    ()       => axios.get('/company/dashboard'),
  companyDrives:       ()       => axios.get('/company/drives'),
  companyProfile:      ()       => axios.get('/company/profile'),
  createDrive:         (d)      => axios.post('/company/drives', d),
  updateDrive:         (id, d)  => axios.put(`/company/drives/${id}`, d),
  deleteDrive:         (id)     => axios.delete(`/company/drives/${id}`),
  driveApplications:   (id)     => axios.get(`/company/drives/${id}/applications`),
  updateAppStatus:     (id, s)  => axios.put(`/company/applications/${id}/status`, { status: s }),
  updateCompanyProfile:(d)      => axios.put('/company/profile', d),

  // Student
  studentDashboard:    ()       => axios.get('/student/dashboard'),
  studentDrives:       ()       => axios.get('/student/drives'),
  studentApplications: ()       => axios.get('/student/applications'),
  studentProfile:      ()       => axios.get('/student/profile'),
  applyDrive:          (id)     => axios.post(`/student/drives/${id}/apply`),
  updateStudentProfile:(d)      => axios.put('/student/profile', d),
  uploadResume:        (fd)     => axios.post('/student/profile/resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};