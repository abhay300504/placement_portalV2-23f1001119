// ═══════════════════════════════════════════════════════════
//  COMPANY DASHBOARD
// ═══════════════════════════════════════════════════════════

const CompanyDashboard = {
  name: 'CompanyDashboard',
  data() {
    return { data: null, loading: true };
  },
  async mounted() {
    try {
      const res = await api.companyDashboard();
      this.data = res.data;
    } catch (e) { store.error('Failed to load dashboard'); }
    finally { this.loading = false; }
  },
  methods: {
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    statusBadge(s) {
      return { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected', closed: 'badge-closed' }[s] || '';
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">Company Dashboard</div>
        <button class="btn-primary-custom" @click="$router.push('/company/drives')">
          <i class="bi bi-plus me-1"></i> Create Drive
        </button>
      </div>
      <div class="page-body">
        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>
        <template v-if="data">
          <!-- Company Info -->
          <div class="card-dark mb-4">
            <div class="card-body-custom">
              <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
                <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:1.5rem;font-weight:800;">
                  {{ data.company.company_name.charAt(0) }}
                </div>
                <div>
                  <div style="font-family:var(--font-head);font-size:1.4rem;font-weight:800;">{{ data.company.company_name }}</div>
                  <div style="color:var(--text-muted);font-size:0.85rem;margin-top:2px;">{{ data.company.email }}</div>
                  <div style="margin-top:8px;">
                    <span class="badge-custom" :class="data.company.approval_status==='approved'?'badge-approved':'badge-pending'">
                      {{ data.company.approval_status }}
                    </span>
                  </div>
                </div>
                <div style="margin-left:auto;display:flex;gap:24px;">
                  <div style="text-align:center;">
                    <div style="font-family:var(--font-head);font-size:1.8rem;font-weight:800;color:var(--accent);">{{ data.total_drives }}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">DRIVES</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-family:var(--font-head);font-size:1.8rem;font-weight:800;color:var(--success);">{{ data.total_applicants }}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">APPLICANTS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Drives List -->
          <div class="card-dark">
            <div class="card-header-custom">
              <span style="font-family:var(--font-head);font-weight:700;">My Placement Drives</span>
              <button class="btn-primary-custom" @click="$router.push('/company/drives')">Manage Drives</button>
            </div>
            <div style="overflow-x:auto;">
              <table class="table-dark-custom">
                <thead>
                  <tr><th>Job Title</th><th>Package</th><th>Deadline</th><th>Applicants</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr v-if="data.drives.length===0">
                    <td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">No drives created yet</td>
                  </tr>
                  <tr v-for="d in data.drives" :key="d.id">
                    <td style="font-weight:600;">{{ d.job_title }}</td>
                    <td style="color:var(--success);">{{ d.package_lpa ? '₹'+d.package_lpa+' LPA' : '—' }}</td>
                    <td style="font-size:0.82rem;">{{ formatDate(d.application_deadline) }}</td>
                    <td>
                      <span style="font-family:var(--font-head);font-weight:700;color:var(--accent);">{{ d.applicant_count }}</span>
                    </td>
                    <td><span class="badge-custom" :class="statusBadge(d.status)">{{ d.status }}</span></td>
                    <td>
                      <button class="btn-ghost" style="font-size:0.78rem;padding:5px 10px;" @click="$router.push('/company/applications')">
                        View Apps
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </div>
  `
};