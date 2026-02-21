// ═══════════════════════════════════════════════════════════
//  ADMIN APPLICATIONS
// ═══════════════════════════════════════════════════════════

const AdminApplications = {
  name: 'AdminApplications',
  data() {
    return { applications: [], loading: true, statusFilter: '' };
  },
  async mounted() { await this.load(); },
  computed: {
    filtered() {
      return this.applications.filter(a => !this.statusFilter || a.status === this.statusFilter);
    }
  },
  methods: {
    async load() {
      try {
        const res = await api.adminApplications();
        this.applications = res.data;
      } catch (e) { store.error('Failed to load applications'); }
      finally { this.loading = false; }
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    statusBadge(s) {
      return { applied: 'badge-applied', shortlisted: 'badge-shortlisted', selected: 'badge-selected', rejected: 'badge-rejected' }[s] || '';
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">All Applications</div>
      </div>
      <div class="page-body">
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

        <div class="card-dark" v-if="!loading">
          <div style="overflow-x:auto;">
            <table class="table-dark-custom">
              <thead>
                <tr><th>#</th><th>Student</th><th>Company</th><th>Drive</th><th>Applied On</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr v-if="filtered.length===0">
                  <td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">No applications found</td>
                </tr>
                <tr v-for="a in filtered" :key="a.id">
                  <td style="color:var(--text-muted);font-size:0.8rem;">{{ a.id }}</td>
                  <td style="font-weight:600;">{{ a.student_name }}</td>
                  <td>{{ a.company_name }}</td>
                  <td style="font-size:0.85rem;">{{ a.job_title }}</td>
                  <td style="font-size:0.82rem;color:var(--text-muted);">{{ formatDate(a.application_date) }}</td>
                  <td><span class="badge-custom" :class="statusBadge(a.status)">{{ a.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
};