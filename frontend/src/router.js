const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
  { path: '/',         redirect: '/login' },
  { path: '/login',    component: LoginPage,    meta: { public: true } },
  { path: '/register', component: RegisterPage, meta: { public: true } },

  // Admin
  { path: '/admin/dashboard',    component: AdminDashboard,    meta: { role: 'admin' } },
  { path: '/admin/companies',    component: AdminCompanies,    meta: { role: 'admin' } },
  { path: '/admin/students',     component: AdminStudents,     meta: { role: 'admin' } },
  { path: '/admin/drives',       component: AdminDrives,       meta: { role: 'admin' } },
  { path: '/admin/applications', component: AdminApplications, meta: { role: 'admin' } },
  { path: '/admin/search',       component: AdminSearch,       meta: { role: 'admin' } },
  { path: '/admin/companies/:id', component: AdminCompanyDetail, meta: { role: 'admin' } },
  { path: '/admin/students/:id',  component: AdminCompanyDetail,  meta: { role: 'admin' } },
  { path: '/admin/drives/:id',    component: AdminDriveDetail,   meta: { role: 'admin' } },
  { path: '/admin/companies/:id', component: AdminCompanyDetail, meta: { role: 'admin' } },
  { path: '/admin/students/:id',  component: AdminCompanyDetail,  meta: { role: 'admin' } },
  { path: '/admin/drives/:id',    component: AdminDriveDetail,   meta: { role: 'admin' } },

  // Company
  { path: '/company/dashboard',    component: CompanyDashboard,    meta: { role: 'company' } },
  { path: '/company/drives',       component: CompanyDrives,       meta: { role: 'company' } },
  { path: '/company/drives/create',component: CompanyDrives,       meta: { role: 'company' } },
  { path: '/company/applications', component: CompanyApplications, meta: { role: 'company' } },
  { path: '/company/profile',      component: CompanyProfile,      meta: { role: 'company' } },

  // Student
  { path: '/student/dashboard',    component: StudentDashboard,    meta: { role: 'student' } },
  { path: '/student/drives',       component: StudentDrives,       meta: { role: 'student' } },
  { path: '/student/drives/:id',    component: StudentDriveDetail,  meta: { role: 'student' } },
  { path: '/student/applications', component: StudentApplications, meta: { role: 'student' } },
  { path: '/student/profile',      component: StudentProfile,      meta: { role: 'student' } },

  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.meta.public) return next();
  if (!store.isAuthenticated) return next('/login');
  if (to.meta.role && store.role !== to.meta.role) return next('/' + store.role + '/dashboard');
  next();
});