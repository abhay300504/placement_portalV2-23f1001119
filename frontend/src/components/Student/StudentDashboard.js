// ═══════════════════════════════════════════════════════════
//  STUDENT DASHBOARD
// ═══════════════════════════════════════════════════════════

const StudentDashboard = {
  name: 'StudentDashboard',
  data() {
    return { data: null, loading: true };
  },
  async mounted() {
    try {
      const res = await api.studentDashboard();
      this.data = res.data;
    } catch (e) { store.error('Failed to load dashboard'); }
    finally { this.loading = false; }
  },
  methods: {
    statusBadge(s) {
      return { applied:'badge-applied', shortlisted:'badge-shortlisted', selected:'badge-selected', rejected:'badge-rejected' }[s] || '';
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    },
    daysLeft(deadline) {
      if (!deadline) return null;
      const diff = new Date(deadline) - new Date();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days;
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">Dashboard</div>
        <button class="btn-primary-custom" @click="$router.push('/student/drives')">
          <i class="bi bi-search me-1"></i> Browse Drives
        </button>
      </div>
      <div class="page-body">
        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>
        <template v-if="data">
          <!-- Student Quick Info -->
          <div class="card-dark mb-4">
            <div class="card-body-custom">
              <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
                <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:1.2rem;font-weight:800;flex-shrink:0;">
                  {{ data.student.name.charAt(0) }}
                </div>
                <div style="flex:1;">
                  <div style="font-family:var(--font-head);font-size:1.2rem;font-weight:700;">{{ data.student.name }}</div>
                  <div style="color:var(--text-muted);font-size:0.82rem;">{{ data.student.branch }} · Year {{ data.student.year }} · CGPA {{ data.student.cgpa }}</div>
                </div>
                <div style="display:flex;gap:20px;">
                  <div style="text-align:center;">
                    <div style="font-family:var(--font-head);font-size:1.6rem;font-weight:800;color:var(--accent);">{{ data.eligible_drives.length }}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted);">ELIGIBLE DRIVES</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-family:var(--font-head);font-size:1.6rem;font-weight:800;color:var(--success);">{{ data.applications.filter(a=>a.status==='selected').length }}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted);">SELECTED</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-family:var(--font-head);font-size:1.6rem;font-weight:800;color:var(--warning);">{{ data.applications.length }}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted);">APPLIED</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-3">
            <!-- Eligible Drives -->
            <div class="col-lg-7">
              <div class="card-dark h-100">
                <div class="card-header-custom">
                  <span style="font-family:var(--font-head);font-weight:700;">Eligible Drives</span>
                  <button class="btn-ghost" @click="$router.push('/student/drives')">View All</button>
                </div>
                <div class="card-body-custom">
                  <div v-if="data.eligible_drives.length===0" class="empty-state" style="padding:30px;">
                    <i class="bi bi-briefcase"></i>
                    <p>No eligible drives right now</p>
                  </div>
                  <div v-for="d in data.eligible_drives.slice(0,4)" :key="d.id"
                    style="padding:14px;background:var(--surface);border-radius:10px;margin-bottom:10px;display:flex;align-items:center;gap:12px;">
                    <div style="flex:1;min-width:0;">
                      <div style="font-weight:600;font-size:0.9rem;">{{ d.job_title }}</div>
                      <div style="color:var(--text-muted);font-size:0.78rem;margin-top:2px;">{{ d.company_name }}</div>
                      <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">
                        <span v-if="d.package_lpa" style="font-size:0.75rem;color:var(--success);">₹{{ d.package_lpa }} LPA</span>
                        <span v-if="daysLeft(d.application_deadline) !== null"
                          :style="daysLeft(d.application_deadline) <= 3 ? 'font-size:0.75rem;color:var(--danger);' : 'font-size:0.75rem;color:var(--text-muted);'">
                          {{ daysLeft(d.application_deadline) > 0 ? daysLeft(d.application_deadline)+' days left' : 'Expired' }}
                        </span>
                      </div>
                    </div>
                    <button class="btn-primary-custom" style="padding:6px 14px;font-size:0.8rem;flex-shrink:0;" @click="$router.push('/student/drives')">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Applications -->
            <div class="col-lg-5">
              <div class="card-dark h-100">
                <div class="card-header-custom">
                  <span style="font-family:var(--font-head);font-weight:700;">My Applications</span>
                  <button class="btn-ghost" @click="$router.push('/student/applications')">View All</button>
                </div>
                <div class="card-body-custom">
                  <div v-if="data.applications.length===0" class="empty-state" style="padding:30px;">
                    <i class="bi bi-file-earmark-text"></i>
                    <p>No applications yet</p>
                  </div>
                  <div v-for="a in data.applications.slice(0,5)" :key="a.id"
                    style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);">
                    <div>
                      <div style="font-size:0.85rem;font-weight:600;">{{ a.job_title }}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">{{ a.company_name }}</div>
                    </div>
                    <span class="badge-custom" :class="statusBadge(a.status)">{{ a.status }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  `
};