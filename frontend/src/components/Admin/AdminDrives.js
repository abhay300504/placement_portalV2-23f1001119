// ═══════════════════════════════════════════════════════════
//  ADMIN DRIVES
// ═══════════════════════════════════════════════════════════

const AdminDrives = {
  name: 'AdminDrives',
  data() {
    return { drives: [], loading: true, statusFilter: '' };
  },
  async mounted() { await this.load(); },
  computed: {
    filtered() {
      return this.drives.filter(d => !this.statusFilter || d.status === this.statusFilter);
    }
  },
  methods: {
    async load() {
      try {
        const res = await api.adminDrives({ status: this.statusFilter });
        this.drives = res.data;
      } catch (e) { store.error('Failed to load drives'); }
      finally { this.loading = false; }
    },
    async updateStatus(id, action) {
      try {
        await api.updateDriveStatus(id, action);
        store.success(`Drive ${action}d`);
        await this.load();
      } catch (e) { store.error(e.response?.data?.error || 'Failed'); }
    },
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
        <div class="topbar-title">Placement Drives</div>
      </div>
      <div class="page-body">
        <div class="card-dark mb-4">
          <div class="card-body-custom">
            <div class="row g-3 align-items-center">
              <div class="col-md-4">
                <select v-model="statusFilter" class="form-select-dark w-100" @change="load">
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div class="col-md-4 d-flex align-items-center">
                <span style="color:var(--text-muted);font-size:0.85rem;">{{ filtered.length }} drives</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>

        <div class="card-dark" v-if="!loading">
          <div style="overflow-x:auto;">
            <table class="table-dark-custom">
              <thead>
                <tr><th>Company</th><th>Job Title</th><th>Package</th><th>Deadline</th><th>Eligibility</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                <tr v-if="filtered.length===0">
                  <td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px;">No drives found</td>
                </tr>
                <tr v-for="d in filtered" :key="d.id">
                  <td style="font-weight:600;">{{ d.company_name }}</td>
                  <td>{{ d.job_title }}</td>
                  <td>
                    <span v-if="d.package_lpa" style="color:var(--success);font-weight:600;">₹{{ d.package_lpa }} LPA</span>
                    <span v-else style="color:var(--text-muted);">—</span>
                  </td>
                  <td style="font-size:0.82rem;">{{ formatDate(d.application_deadline) }}</td>
                  <td style="font-size:0.78rem;color:var(--text-muted);">
                    <div>CGPA: {{ d.eligibility_cgpa || 'Any' }}</div>
                    <div>Branch: {{ d.eligibility_branch || 'All' }}</div>
                  </td>
                  <td><span class="badge-custom" :class="statusBadge(d.status)">{{ d.status }}</span></td>
                  <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                      <button v-if="d.status==='pending'" class="btn-success-custom" @click="updateStatus(d.id,'approve')">Approve</button>
                      <button v-if="d.status==='pending'" class="btn-danger-custom" @click="updateStatus(d.id,'reject')">Reject</button>
                      <button v-if="d.status==='approved'" class="btn-ghost" style="font-size:0.78rem;padding:5px 10px;" @click="updateStatus(d.id,'close')">Close</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
};