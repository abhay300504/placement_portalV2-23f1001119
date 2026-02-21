// ═══════════════════════════════════════════════════════════
//  STUDENT APPLICATIONS
// ═══════════════════════════════════════════════════════════

const StudentApplications = {
  name: 'StudentApplications',
  data() {
    return { applications: [], loading: true, exporting: false, statusFilter: '' };
  },
  async mounted() { await this.load(); },
  computed: {
    filtered() {
      return this.applications.filter(a => !this.statusFilter || a.status === this.statusFilter);
    },
    counts() {
      return {
        total: this.applications.length,
        applied: this.applications.filter(a => a.status === 'applied').length,
        shortlisted: this.applications.filter(a => a.status === 'shortlisted').length,
        selected: this.applications.filter(a => a.status === 'selected').length,
        rejected: this.applications.filter(a => a.status === 'rejected').length,
      };
    }
  },
  methods: {
    async load() {
      try {
        const res = await api.myApplications();
        this.applications = res.data;
      } catch (e) { store.error('Failed to load applications'); }
      finally { this.loading = false; }
    },
    async exportCSV() {
      this.exporting = true;
      try {
        await api.exportCSV();
        store.success('CSV export started! You will receive an email shortly.');
      } catch (e) {
        store.error(e.response?.data?.error || 'Export failed');
      } finally { this.exporting = false; }
    },
    statusBadge(s) {
      return { applied:'badge-applied', shortlisted:'badge-shortlisted', selected:'badge-selected', rejected:'badge-rejected' }[s] || '';
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">My Applications</div>
        <button class="btn-ghost" @click="exportCSV" :disabled="exporting">
          <i class="bi bi-download me-1"></i>
          {{ exporting ? 'Exporting...' : 'Export CSV' }}
        </button>
      </div>
      <div class="page-body">
        <!-- Summary Stats -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3" v-for="(val, key) in counts" :key="key">
            <div class="stat-card" style="padding:18px;">
              <div class="stat-value" style="font-size:1.8rem;">{{ val }}</div>
              <div class="stat-label">{{ key }}</div>
            </div>
          </div>
        </div>

        <!-- Filter -->
        <div class="card-dark mb-4">
          <div class="card-body-custom">
            <div class="row g-3 align-items-center">
              <div class="col-md-4">
                <select v-model="statusFilter" class="form-select-dark w-100">
                  <option value="">All Statuses</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div class="col d-flex align-items-center">
                <span style="color:var(--text-muted);font-size:0.85rem;">{{ filtered.length }} applications</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>

        <div v-if="!loading && applications.length===0" class="empty-state">
          <i class="bi bi-file-earmark-text"></i>
          <p>You haven't applied to any drives yet. <span style="color:var(--accent);cursor:pointer;" @click="$router.push('/student/drives')">Browse drives →</span></p>
        </div>

        <div class="card-dark" v-if="!loading && applications.length > 0">
          <div style="overflow-x:auto;">
            <table class="table-dark-custom">
              <thead>
                <tr><th>Company</th><th>Job Title</th><th>Applied On</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr v-if="filtered.length===0">
                  <td colspan="4" style="text-align:center;color:var(--text-muted);padding:40px;">No applications match this filter</td>
                </tr>
                <tr v-for="a in filtered" :key="a.id">
                  <td style="font-weight:600;">{{ a.company_name }}</td>
                  <td>{{ a.job_title }}</td>
                  <td style="font-size:0.82rem;color:var(--text-muted);">{{ formatDate(a.application_date) }}</td>
                  <td><span class="badge-custom" :class="statusBadge(a.status)">{{ a.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Export Info -->
        <div style="margin-top:16px;padding:14px;background:rgba(79,140,255,0.06);border:1px solid rgba(79,140,255,0.2);border-radius:10px;font-size:0.82rem;color:var(--text-muted);">
          <i class="bi bi-info-circle me-2" style="color:var(--accent);"></i>
          Click <strong style="color:var(--text);">Export CSV</strong> to download your full application history. The file will be emailed to your registered address.
        </div>
      </div>
    </div>
  `
};