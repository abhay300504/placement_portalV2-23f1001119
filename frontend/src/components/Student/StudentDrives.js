const StudentDrives = {
  name: 'StudentDrives',
  data() {
    return {
      drives: [],
      loading: true,
      applying: false,
      search: '',
      view: 'list',      // 'list' | 'detail'
      selectedDrive: null
    };
  },
  async mounted() {
    await this.load();
    // Check if dashboard sent a drive to open directly
    if (sharedState.selectedDrive && sharedState.selectedDrive._openDetail) {
      const driveId = sharedState.selectedDrive.id;
      sharedState.selectedDrive = null; // clear it
      const found = this.drives.find(d => String(d.id) === String(driveId));
      if (found) { this.selectedDrive = found; this.view = 'detail'; return; }
    }
    this.view = 'list';
  },
  computed: {
    filtered() {
      const q = this.search.toLowerCase();
      return this.drives.filter(d =>
        !q || d.job_title.toLowerCase().includes(q) || d.company_name.toLowerCase().includes(q)
      );
    }
  },
  methods: {
    async load() {
      try { const r = await api.studentDrives(); this.drives = r.data || []; }
      catch(e) { store.error('Failed to load drives'); }
      finally { this.loading = false; }
    },
    openDetail(drive) {
      this.$router.push('/student/drives/' + drive.id);
    },

    goBack() {
      this.view = 'list';
      this.selectedDrive = null;
      if (this.$route.query?.drive_id) this.$router.push('/student/drives');
    },
    async apply(driveId) {
      this.applying = true;
      try {
        await api.applyDrive(driveId);
        store.success('Applied successfully!');
        await this.load();
        // Refresh selectedDrive with updated applied status
        if (this.selectedDrive) {
          this.selectedDrive = this.drives.find(d => d.id === driveId) || this.selectedDrive;
          this.selectedDrive.has_applied = true;
          this.selectedDrive.application_status = 'applied';
        }
      } catch(e) {
        store.error(e.response?.data?.error || 'Failed to apply');
      } finally { this.applying = false; }
    },
    daysLeft(d) {
      if (!d) return null;
      const diff = Math.ceil((new Date(d) - new Date()) / (1000*60*60*24));
      return diff > 0 ? diff : 0;
    },
    fdate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    },
    eligibilitySummary(drive) {
      const parts = [];
      if (drive.eligibility_cgpa) parts.push('cgpa >= ' + drive.eligibility_cgpa);
      if (drive.eligibility_branch) parts.push('branch: ' + drive.eligibility_branch);
      if (drive.eligibility_year) parts.push('year: ' + drive.eligibility_year);
      return parts.length ? parts.join(' | ') : 'Open for all';
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">

        <!-- ══════════ DETAIL VIEW ══════════ -->
        <template v-if="view==='detail' && selectedDrive">
          <div class="topbar">
            <div class="topbar-left">
              <div class="page-heading">Drive Details</div>
            </div>
          </div>
          <div class="page-body">
            <!-- Go Back -->
            <div style="margin-bottom:20px;">
              <button @click="goBack"
                style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px 18px;font-size:0.85rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:6px;">
                <i class="bi bi-arrow-left"></i> Go Back
              </button>
            </div>

            <!-- Detail Card -->
            <div class="card-box" style="max-width:860px;padding:32px;">

              <!-- Header -->
              <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:28px;">
                <div style="width:52px;height:52px;background:#ede9fe;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#5b21b6;font-weight:800;font-size:1.2rem;flex-shrink:0;">
                  {{ (selectedDrive.company_name||'C').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;font-weight:600;">JOB TITLE</div>
                  <div style="font-size:1.5rem;font-weight:800;color:#1a1d23;line-height:1.2;">{{ selectedDrive.job_title }}</div>
                  <div style="font-size:0.88rem;color:#6b7280;margin-top:4px;font-weight:600;">{{ selectedDrive.company_name }}</div>
                </div>
              </div>

              <div style="border-top:1px solid #f3f4f6;margin-bottom:24px;"></div>

              <!-- Job Description -->
              <div style="margin-bottom:24px;">
                <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:8px;">JOB DESCRIPTION</div>
                <div style="font-size:0.9rem;color:#374151;line-height:1.7;">{{ selectedDrive.job_description || 'No description provided.' }}</div>
              </div>

              <!-- Eligibility -->
              <div style="margin-bottom:24px;">
                <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:8px;">ELIGIBILITY CRITERIA</div>
                <div style="font-size:0.9rem;color:#374151;">{{ eligibilitySummary(selectedDrive) }}</div>
              </div>

              <div style="border-top:1px solid #f3f4f6;margin-bottom:24px;"></div>

              <!-- Info Grid -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #f3f4f6;border-radius:10px;overflow:hidden;margin-bottom:24px;">
                <div style="padding:16px 20px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">
                  <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:6px;">SALARY</div>
                  <div style="font-size:0.95rem;font-weight:700;color:#1a1d23;">{{ selectedDrive.package_lpa ? selectedDrive.package_lpa + ' LPA' : 'Not disclosed' }}</div>
                </div>
                <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;">
                  <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:6px;">LOCATION</div>
                  <div style="font-size:0.95rem;font-weight:700;color:#1a1d23;">{{ selectedDrive.location || '—' }}</div>
                </div>
                <div style="padding:16px 20px;border-right:1px solid #f3f4f6;">
                  <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:6px;">DEADLINE</div>
                  <div style="font-size:0.95rem;font-weight:700;color:#1a1d23;">{{ fdate(selectedDrive.application_deadline) }}</div>
                </div>
                <div style="padding:16px 20px;" v-if="selectedDrive.eligibility_branch">
                  <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:6px;">BRANCH</div>
                  <div style="font-size:0.95rem;font-weight:700;color:#1a1d23;">{{ selectedDrive.eligibility_branch }}</div>
                </div>
              </div>

              <div style="border-top:1px solid #f3f4f6;margin-bottom:20px;"></div>

              <!-- Applied Status OR Apply Button -->
              <div v-if="selectedDrive.has_applied"
                style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:14px 18px;display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                <i class="bi bi-check-circle-fill" style="color:#22c55e;font-size:1.1rem;"></i>
                <span style="font-size:0.88rem;color:#374151;">
                  You have already applied to this drive. Current status:
                  <strong>{{ selectedDrive.application_status || 'applied' }}</strong>
                </span>
              </div>
              <div v-else style="margin-bottom:20px;">
                <button @click="apply(selectedDrive.id)" :disabled="applying"
                  style="background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:700;padding:11px 28px;cursor:pointer;font-family:Inter,sans-serif;font-size:0.92rem;display:inline-flex;align-items:center;gap:8px;">
                  <i v-if="!applying" class="bi bi-send"></i>
                  {{ applying ? 'Applying...' : 'Apply Now' }}
                </button>
              </div>

              <!-- Bottom Go Back -->
              <button @click="goBack"
                style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px 18px;font-size:0.85rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:6px;">
                <i class="bi bi-arrow-left"></i> Go Back
              </button>
            </div>
          </div>
        </template>

        <!-- ══════════ LIST VIEW ══════════ -->
        <template v-else>
          <div class="topbar">
            <div class="topbar-left">
              <div class="page-heading">Browse Drives</div>
              <div class="page-sub">{{ drives.length }} open placement drives available</div>
            </div>
            <div style="position:relative;">
              <i class="bi bi-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:0.85rem;"></i>
              <input v-model="search" placeholder="Search drives..."
                style="border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px 8px 32px;font-size:0.85rem;font-family:Inter,sans-serif;outline:none;width:220px;"/>
            </div>
          </div>

          <div class="page-body">
            <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
            <div v-else-if="filtered.length === 0" style="text-align:center;padding:48px;color:#9ca3af;">
              <i class="bi bi-briefcase" style="font-size:2.5rem;display:block;margin-bottom:12px;color:#d1d5db;"></i>
              No drives available right now.
            </div>
            <div v-else class="row g-3">
              <div v-for="d in filtered" :key="d.id" class="col-md-6 col-lg-4">
                <div class="drive-card" style="cursor:pointer;" @click="openDetail(d)">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                    <div>
                      <div class="drive-company-tag">{{ d.company_name }}</div>
                      <div class="drive-title">{{ d.job_title }}</div>
                    </div>
                    <span v-if="d.has_applied" class="badge badge-green">Applied</span>
                  </div>
                  <div class="info-row mb-3">
                    <span class="info-chip" v-if="d.package_lpa"><i class="bi bi-currency-rupee" style="color:#5b21b6;"></i>{{ d.package_lpa }} LPA</span>
                    <span class="info-chip" v-if="d.location"><i class="bi bi-geo-alt" style="color:#5b21b6;"></i>{{ d.location }}</span>
                    <span class="info-chip" v-if="d.eligibility_cgpa"><i class="bi bi-mortarboard" style="color:#5b21b6;"></i>CGPA {{ d.eligibility_cgpa }}+</span>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:0.75rem;color:#9ca3af;"><i class="bi bi-clock me-1"></i>{{ daysLeft(d.application_deadline) }} days left</span>
                    <button @click.stop="openDetail(d)"
                      style="background:#5b21b6;border:none;border-radius:7px;color:white;font-weight:700;padding:6px 14px;cursor:pointer;font-family:Inter,sans-serif;font-size:0.78rem;">
                      View Details
                    </button>
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