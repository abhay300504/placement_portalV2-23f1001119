// ═══════════════════════════════════════════════════════════
//  COMPANY APPLICATIONS
// ═══════════════════════════════════════════════════════════

const CompanyApplications = {
  name: 'CompanyApplications',
  data() {
    return {
      drives: [], selectedDriveId: '', applications: [],
      loading: false, drivesLoading: true
    };
  },
  async mounted() {
    try {
      const res = await api.companyDrives();
      this.drives = res.data;
      if (this.drives.length > 0) {
        this.selectedDriveId = this.drives[0].id;
        await this.loadApplications();
      }
    } catch (e) { store.error('Failed to load drives'); }
    finally { this.drivesLoading = false; }
  },
  methods: {
    async loadApplications() {
      if (!this.selectedDriveId) return;
      this.loading = true;
      try {
        const res = await api.driveApplications(this.selectedDriveId);
        this.applications = res.data;
      } catch (e) { store.error('Failed to load applications'); }
      finally { this.loading = false; }
    },
    async updateStatus(appId, status) {
      try {
        await api.updateAppStatus(appId, status);
        store.success(`Status updated to ${status}`);
        await this.loadApplications();
      } catch (e) { store.error('Failed to update status'); }
    },
    statusBadge(s) {
      return { applied: 'badge-applied', shortlisted: 'badge-shortlisted', selected: 'badge-selected', rejected: 'badge-rejected' }[s] || '';
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">Applications</div>
      </div>
      <div class="page-body">
        <!-- Drive Selector -->
        <div class="card-dark mb-4">
          <div class="card-body-custom">
            <div class="row g-3 align-items-center">
              <div class="col-md-5">
                <label class="form-label-dark">Select Drive</label>
                <select v-model="selectedDriveId" class="form-select-dark w-100" @change="loadApplications">
                  <option value="">Choose a drive...</option>
                  <option v-for="d in drives" :key="d.id" :value="d.id">{{ d.job_title }}</option>
                </select>
              </div>
              <div class="col d-flex align-items-end">
                <span v-if="applications.length" style="color:var(--text-muted);font-size:0.85rem;">
                  {{ applications.length }} applications
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="drivesLoading || loading" class="loading-center"><div class="spinner-ring"></div></div>

        <div v-if="!drivesLoading && drives.length===0" class="empty-state">
          <i class="bi bi-briefcase"></i>
          <p>No drives created yet.</p>
        </div>

        <div class="card-dark" v-if="!loading && selectedDriveId">
          <div style="overflow-x:auto;">
            <table class="table-dark-custom">
              <thead>
                <tr><th>Student</th><th>Applied On</th><th>Current Status</th><th>Update Status</th></tr>
              </thead>
              <tbody>
                <tr v-if="applications.length===0">
                  <td colspan="4" style="text-align:center;color:var(--text-muted);padding:40px;">No applications yet for this drive</td>
                </tr>
                <tr v-for="a in applications" :key="a.id">
                  <td>
                    <div style="font-weight:600;">{{ a.student_name }}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">ID: {{ a.student_id }}</div>
                    <a 
                      v-if="a.resume_path" 
                      :href="'http://127.0.0.1:5000/uploads/' + a.resume_path" 
                      target="_blank"
                      style="font-size:0.75rem;color:var(--accent);display:inline-flex;align-items:center;gap:4px;margin-top:4px;"
                    >
                      <i class="bi bi-file-earmark-pdf"></i> View Resume
                    </a>
                    <span v-else style="font-size:0.75rem;color:var(--text-muted);">No resume uploaded</span>
                  </td>
                  <td style="font-size:0.82rem;color:var(--text-muted);">{{ formatDate(a.application_date) }}</td>
                  <td><span class="badge-custom" :class="statusBadge(a.status)">{{ a.status }}</span></td>
                  <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                      <button v-for="s in ['shortlisted','selected','rejected']" :key="s"
                        class="btn-ghost"
                        style="font-size:0.75rem;padding:4px 10px;"
                        :style="a.status===s ? 'opacity:0.4;pointer-events:none;' : ''"
                        @click="updateStatus(a.id, s)">
                        {{ s.charAt(0).toUpperCase()+s.slice(1) }}
                      </button>
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