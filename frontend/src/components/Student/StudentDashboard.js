const StudentDashboard = {
  name: 'StudentDashboard',
  data() { return { data: null, loading: true }; },
  async mounted() {
    try {
      const r = await api.studentDashboard();
      this.data = r.data;
    } catch(e) {
      store.error('Failed to load dashboard');
    } finally {
      this.loading = false;
    }
  },
  computed: {
    openDrives()    { return this.data?.open_drives || this.data?.drives_count || 0; },
    appCount()      { return this.data?.applications_count || this.data?.total_applications || 0; },
    selectedCount() { return this.data?.selected_count || this.data?.selected || 0; },
    companies()     { return this.data?.companies || []; },
    recentApps()    { return this.data?.recent_applications || []; },
    student()       { return this.data?.student || {}; }
  },
  methods: {
    fdate(d) {
      if (!d) return '—';
      const dt = new Date(d);
      return (dt.getDate()+'').padStart(2,'0') + '/' +
             (dt.getMonth()+1+'').padStart(2,'0') + '/' +
             String(dt.getFullYear()).slice(2);
    },
    badge(s) {
      return {
        applied:     'badge badge-blue',
        shortlisted: 'badge badge-purple',
        selected:    'badge badge-green',
        rejected:    'badge badge-red'
      }[s] || 'badge badge-gray';
    },
    viewDrive(company) {
      this.$router.push('/student/drives/' + company.drive_id);
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Welcome, {{ student.name || 'Student' }} 👋</div>
            <div class="page-sub" v-if="student.branch || student.cgpa">
              {{ student.branch || '' }}{{ student.branch && student.cgpa ? ' — ' : '' }}{{ student.cgpa ? 'CGPA : ' + student.cgpa : '' }}
            </div>
            <div class="page-sub" v-else>Explore drives and track your placement journey.</div>
          </div>
        </div>

        <div class="page-body">
          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>

          <template v-if="!loading && data">

            <!-- Resume Warning -->
            <div v-if="!student.resume_path"
              style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 18px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
              <span style="font-size:0.85rem;color:#d97706;"><i class="bi bi-exclamation-triangle-fill me-2"></i>Your resume is not uploaded.</span>
              <button @click="$router.push('/student/profile')"
                style="background:white;border:1px solid #fcd34d;border-radius:7px;padding:5px 14px;font-size:0.82rem;font-weight:600;color:#d97706;cursor:pointer;font-family:Inter,sans-serif;">
                Upload Now
              </button>
            </div>

            <!-- 3 Stat Cards -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">

              <div class="stat-card" style="padding:20px 24px;display:flex;align-items:center;gap:16px;">
                <div style="width:46px;height:46px;background:#ede9fe;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#5b21b6;flex-shrink:0;">
                  <i class="bi bi-briefcase-fill"></i>
                </div>
                <div>
                  <div style="font-size:2rem;font-weight:800;color:#1a1d23;line-height:1;">{{ openDrives }}</div>
                  <div style="font-size:0.8rem;color:#9ca3af;margin-top:4px;font-weight:500;">Open Drives</div>
                </div>
              </div>

              <div class="stat-card" style="padding:20px 24px;display:flex;align-items:center;gap:16px;">
                <div style="width:46px;height:46px;background:#ffedd5;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#c2410c;flex-shrink:0;">
                  <i class="bi bi-file-earmark-text-fill"></i>
                </div>
                <div>
                  <div style="font-size:2rem;font-weight:800;color:#1a1d23;line-height:1;">{{ appCount }}</div>
                  <div style="font-size:0.8rem;color:#9ca3af;margin-top:4px;font-weight:500;">Applications</div>
                </div>
              </div>

              <div class="stat-card" style="padding:20px 24px;display:flex;align-items:center;gap:16px;">
                <div style="width:46px;height:46px;background:#dcfce7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#15803d;flex-shrink:0;">
                  <i class="bi bi-trophy-fill"></i>
                </div>
                <div>
                  <div style="font-size:2rem;font-weight:800;color:#1a1d23;line-height:1;">{{ selectedCount }}</div>
                  <div style="font-size:0.8rem;color:#9ca3af;margin-top:4px;font-weight:500;">Selected</div>
                </div>
              </div>

            </div>

            <!-- Organizations (Open Drives) -->
            <div class="card-box mb-4">
              <div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6;">
                <span style="font-weight:700;color:#1a1d23;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
                  <i class="bi bi-building" style="color:#5b21b6;"></i> Organizations (Open Drives)
                </span>
                <button @click="$router.push('/student/drives')"
                  style="background:white;border:1px solid #e5e7eb;border-radius:7px;padding:6px 14px;font-size:0.82rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;">
                  View All
                </button>
              </div>

              <div v-if="companies.length === 0" style="text-align:center;padding:32px;color:#9ca3af;">
                <i class="bi bi-building" style="font-size:2rem;display:block;margin-bottom:10px;color:#d1d5db;"></i>
                No open drives available right now.
              </div>

              <div v-else>
                <div v-for="c in companies" :key="c.id"
                  style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f9fafb;">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:38px;height:38px;background:#ede9fe;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#5b21b6;font-weight:800;font-size:0.95rem;flex-shrink:0;">
                      {{ (c.company_name||'C').charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div style="font-weight:700;font-size:0.9rem;color:#1a1d23;">{{ c.company_name }}</div>
                      <div style="font-size:0.78rem;color:#9ca3af;">{{ c.job_title || c.drive_count + ' drive(s)' }}</div>
                    </div>
                  </div>
                  <button @click="viewDrive(c)"
                    style="background:white;border:1px solid #5b21b6;color:#5b21b6;border-radius:7px;padding:6px 16px;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;">
                    View Details
                  </button>
                </div>
              </div>
            </div>

            <!-- Applied Drives -->
            <div class="card-box">
              <div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6;">
                <span style="font-weight:700;color:#1a1d23;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
                  <i class="bi bi-file-earmark-check" style="color:#5b21b6;"></i> Applied Drives
                </span>
                <button @click="$router.push('/student/applications')"
                  style="background:white;border:1px solid #e5e7eb;border-radius:7px;padding:6px 14px;font-size:0.82rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;">
                  History
                </button>
              </div>

              <div v-if="recentApps.length === 0" style="text-align:center;padding:32px;color:#9ca3af;">
                No applications yet.
                <span @click="$router.push('/student/drives')" style="color:#5b21b6;cursor:pointer;font-weight:600;margin-left:4px;">Browse drives →</span>
              </div>

              <div v-else style="overflow-x:auto;">
                <table class="data-table" style="width:100%;">
                  <thead>
                    <tr>
                      <th>SR NO.</th>
                      <th>DRIVE</th>
                      <th>COMPANY</th>
                      <th>DATE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(a, i) in recentApps" :key="a.id">
                      <td style="color:#9ca3af;font-weight:600;">{{ i + 1 }}</td>
                      <td style="font-weight:600;color:#1a1d23;">{{ a.job_title }}</td>
                      <td style="color:#374151;">{{ a.company_name }}</td>
                      <td style="font-size:0.82rem;color:#6b7280;">{{ fdate(a.application_date) }}</td>
                      <td><span :class="badge(a.status)">{{ a.status }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </template>
        </div>
      </div>
    </div>
  `
};