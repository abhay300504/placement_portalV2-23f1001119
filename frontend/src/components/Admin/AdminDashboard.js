const AdminDashboard = {
  name: 'AdminDashboard',
  data() {
    return {
      stats: null, companies: [], drives: [],
      loading: true, search: '', searchResults: null, searching: false,
      approvingDrive: null
    };
  },
  async mounted() {
    try {
      const [sr, sc, sd] = await Promise.all([
        api.adminDashboard(),
        api.adminCompanies(),
        api.adminDrives()
      ]);
      this.stats = sr.data;
      // Show all companies, most recent first
      this.companies = (sc.data || []).slice(0, 8);
      // Show recent drives (pending first, then rest)
      const all = sd.data || [];
      const pending = all.filter(d => d.status === 'pending');
      const others  = all.filter(d => d.status !== 'pending');
      this.drives = [...pending, ...others].slice(0, 8);
    } catch(e) {
      store.error('Failed to load dashboard');
    } finally { this.loading = false; }
  },
  computed: {
    pendingCompanies() { return this.companies.filter(c => c.approval_status === 'pending'); },
    pendingDrives()    { return this.drives.filter(d => d.status === 'pending'); }
  },
  methods: {
    async approveDrive(id) {
      this.approvingDrive = id;
      try {
        await api.updateDriveStatus(id, 'approve');
        const d = this.drives.find(x => x.id === id);
        if (d) d.status = 'approved';
        store.success('Drive approved!');
      } catch(e) { store.error('Failed'); }
      finally { this.approvingDrive = null; }
    },
    async rejectDrive(id) {
      this.approvingDrive = id;
      try {
        await api.updateDriveStatus(id, 'reject');
        const d = this.drives.find(x => x.id === id);
        if (d) d.status = 'rejected';
        store.success('Drive rejected.');
      } catch(e) { store.error('Failed'); }
      finally { this.approvingDrive = null; }
    },
    async approveCompany(id) {
      try {
        await api.updateCompanyStatus(id, 'approve');
        const c = this.companies.find(x => x.id === id);
        if (c) c.approval_status = 'approved';
        store.success('Company approved!');
      } catch(e) { store.error('Failed'); }
    },
    async rejectCompany(id) {
      try {
        await api.updateCompanyStatus(id, 'reject');
        const c = this.companies.find(x => x.id === id);
        if (c) c.approval_status = 'rejected';
        store.success('Company rejected.');
      } catch(e) { store.error('Failed'); }
    },
    companyBadge(s) {
      if (s === 'approved') return 'badge badge-green';
      if (s === 'rejected') return 'badge badge-red';
      return 'badge badge-orange';
    },
    driveBadge(s) {
      if (s === 'approved') return 'badge badge-green';
      if (s === 'rejected') return 'badge badge-red';
      if (s === 'closed')   return 'badge badge-gray';
      return 'badge badge-orange';
    },
    async doSearch() {
      if (!this.search.trim()) { this.searchResults = null; return; }
      this.searching = true;
      try {
        const [s, c] = await Promise.all([
          api.adminStudents({ search: this.search }),
          api.adminCompanies({ search: this.search })
        ]);
        this.searchResults = { students: s.data.slice(0,5), companies: c.data.slice(0,5) };
      } catch(e) { store.error('Search failed'); }
      finally { this.searching = false; }
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Welcome, Admin 👋</div>
            <div class="page-sub">Here's what's happening on your placement portal today.</div>
          </div>
          <div style="position:relative;">
            <i class="bi bi-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:0.85rem;"></i>
            <input v-model="search" @input="doSearch" placeholder="Search students, organizations..."
              style="border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px 8px 32px;font-size:0.85rem;font-family:Inter,sans-serif;outline:none;width:280px;"/>
          </div>
        </div>

        <div class="page-body">

          <!-- Search Results -->
          <div v-if="searchResults" class="card-box mb-4">
            <div style="padding:14px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f3f4f6;">
              <span style="font-weight:700;font-size:0.9rem;">Search Results</span>
              <button @click="searchResults=null;search=''" class="btn-view">Clear</button>
            </div>
            <div style="padding:16px 20px;">
              <div v-if="searchResults.students.length">
                <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;">Students</div>
                <div v-for="s in searchResults.students" :key="s.id" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f9fafb;">
                  <span style="font-weight:600;">{{ s.name }} <span style="color:#9ca3af;font-weight:400;">· {{ s.branch }}</span></span>
                  <button class="btn-view" @click="$router.push('/admin/students')">View</button>
                </div>
              </div>
              <div v-if="searchResults.companies.length" style="margin-top:12px;">
                <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;">Companies</div>
                <div v-for="c in searchResults.companies" :key="c.id" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f9fafb;">
                  <span style="font-weight:600;">{{ c.company_name }}</span>
                  <button class="btn-view" @click="$router.push('/admin/companies')">View</button>
                </div>
              </div>
              <div v-if="!searchResults.students.length && !searchResults.companies.length"
                style="text-align:center;color:#9ca3af;padding:20px;">No results found</div>
            </div>
          </div>

          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>

          <template v-if="!loading && stats">

            <!-- Pending Alerts -->
            <div v-if="pendingCompanies.length > 0"
              style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 18px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:0.86rem;color:#d97706;font-weight:600;">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                {{ pendingCompanies.length }} company approval{{ pendingCompanies.length > 1 ? 's' : '' }} waiting
              </span>
              <button @click="$router.push('/admin/companies')"
                style="background:#f59e0b;border:none;border-radius:7px;color:white;font-size:0.8rem;font-weight:700;padding:5px 14px;cursor:pointer;font-family:Inter,sans-serif;">
                Review
              </button>
            </div>
            <div v-if="pendingDrives.length > 0"
              style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:12px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:0.86rem;color:#ea580c;font-weight:600;">
                <i class="bi bi-briefcase me-2"></i>
                {{ pendingDrives.length }} placement drive{{ pendingDrives.length > 1 ? 's' : '' }} awaiting approval
              </span>
              <button @click="$router.push('/admin/drives')"
                style="background:#ea580c;border:none;border-radius:7px;color:white;font-size:0.8rem;font-weight:700;padding:5px 14px;cursor:pointer;font-family:Inter,sans-serif;">
                Review
              </button>
            </div>

            <!-- Stat Cards -->
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
              <div class="stat-card" style="padding:20px 22px;display:flex;align-items:center;gap:14px;">
                <div style="width:44px;height:44px;background:#ede9fe;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#5b21b6;flex-shrink:0;"><i class="bi bi-people-fill"></i></div>
                <div>
                  <div style="font-size:1.8rem;font-weight:800;color:#1a1d23;line-height:1;">{{ stats.total_students }}</div>
                  <div style="font-size:0.78rem;color:#9ca3af;margin-top:3px;">Total Students</div>
                </div>
              </div>
              <div class="stat-card" style="padding:20px 22px;display:flex;align-items:center;gap:14px;">
                <div style="width:44px;height:44px;background:#dcfce7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#15803d;flex-shrink:0;"><i class="bi bi-building"></i></div>
                <div>
                  <div style="font-size:1.8rem;font-weight:800;color:#1a1d23;line-height:1;">{{ stats.total_companies }}</div>
                  <div style="font-size:0.78rem;color:#9ca3af;margin-top:3px;">Total Companies</div>
                </div>
              </div>
              <div class="stat-card" style="padding:20px 22px;display:flex;align-items:center;gap:14px;">
                <div style="width:44px;height:44px;background:#ffedd5;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#c2410c;flex-shrink:0;"><i class="bi bi-briefcase-fill"></i></div>
                <div>
                  <div style="font-size:1.8rem;font-weight:800;color:#1a1d23;line-height:1;">{{ stats.total_drives }}</div>
                  <div style="font-size:0.78rem;color:#9ca3af;margin-top:3px;">Placement Drives</div>
                </div>
              </div>
              <div class="stat-card" style="padding:20px 22px;display:flex;align-items:center;gap:14px;">
                <div style="width:44px;height:44px;background:#dbeafe;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#1d4ed8;flex-shrink:0;"><i class="bi bi-file-earmark-text-fill"></i></div>
                <div>
                  <div style="font-size:1.8rem;font-weight:800;color:#1a1d23;line-height:1;">{{ stats.total_applications || 0 }}</div>
                  <div style="font-size:0.78rem;color:#9ca3af;margin-top:3px;">Total Applications</div>
                </div>
              </div>
            </div>

            <!-- Recent Companies -->
            <div class="card-box mb-4">
              <div style="padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6;">
                <span style="font-weight:700;color:#1a1d23;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
                  <i class="bi bi-building" style="color:#5b21b6;"></i> Recent Companies
                </span>
                <button @click="$router.push('/admin/companies')"
                  style="background:white;border:1px solid #e5e7eb;border-radius:7px;padding:5px 14px;font-size:0.82rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;">
                  View all
                </button>
              </div>
              <div v-if="companies.length === 0" style="text-align:center;padding:28px;color:#9ca3af;">No companies registered yet.</div>
              <table v-else class="data-table">
                <thead>
                  <tr>
                    <th>COMPANY</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in companies" :key="c.id">
                    <td>
                      <div style="font-weight:700;color:#1a1d23;">{{ c.company_name }}</div>
                      <div style="font-size:0.76rem;color:#9ca3af;">{{ c.email || c.hr_email || '' }}</div>
                    </td>
                    <td><span :class="companyBadge(c.approval_status)">{{ c.approval_status || 'pending' }}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;">
                        <template v-if="c.approval_status === 'pending'">
                          <button @click="approveCompany(c.id)" class="btn-approve" style="padding:4px 10px;font-size:0.78rem;">Approve</button>
                          <button @click="rejectCompany(c.id)" class="btn-reject" style="padding:4px 10px;font-size:0.78rem;">Reject</button>
                        </template>
                        <button @click="$router.push('/admin/companies/'+c.id)" class="btn-view" style="padding:4px 10px;font-size:0.78rem;">View</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Recent Drives -->
            <div class="card-box">
              <div style="padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6;">
                <span style="font-weight:700;color:#1a1d23;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
                  <i class="bi bi-briefcase" style="color:#5b21b6;"></i> Recent Drives
                </span>
                <button @click="$router.push('/admin/drives')"
                  style="background:white;border:1px solid #e5e7eb;border-radius:7px;padding:5px 14px;font-size:0.82rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;">
                  View all
                </button>
              </div>
              <div v-if="drives.length === 0" style="text-align:center;padding:28px;color:#9ca3af;">No drives yet.</div>
              <table v-else class="data-table">
                <thead>
                  <tr>
                    <th>DRIVE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in drives" :key="d.id">
                    <td>
                      <div style="font-weight:700;color:#1a1d23;">{{ d.job_title }}</div>
                      <div style="font-size:0.76rem;color:#9ca3af;">{{ d.company_name }}</div>
                    </td>
                    <td><span :class="driveBadge(d.status)">{{ d.status }}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;">
                        <template v-if="d.status === 'pending'">
                          <button @click="approveDrive(d.id)" :disabled="approvingDrive===d.id" class="btn-approve" style="padding:4px 10px;font-size:0.78rem;">Approve</button>
                          <button @click="rejectDrive(d.id)"  :disabled="approvingDrive===d.id" class="btn-reject"  style="padding:4px 10px;font-size:0.78rem;">Reject</button>
                        </template>
                        <button @click="$router.push('/admin/drives/'+d.id)" class="btn-view" style="padding:4px 10px;font-size:0.78rem;">View</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </template>
        </div>
      </div>
    </div>

        <!-- Company Detail Modal -->
        <div v-if="viewCompany" class="modal-overlay" @click.self="viewCompany=null">
          <div class="modal-box" style="max-width:520px;">
            <div class="modal-head">
              <span class="modal-title"><i class="bi bi-building me-2"></i>Company Details</span>
              <button @click="viewCompany=null" style="border:none;background:transparent;cursor:pointer;font-size:1.2rem;color:#6b7280;"><i class="bi bi-x"></i></button>
            </div>
            <div class="modal-body">
              <!-- Header -->
              <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:16px;background:#f5f3ff;border-radius:10px;">
                <div style="width:48px;height:48px;background:#ede9fe;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#5b21b6;font-weight:800;font-size:1.2rem;flex-shrink:0;">
                  {{ (viewCompany.company_name||'C').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div style="font-size:1.05rem;font-weight:800;color:#1a1d23;">{{ viewCompany.company_name }}</div>
                  <span :class="companyBadge(viewCompany.approval_status)" style="margin-top:4px;display:inline-block;">{{ viewCompany.approval_status }}</span>
                </div>
              </div>
              <!-- Info rows -->
              <div style="display:grid;gap:12px;">
                <div v-if="viewCompany.email||viewCompany.hr_email" style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-envelope" style="color:#5b21b6;width:18px;"></i>
                  <span style="font-size:0.88rem;color:#374151;">{{ viewCompany.email || viewCompany.hr_email }}</span>
                </div>
                <div v-if="viewCompany.hr_contact_name" style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-person" style="color:#5b21b6;width:18px;"></i>
                  <span style="font-size:0.88rem;color:#374151;">{{ viewCompany.hr_contact_name }}</span>
                </div>
                <div v-if="viewCompany.hr_phone" style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-telephone" style="color:#5b21b6;width:18px;"></i>
                  <span style="font-size:0.88rem;color:#374151;">{{ viewCompany.hr_phone }}</span>
                </div>
                <div v-if="viewCompany.website" style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-globe" style="color:#5b21b6;width:18px;"></i>
                  <a :href="viewCompany.website" target="_blank" style="font-size:0.88rem;color:#5b21b6;">{{ viewCompany.website }}</a>
                </div>
                <div v-if="viewCompany.description" style="display:flex;gap:10px;">
                  <i class="bi bi-info-circle" style="color:#5b21b6;width:18px;margin-top:2px;"></i>
                  <span style="font-size:0.88rem;color:#374151;line-height:1.6;">{{ viewCompany.description }}</span>
                </div>
                <div v-if="viewCompany.is_blacklisted" style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-slash-circle" style="color:#dc2626;width:18px;"></i>
                  <span style="font-size:0.88rem;color:#dc2626;font-weight:600;">Blacklisted</span>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button @click="viewCompany=null" class="btn-view">Close</button>
              <button @click="$router.push('/admin/companies');viewCompany=null"
                style="background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:700;padding:8px 20px;cursor:pointer;font-family:Inter,sans-serif;font-size:0.88rem;">
                Manage in Companies
              </button>
            </div>
          </div>
        </div>

        <!-- Drive Detail Modal -->
        <div v-if="viewDrive" class="modal-overlay" @click.self="viewDrive=null">
          <div class="modal-box" style="max-width:560px;">
            <div class="modal-head">
              <span class="modal-title"><i class="bi bi-briefcase me-2"></i>Drive Details</span>
              <button @click="viewDrive=null" style="border:none;background:transparent;cursor:pointer;font-size:1.2rem;color:#6b7280;"><i class="bi bi-x"></i></button>
            </div>
            <div class="modal-body">
              <!-- Header -->
              <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:16px;background:#f5f3ff;border-radius:10px;">
                <div style="width:48px;height:48px;background:#ede9fe;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#5b21b6;font-weight:800;font-size:1.2rem;flex-shrink:0;">
                  {{ (viewDrive.company_name||'D').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div style="font-size:1.05rem;font-weight:800;color:#1a1d23;">{{ viewDrive.job_title }}</div>
                  <div style="font-size:0.82rem;color:#6b7280;margin-top:2px;">{{ viewDrive.company_name }}</div>
                  <span :class="driveBadge(viewDrive.status)" style="margin-top:4px;display:inline-block;">{{ viewDrive.status }}</span>
                </div>
              </div>
              <!-- Info grid -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
                <div style="background:#fafafa;border-radius:8px;padding:12px;">
                  <div style="font-size:0.7rem;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:4px;">Package</div>
                  <div style="font-weight:700;color:#1a1d23;">{{ viewDrive.package_lpa ? viewDrive.package_lpa + ' LPA' : 'Not disclosed' }}</div>
                </div>
                <div style="background:#fafafa;border-radius:8px;padding:12px;">
                  <div style="font-size:0.7rem;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:4px;">Location</div>
                  <div style="font-weight:700;color:#1a1d23;">{{ viewDrive.location || '—' }}</div>
                </div>
                <div style="background:#fafafa;border-radius:8px;padding:12px;">
                  <div style="font-size:0.7rem;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:4px;">Deadline</div>
                  <div style="font-weight:700;color:#1a1d23;">{{ viewDrive.application_deadline ? new Date(viewDrive.application_deadline).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—' }}</div>
                </div>
                <div style="background:#fafafa;border-radius:8px;padding:12px;">
                  <div style="font-size:0.7rem;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:4px;">Min CGPA</div>
                  <div style="font-weight:700;color:#1a1d23;">{{ viewDrive.eligibility_cgpa || '—' }}</div>
                </div>
              </div>
              <div v-if="viewDrive.eligibility_branch" style="margin-bottom:12px;">
                <div style="font-size:0.7rem;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:4px;">Eligible Branches</div>
                <div style="font-size:0.88rem;color:#374151;">{{ viewDrive.eligibility_branch }}</div>
              </div>
              <div v-if="viewDrive.job_description" style="margin-bottom:4px;">
                <div style="font-size:0.7rem;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:4px;">Job Description</div>
                <div style="font-size:0.88rem;color:#374151;line-height:1.6;background:#fafafa;padding:10px;border-radius:8px;">{{ viewDrive.job_description }}</div>
              </div>
            </div>
            <div class="modal-foot">
              <button @click="viewDrive=null" class="btn-view">Close</button>
              <button @click="$router.push('/admin/drives');viewDrive=null"
                style="background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:700;padding:8px 20px;cursor:pointer;font-family:Inter,sans-serif;font-size:0.88rem;">
                Manage in Drives
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};