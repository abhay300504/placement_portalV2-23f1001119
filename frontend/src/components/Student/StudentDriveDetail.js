const StudentDriveDetail = {
  name: 'StudentDriveDetail',
  data() { return { drive: null, loading: true, applying: false }; },
  async mounted() {
    try {
      // Load all drives then find the one matching the route id
      const r = await api.studentDrives();
      const id = this.$route.params.id;
      this.drive = (r.data || []).find(d => String(d.id) === String(id)) || null;
      if (!this.drive) store.error('Drive not found');
    } catch(e) {
      store.error('Failed to load drive details');
    } finally {
      this.loading = false;
    }
  },
  methods: {
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
    },
    async apply() {
      this.applying = true;
      try {
        await api.applyDrive(this.drive.id);
        store.success('Applied successfully!');
        this.drive.has_applied = true;
        this.drive.application_status = 'applied';
      } catch(e) {
        store.error(e.response?.data?.error || 'Failed to apply');
      } finally { this.applying = false; }
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

          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>

          <div v-else-if="!drive" style="text-align:center;padding:48px;color:#9ca3af;">
            Drive not found. <span @click="$router.push('/student/drives')" style="color:#5b21b6;cursor:pointer;font-weight:600;">Go back →</span>
          </div>

          <template v-else>
            <!-- Go Back -->
            <div style="margin-bottom:20px;">
              <button @click="$router.push('/student/drives')"
                style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px 18px;font-size:0.85rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:6px;">
                <i class="bi bi-arrow-left"></i> Go Back
              </button>
            </div>

            <!-- Detail Card -->
            <div class="card-box" style="max-width:860px;padding:32px;">

              <!-- Header -->
              <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:28px;">
                <div style="width:52px;height:52px;background:#ede9fe;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#5b21b6;font-weight:800;font-size:1.2rem;flex-shrink:0;">
                  {{ (drive.company_name||'C').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;font-weight:600;">JOB TITLE</div>
                  <div style="font-size:1.5rem;font-weight:800;color:#1a1d23;line-height:1.2;">{{ drive.job_title }}</div>
                  <div style="font-size:0.88rem;color:#6b7280;margin-top:4px;font-weight:600;">{{ drive.company_name }}</div>
                </div>
              </div>

              <div style="border-top:1px solid #f3f4f6;margin-bottom:24px;"></div>

              <!-- Job Description -->
              <div style="margin-bottom:24px;">
                <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:8px;">JOB DESCRIPTION</div>
                <div style="font-size:0.9rem;color:#374151;line-height:1.7;">{{ drive.job_description || 'No description provided.' }}</div>
              </div>

              <!-- Eligibility -->
              <div style="margin-bottom:24px;">
                <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:8px;">ELIGIBILITY CRITERIA</div>
                <div style="font-size:0.9rem;color:#374151;">{{ eligibilitySummary(drive) }}</div>
              </div>

              <div style="border-top:1px solid #f3f4f6;margin-bottom:24px;"></div>

              <!-- Info Grid -->
              <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #f3f4f6;border-radius:10px;overflow:hidden;margin-bottom:24px;">
                <div style="padding:16px 20px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">
                  <div style="font-size:0.7rem;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:6px;">SALARY</div>
                  <div style="font-size:0.95rem;font-weight:700;color:#1a1d23;">{{ drive.package_lpa ? drive.package_lpa + ' LPA' : 'Not disclosed' }}</div>
                </div>
                <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;">
                  <div style="font-size:0.7rem;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:6px;">LOCATION</div>
                  <div style="font-size:0.95rem;font-weight:700;color:#1a1d23;">{{ drive.location || '—' }}</div>
                </div>
                <div style="padding:16px 20px;">
                  <div style="font-size:0.7rem;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:6px;">DEADLINE</div>
                  <div style="font-size:0.95rem;font-weight:700;color:#1a1d23;">{{ fdate(drive.application_deadline) }}</div>
                </div>
                <div v-if="drive.eligibility_branch" style="padding:16px 20px;border-left:1px solid #f3f4f6;">
                  <div style="font-size:0.7rem;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:6px;">BRANCH</div>
                  <div style="font-size:0.95rem;font-weight:700;color:#1a1d23;">{{ drive.eligibility_branch }}</div>
                </div>
              </div>

              <div style="border-top:1px solid #f3f4f6;margin-bottom:20px;"></div>

              <!-- Applied Status OR Apply Button -->
              <div v-if="drive.has_applied"
                style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:14px 18px;display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                <i class="bi bi-check-circle-fill" style="color:#22c55e;font-size:1.1rem;"></i>
                <span style="font-size:0.88rem;color:#374151;">
                  You have already applied to this drive. Current status:
                  <strong>{{ drive.application_status || 'applied' }}</strong>
                </span>
              </div>
              <div v-else style="margin-bottom:20px;">
                <button @click="apply" :disabled="applying"
                  style="background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:700;padding:11px 28px;cursor:pointer;font-family:Inter,sans-serif;font-size:0.92rem;display:inline-flex;align-items:center;gap:8px;">
                  <i v-if="!applying" class="bi bi-send"></i>
                  {{ applying ? 'Applying...' : 'Apply Now' }}
                </button>
              </div>

              <!-- Bottom Go Back -->
              <button @click="$router.push('/student/drives')"
                style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px 18px;font-size:0.85rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:6px;">
                <i class="bi bi-arrow-left"></i> Go Back
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  `
};