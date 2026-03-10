const AdminDriveDetail = {
  name: 'AdminDriveDetail',
  data() { return { drive: null, applicants: [], loading: true, acting: false }; },
  async mounted() {
    const id = parseInt(this.$route.params.id);
    try {
      let drive = null;
      let applicants = [];
      try {
        const r = await api.adminDriveDetail(id);
        drive      = r.data.drive       || r.data;
        applicants = r.data.applicants  || r.data.applications || [];
      } catch(e) {
        // Fallback: get drive from list, applicants from applications list
        const [rd, ra] = await Promise.all([api.adminDrives(), api.adminApplications()]);
        drive      = (rd.data || []).find(d => d.id === id);
        applicants = (ra.data || []).filter(a => a.drive_id === id);
      }
      this.drive      = drive;
      this.applicants = applicants;
      if (!drive) store.error('Drive not found');
    } catch(e) {
      store.error('Failed to load drive');
    } finally { this.loading = false; }
  },
  methods: {
    fdate(d) { return d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'; },
    appBadge(s) {
      return { applied:'badge badge-blue', shortlisted:'badge badge-purple', selected:'badge badge-green', rejected:'badge badge-red' }[s] || 'badge badge-gray';
    },
    async approve() {
      this.acting = true;
      try {
        await api.updateDriveStatus(this.drive.id, 'approve');
        this.drive.status = 'approved';
        store.success('Drive approved!');
      } catch(e) { store.error('Failed'); } finally { this.acting = false; }
    },
    async reject() {
      this.acting = true;
      try {
        await api.updateDriveStatus(this.drive.id, 'reject');
        this.drive.status = 'rejected';
        store.success('Drive rejected.');
      } catch(e) { store.error('Failed'); } finally { this.acting = false; }
    },
    async closeDrive() {
      if (!confirm('Mark this drive as closed?')) return;
      this.acting = true;
      try {
        await api.updateDriveStatus(this.drive.id, 'close');
        this.drive.status = 'closed';
        store.success('Drive marked as closed.');
      } catch(e) { store.error(e.response?.data?.error || 'Failed to close drive'); } finally { this.acting = false; }
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Drive Details</div>
          </div>
        </div>
        <div class="page-body">
          <div style="margin-bottom:20px;">
            <button @click="$router.push('/admin/drives')"
              style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px 18px;font-size:0.85rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:6px;">
              <i class="bi bi-arrow-left"></i> Back to Drives
            </button>
          </div>

          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
          <div v-else-if="!drive" style="text-align:center;padding:48px;color:#9ca3af;">Drive not found.</div>

          <div v-else style="display:grid;grid-template-columns:320px 1fr;gap:20px;align-items:start;">
            <!-- Left: Drive Info -->
            <div class="card-box" style="padding:24px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
                <div style="width:52px;height:52px;background:#ede9fe;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:#5b21b6;flex-shrink:0;">
                  <i class="bi bi-briefcase-fill"></i>
                </div>
                <div>
                  <div style="font-size:1.05rem;font-weight:800;color:#1a1d23;">{{ drive.job_title }}</div>
                  <div style="font-size:0.82rem;color:#6b7280;">{{ drive.company_name }}</div>
                </div>
              </div>

              <span :class="drive.status==='approved'?'badge badge-green':drive.status==='rejected'?'badge badge-red':drive.status==='closed'?'badge badge-gray':'badge badge-orange'" style="margin-bottom:16px;display:inline-block;">
                {{ drive.status }}
              </span>

              <div style="display:grid;gap:10px;margin-bottom:16px;">
                <div v-if="drive.location" style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-geo-alt" style="color:#5b21b6;width:16px;flex-shrink:0;"></i>
                  <span style="font-size:0.86rem;color:#374151;">{{ drive.location }}</span>
                </div>
                <div v-if="drive.package_lpa" style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-currency-rupee" style="color:#5b21b6;width:16px;flex-shrink:0;"></i>
                  <span style="font-size:0.86rem;color:#374151;">{{ drive.package_lpa }} LPA</span>
                </div>
                <div style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-calendar" style="color:#5b21b6;width:16px;flex-shrink:0;"></i>
                  <span style="font-size:0.86rem;color:#374151;">Deadline: {{ fdate(drive.application_deadline) }}</span>
                </div>
              </div>

              <div style="border-top:1px solid #f3f4f6;padding-top:14px;margin-bottom:14px;">
                <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:6px;">Job Description</div>
                <div style="font-size:0.85rem;color:#374151;line-height:1.6;">{{ drive.job_description || '—' }}</div>
              </div>

              <div style="border-top:1px solid #f3f4f6;padding-top:14px;margin-bottom:16px;">
                <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:6px;">Eligibility</div>
                <div style="font-size:0.85rem;color:#374151;line-height:1.7;">
                  <div v-if="drive.eligibility_cgpa">CGPA >= {{ drive.eligibility_cgpa }}</div>
                  <div v-if="drive.eligibility_branch">Branch: {{ drive.eligibility_branch }}</div>
                  <div v-if="drive.eligibility_year">Year: {{ drive.eligibility_year }}</div>
                  <div v-if="!drive.eligibility_cgpa && !drive.eligibility_branch && !drive.eligibility_year">Open for all</div>
                </div>
              </div>

              <div v-if="drive.status==='pending'" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                <button @click="approve" :disabled="acting" class="btn-approve" style="width:100%;padding:9px;">Approve</button>
                <button @click="reject"  :disabled="acting" class="btn-reject"  style="width:100%;padding:9px;">Reject</button>
              </div>
              <button v-if="drive.status==='approved'" @click="closeDrive" :disabled="acting"
                style="width:100%;padding:9px;background:#f97316;border:none;border-radius:8px;color:white;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;font-size:0.85rem;">
                Mark as Closed
              </button>
            </div>

            <!-- Right: Applicants -->
            <div class="card-box">
              <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;">
                <span style="font-weight:700;color:#1a1d23;font-size:0.95rem;">
                  <i class="bi bi-people me-2" style="color:#5b21b6;"></i>Applicants ({{ applicants.length }})
                </span>
              </div>
              <div v-if="applicants.length===0" style="text-align:center;padding:40px;color:#9ca3af;">
                No applicants yet for this drive.
              </div>
              <table v-else class="data-table">
                <thead>
                  <tr><th>STUDENT</th><th>BRANCH</th><th>CGPA</th><th>APPLIED ON</th><th>STATUS</th></tr>
                </thead>
                <tbody>
                  <tr v-for="a in applicants" :key="a.id">
                    <td>
                      <div style="font-weight:700;color:#5b21b6;">{{ a.student_name || a.name || '—' }}</div>
                      <div style="font-size:0.76rem;color:#9ca3af;">{{ a.email || '' }}</div>
                    </td>
                    <td style="font-size:0.85rem;color:#374151;">{{ a.branch || '—' }}</td>
                    <td style="font-size:0.85rem;color:#374151;">{{ a.cgpa || '—' }}</td>
                    <td style="font-size:0.82rem;color:#6b7280;">{{ fdate(a.application_date) }}</td>
                    <td><span :class="appBadge(a.status)">{{ a.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};