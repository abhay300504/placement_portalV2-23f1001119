const CompanyApplications = {
  name: 'CompanyApplications',
  data() {
    return {
      drives: [],
      selectedDrive: null,
      applications: [],
      filteredApps: [],
      loading: false,
      drivesLoading: true,
      statusFilter: 'All',
      // Track pending status changes per application id
      pendingStatus: {},
      saving: {}
    };
  },
  async mounted() {
    try {
      const r = await api.companyDrives();
      this.drives = (r.data || []).filter(d => d.status === 'approved' || d.status === 'closed');
      // Check if a drive_id was passed via query param
      const qid = this.$route.query?.drive_id;
      if (qid) {
        this.selectedDrive = this.drives.find(d => d.id == qid) || this.drives[0] || null;
      } else if (this.drives.length > 0) {
        this.selectedDrive = this.drives[0];
      }
      if (this.selectedDrive) await this.loadApps();
    } catch(e) {
      store.error('Failed to load drives');
    } finally {
      this.drivesLoading = false;
    }
  },
  methods: {
    async loadApps() {
      if (!this.selectedDrive) return;
      this.loading = true;
      this.statusFilter = 'All';
      try {
        const r = await api.driveApplications(this.selectedDrive.id);
        this.applications = r.data || [];
        // Init pending status from current status
        this.pendingStatus = {};
        this.applications.forEach(a => { this.pendingStatus[a.id] = a.status; });
        this.applyFilter();
      } catch(e) {
        store.error('Failed to load applications');
      } finally {
        this.loading = false;
      }
    },
    async selectDrive(drive) {
      this.selectedDrive = drive;
      await this.loadApps();
    },
    applyFilter() {
      if (this.statusFilter === 'All') {
        this.filteredApps = [...this.applications];
      } else {
        this.filteredApps = this.applications.filter(a => a.status.toLowerCase() === this.statusFilter.toLowerCase());
      }
    },
    setFilter(f) {
      this.statusFilter = f;
      this.applyFilter();
    },
    async saveStatus(app) {
      const newStatus = this.pendingStatus[app.id];
      if (!newStatus || newStatus === app.status) { store.info('No change to save'); return; }
      this.$set ? this.$set(this.saving, app.id, true) : (this.saving[app.id] = true);
      try {
        await api.updateAppStatus(app.id, newStatus);
        store.success('Status updated to ' + newStatus);
        // Update in local array
        const idx = this.applications.findIndex(a => a.id === app.id);
        if (idx !== -1) this.applications[idx].status = newStatus;
        this.applyFilter();
      } catch(e) {
        store.error(e.response?.data?.error || 'Failed to update');
      } finally {
        this.saving[app.id] = false;
      }
    },
    fdate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    },
    statusBadgeClass(s) {
      return {
        applied:     'badge badge-blue',
        shortlisted: 'badge badge-purple',
        selected:    'badge badge-green',
        rejected:    'badge badge-red'
      }[s] || 'badge badge-gray';
    },
    countFor(status) {
      if (status === 'All') return this.applications.length;
      return this.applications.filter(a => a.status.toLowerCase() === status.toLowerCase()).length;
    },
    resumeUrl(path) {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      // Remove any leading slashes or 'uploads/' prefix duplication
      const filename = path.replace(/^.*[\\/]/, '');
      return 'http://127.0.0.1:5000/uploads/' + filename;
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Applications</div>
            <div class="page-sub">Review and update applicant status for your drives.</div>
          </div>
        </div>

        <div class="page-body">
          <div v-if="drivesLoading" class="loading-box"><div class="spinner"></div></div>

          <template v-if="!drivesLoading">
            <!-- No drives -->
            <div v-if="drives.length === 0" class="card-box" style="padding:48px;text-align:center;">
              <i class="bi bi-briefcase" style="font-size:2.5rem;color:#d1d5db;display:block;margin-bottom:12px;"></i>
              <p style="color:#9ca3af;">No approved drives yet. Create and get a drive approved first.</p>
            </div>

            <template v-else>
              <!-- Back + Drive selector row (if multiple drives) -->
              <div v-if="drives.length > 1" style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;">
                <button v-for="d in drives" :key="d.id"
                  @click="selectDrive(d)"
                  :style="selectedDrive && selectedDrive.id===d.id
                    ? 'background:#5b21b6;color:white;border:1px solid #5b21b6;border-radius:8px;padding:7px 16px;font-size:0.83rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;'
                    : 'background:white;color:#374151;border:1px solid #e5e7eb;border-radius:8px;padding:7px 16px;font-size:0.83rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;'">
                  {{ d.job_title }}
                </button>
              </div>

              <!-- Back to Drives button -->
              <div style="margin-bottom:16px;">
                <button @click="$router.push('/company/drives')"
                  style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px 18px;font-size:0.85rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:6px;">
                  <i class="bi bi-arrow-left"></i> Back to Drives
                </button>
              </div>

              <!-- Drive Info Card -->
              <div v-if="selectedDrive" class="card-box mb-4" style="padding:20px 24px;">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                  <div style="display:flex;align-items:center;gap:16px;">
                    <div style="width:48px;height:48px;background:#ede9fe;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:#5b21b6;flex-shrink:0;">
                      <i class="bi bi-briefcase-fill"></i>
                    </div>
                    <div>
                      <div style="font-size:1.1rem;font-weight:800;color:#1a1d23;">{{ selectedDrive.job_title }}</div>
                      <div style="font-size:0.82rem;color:#6b7280;margin-top:3px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
                        <span v-if="selectedDrive.location"><i class="bi bi-geo-alt me-1"></i>{{ selectedDrive.location }}</span>
                        <span v-if="selectedDrive.package_lpa"><i class="bi bi-currency-rupee"></i>{{ selectedDrive.package_lpa }} LPA</span>
                        <span v-if="selectedDrive.application_deadline">Deadline: {{ fdate(selectedDrive.application_deadline) }}</span>
                      </div>
                    </div>
                  </div>
                  <span :class="selectedDrive.status==='approved'?'badge badge-green':'badge badge-gray'">{{ selectedDrive.status }}</span>
                </div>
              </div>

              <!-- Filter Tabs -->
              <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                <button v-for="tab in ['All','Applied','Shortlisted','Selected','Rejected']" :key="tab"
                  @click="setFilter(tab)"
                  :style="statusFilter===tab
                    ? 'background:#5b21b6;color:white;border:1px solid #5b21b6;border-radius:8px;padding:7px 18px;font-size:0.85rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;'
                    : 'background:white;color:#374151;border:1px solid #e5e7eb;border-radius:8px;padding:7px 18px;font-size:0.85rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;'">
                  {{ tab }}
                  <span style="margin-left:6px;background:rgba(255,255,255,0.25);border-radius:10px;padding:1px 7px;font-size:0.75rem;">{{ countFor(tab) }}</span>
                </button>
              </div>

              <!-- Applications Table -->
              <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
              <div v-else class="card-box">
                <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:8px;">
                  <i class="bi bi-people" style="color:#5b21b6;"></i>
                  <span style="font-weight:700;color:#1a1d23;">Update Applications for the Drive — {{ selectedDrive?.job_title }}</span>
                </div>
                <div v-if="filteredApps.length === 0" style="text-align:center;padding:48px;color:#9ca3af;">
                  <i class="bi bi-inbox" style="font-size:2rem;display:block;margin-bottom:10px;"></i>
                  No {{ statusFilter === 'All' ? '' : statusFilter.toLowerCase() }} applications yet.
                </div>
                <div v-else style="overflow-x:auto;">
                  <table class="data-table" style="width:100%;">
                    <thead>
                      <tr>
                        <th>STUDENT NAME</th>
                        <th>DEPARTMENT</th>
                        <th>CGPA</th>
                        <th>RESUME</th>
                        <th>APPLIED ON</th>
                        <th>CURRENT STATUS</th>
                        <th>UPDATE STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="a in filteredApps" :key="a.id">
                        <td style="font-weight:600;color:#1a1d23;">{{ a.student_name }}</td>
                        <td style="color:#6b7280;">{{ a.branch || '—' }}</td>
                        <td style="color:#6b7280;">{{ a.cgpa || '—' }}</td>
                        <td>
                          <a v-if="resumeUrl(a.resume_path)" :href="resumeUrl(a.resume_path)" target="_blank"
                            style="display:inline-flex;align-items:center;gap:5px;background:white;border:1px solid #e5e7eb;border-radius:6px;padding:4px 12px;font-size:0.8rem;font-weight:600;color:#374151;text-decoration:none;">
                            <i class="bi bi-file-earmark-pdf" style="color:#dc2626;"></i> View
                          </a>
                          <span v-else style="color:#d1d5db;font-size:0.8rem;">—</span>
                        </td>
                        <td style="color:#6b7280;font-size:0.85rem;">{{ fdate(a.application_date) }}</td>
                        <td><span :class="statusBadgeClass(a.status)">{{ a.status }}</span></td>
                        <td>
                          <div style="display:flex;gap:8px;align-items:center;">
                            <select v-model="pendingStatus[a.id]"
                              style="border:1px solid #e5e7eb;border-radius:6px;padding:6px 10px;font-size:0.83rem;font-family:Inter,sans-serif;color:#374151;background:white;cursor:pointer;outline:none;">
                              <option value="applied">Applied</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="selected">Selected</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <button @click="saveStatus(a)" :disabled="saving[a.id]"
                              style="background:#5b21b6;border:none;color:white;border-radius:6px;padding:6px 16px;font-size:0.83rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;">
                              {{ saving[a.id] ? '...' : 'Save' }}
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
  `
};