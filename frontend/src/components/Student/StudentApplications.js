const StudentApplications = {
  name: 'StudentApplications',
  data() { return { applications: [], loading: true, statusFilter: 'All' }; },
  async mounted() { await this.load(); },
  computed: {
    filtered() {
      if (this.statusFilter === 'All') return this.applications;
      return this.applications.filter(a => a.status.toLowerCase() === this.statusFilter.toLowerCase());
    }
  },
  methods: {
    async load() {
      try { const r = await api.studentApplications(); this.applications = r.data || []; }
      catch(e) { store.error('Failed to load applications'); }
      finally { this.loading = false; }
    },
    fdate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    },
    badge(s) {
      return { applied:'badge badge-blue', shortlisted:'badge badge-purple', selected:'badge badge-green', rejected:'badge badge-red' }[s] || 'badge badge-gray';
    },
    remark(s) {
      return {
        applied:     'Application submitted, awaiting review',
        shortlisted: '🎯 Congratulations! You have been shortlisted',
        selected:    '🎉 You have been selected!',
        rejected:    'Better luck next time'
      }[s] || '—';
    },
    countFor(status) {
      if (status === 'All') return this.applications.length;
      return this.applications.filter(a => a.status.toLowerCase() === status.toLowerCase()).length;
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">My Applications</div>
            <div class="page-sub">Track all your placement applications</div>
          </div>
        </div>

        <div class="page-body">
          <!-- Filter Tabs - toggle style like screenshot -->
          <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
            <button v-for="tab in ['All','Applied','Shortlisted','Selected','Rejected']" :key="tab"
              @click="statusFilter = tab"
              :style="statusFilter === tab
                ? 'background:#5b21b6;color:white;border:1px solid #5b21b6;border-radius:20px;padding:7px 20px;font-size:0.85rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;display:flex;align-items:center;gap:6px;'
                : 'background:white;color:#374151;border:1px solid #e5e7eb;border-radius:20px;padding:7px 20px;font-size:0.85rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;display:flex;align-items:center;gap:6px;'">
              {{ tab }}
            </button>
          </div>

          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>

          <div v-else-if="filtered.length === 0" style="text-align:center;padding:48px;color:#9ca3af;">
            <i class="bi bi-file-earmark-text" style="font-size:2.5rem;display:block;margin-bottom:12px;color:#d1d5db;"></i>
            No {{ statusFilter === 'All' ? '' : statusFilter.toLowerCase() }} applications yet.
            <span v-if="statusFilter==='All'" @click="$router.push('/student/drives')"
              style="color:#5b21b6;cursor:pointer;font-weight:600;margin-left:4px;">Browse drives →</span>
          </div>

          <div v-else class="card-box" style="overflow-x:auto;">
            <table class="data-table" style="width:100%;">
              <thead>
                <tr>
                  <th>DRIVE NO.</th>
                  <th>COMPANY</th>
                  <th>JOB TITLE</th>
                  <th>DATE</th>
                  <th>RESULT</th>
                  <th>REMARK</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in filtered" :key="a.id">
                  <td style="color:#9ca3af;font-weight:600;">{{ 1000 + a.drive_id }}</td>
                  <td style="font-weight:700;color:#1a1d23;">{{ a.company_name }}</td>
                  <td style="color:#374151;">{{ a.job_title }}</td>
                  <td style="font-size:0.82rem;color:#6b7280;">{{ fdate(a.application_date) }}</td>
                  <td><span :class="badge(a.status)">{{ a.status }}</span></td>
                  <td style="font-size:0.82rem;color:#6b7280;max-width:220px;">{{ remark(a.status) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
};