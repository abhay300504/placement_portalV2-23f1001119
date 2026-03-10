const CompanyDrives = {
  name: 'CompanyDrives',
  data() {
    return {
      view: 'list',      // 'list' | 'create' | 'edit'
      drives: [],
      loading: true,
      submitting: false,
      closingId: null,
      deletingId: null,
      editingId: null,

      // Create/Edit form
      form: {
        job_title: '',
        location: '',
        package_lpa: '',
        job_description: '',
        eligibility_branch: '',
        eligibility_cgpa: '',
        eligibility_year: '',
        application_deadline: '',
      }
    };
  },
  async mounted() {
    await this.loadDrives();
    if (this.$route.path === '/company/drives/create') {
      this.resetForm();
      this.view = 'create';
    } else {
      this.view = 'list';
    }
  },
  watch: {
    '$route.path'(newPath) {
      if (newPath === '/company/drives/create') {
        this.resetForm();
        this.editingId = null;
        this.view = 'create';
      } else if (newPath === '/company/drives') {
        this.view = 'list';
      }
    }
  },
  methods: {
    resetForm() {
      this.form = { job_title:'', location:'', package_lpa:'', job_description:'', eligibility_branch:'', eligibility_cgpa:'', eligibility_year:'', application_deadline:'' };
    },
    async loadDrives() {
      this.loading = true;
      try { const r = await api.companyDrives(); this.drives = r.data || []; }
      catch(e) { store.error('Failed to load drives'); }
      finally { this.loading = false; }
    },
    fdate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    },
    statusClass(s) {
      return { approved:'badge badge-green', pending:'badge badge-orange', closed:'badge badge-gray', rejected:'badge badge-red' }[s] || 'badge badge-gray';
    },

    // Create Drive
    openCreate() {
      this.resetForm();
      this.editingId = null;
      this.view = 'create';
      if (this.$route.path !== '/company/drives/create') {
        this.$router.push('/company/drives/create');
      }
    },
    async submitCreate() {
      if (!this.form.job_title.trim()) { store.error('Job title is required'); return; }
      if (!this.form.application_deadline) { store.error('Application deadline is required'); return; }
      this.submitting = true;
      try {
        const payload = {
          job_title:            this.form.job_title,
          location:             this.form.location,
          package_lpa:          this.form.package_lpa ? parseFloat(this.form.package_lpa) : null,
          job_description:      this.form.job_description,
          eligibility_branch:   this.form.eligibility_branch,
          eligibility_cgpa:     this.form.eligibility_cgpa ? parseFloat(this.form.eligibility_cgpa) : 0,
          eligibility_year:     this.form.eligibility_year ? parseInt(this.form.eligibility_year) : null,
          application_deadline: this.form.application_deadline + ':00',
        };
        await api.createDrive(payload);
        store.success('Drive submitted for admin approval!');
        this.view = 'list';
        await this.loadDrives();
      } catch(e) {
        store.error(e.response?.data?.error || 'Failed to create drive');
      } finally { this.submitting = false; }
    },

    // Edit Drive
    openEdit(drive) {
      this.editingId = drive.id;
      // Format deadline for datetime-local input
      let dl = '';
      if (drive.application_deadline) {
        const d = new Date(drive.application_deadline);
        dl = d.toISOString().slice(0, 16);
      }
      this.form = {
        job_title:            drive.job_title || '',
        location:             drive.location || '',
        package_lpa:          drive.package_lpa || '',
        job_description:      drive.job_description || '',
        eligibility_branch:   drive.eligibility_branch || '',
        eligibility_cgpa:     drive.eligibility_cgpa || '',
        eligibility_year:     drive.eligibility_year || '',
        application_deadline: dl,
      };
      this.view = 'edit';
    },
    async submitEdit() {
      if (!this.form.job_title.trim()) { store.error('Job title is required'); return; }
      this.submitting = true;
      try {
        const payload = {
          job_title:            this.form.job_title,
          location:             this.form.location,
          package_lpa:          this.form.package_lpa ? parseFloat(this.form.package_lpa) : null,
          job_description:      this.form.job_description,
          eligibility_branch:   this.form.eligibility_branch,
          eligibility_cgpa:     this.form.eligibility_cgpa ? parseFloat(this.form.eligibility_cgpa) : 0,
          eligibility_year:     this.form.eligibility_year ? parseInt(this.form.eligibility_year) : null,
          application_deadline: this.form.application_deadline ? this.form.application_deadline + ':00' : undefined,
        };
        await api.updateDrive(this.editingId, payload);
        store.success('Drive updated successfully!');
        this.view = 'list';
        this.editingId = null;
        await this.loadDrives();
      } catch(e) {
        store.error(e.response?.data?.error || 'Failed to update drive');
      } finally { this.submitting = false; }
    },

    // Close Drive
    async closeDrive(id) {
      if (!confirm('Close this drive? Students will no longer be able to apply.')) return;
      this.closingId = id;
      try {
        await api.updateDriveStatus(id, 'close');
        store.success('Drive closed');
        await this.loadDrives();
      } catch(e) { store.error(e.response?.data?.error || 'Failed'); }
      finally { this.closingId = null; }
    },

    // Delete Drive
    async deleteDrive(id) {
      if (!confirm('Delete this drive permanently? This cannot be undone.')) return;
      this.deletingId = id;
      try {
        await api.deleteDrive(id);
        store.success('Drive deleted');
        await this.loadDrives();
      } catch(e) { store.error(e.response?.data?.error || 'Failed to delete drive'); }
      finally { this.deletingId = null; }
    },

    // View Applicants
    viewApplicants(drive) {
      this.$router.push('/company/applications?drive_id=' + drive.id);
    },

    goBack() {
      this.editingId = null;
      this.resetForm();
      this.view = 'list';
      if (this.$route.path !== '/company/drives') {
        this.$router.push('/company/drives');
      }
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">

        <!-- ═══════════ LIST VIEW ═══════════ -->
        <template v-if="view==='list'">
          <div class="topbar">
            <div class="topbar-left">
              <div class="page-heading">My Placement Drives</div>
              <div class="page-sub">All drives created by {{ drives[0]?.company_name || 'your company' }}.</div>
            </div>
            <button @click="openCreate" style="background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:700;padding:9px 18px;cursor:pointer;font-family:'Inter',sans-serif;font-size:0.85rem;display:flex;align-items:center;gap:6px;">
              <i class="bi bi-plus-circle"></i> Create Drive
            </button>
          </div>

          <div class="page-body">
            <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
            <div v-else-if="drives.length===0" class="empty-box">
              <i class="bi bi-briefcase" style="font-size:2.5rem;color:#d1d5db;display:block;margin-bottom:12px;"></i>
              <p style="color:#9ca3af;">No drives yet. Create your first drive!</p>
              <button @click="openCreate" style="margin-top:12px;background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:600;padding:9px 18px;cursor:pointer;font-family:'Inter',sans-serif;">Create Drive</button>
            </div>
            <div v-else class="card-box" style="overflow-x:auto;">
              <table class="data-table" style="width:100%;">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>JOB TITLE</th>
                    <th>LOCATION</th>
                    <th>DEADLINE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(d,i) in drives" :key="d.id">
                    <td style="color:#6b7280;">{{ d.id }}</td>
                    <td>
                      <div style="font-weight:700;color:#1a1d23;">{{ d.job_title }}</div>
                      <div style="font-size:0.75rem;color:#9ca3af;">{{ d.package_lpa ? d.package_lpa+' LPA' : '' }}</div>
                    </td>
                    <td style="color:#6b7280;">{{ d.location || '—' }}</td>
                    <td style="color:#6b7280;">{{ fdate(d.application_deadline) }}</td>
                    <td><span :class="statusClass(d.status)">{{ d.status }}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                        <!-- Applicants -->
                        <button @click="viewApplicants(d)"
                          style="background:white;border:1px solid #5b21b6;color:#5b21b6;border-radius:6px;padding:5px 12px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">
                          <i class="bi bi-people me-1"></i>Applicants
                        </button>
                        <!-- Edit (only pending/approved) -->
                        <button v-if="d.status!=='closed'" @click="openEdit(d)"
                          style="background:white;border:1px solid #e5e7eb;color:#374151;border-radius:6px;padding:5px 10px;font-size:0.78rem;cursor:pointer;" title="Edit Drive">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <!-- Close (only approved) -->
                        <button v-if="d.status==='approved'" @click="closeDrive(d.id)" :disabled="closingId===d.id"
                          style="background:#f97316;border:none;color:white;border-radius:6px;padding:5px 12px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">
                          {{ closingId===d.id ? '...' : 'Close' }}
                        </button>
                        <!-- Delete -->
                        <button @click="deleteDrive(d.id)" :disabled="deletingId===d.id"
                          style="background:white;border:1px solid #fee2e2;color:#ef4444;border-radius:6px;padding:5px 8px;font-size:0.78rem;cursor:pointer;" title="Delete Drive">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- CREATE / EDIT FORM  -->
        <template v-if="view==='create' || view==='edit'">
          <div class="topbar">
            <div class="topbar-left">
              <div class="page-heading">{{ view==='edit' ? 'Edit Drive' : 'Create Placement Drive' }}</div>
            </div>
          </div>

          <div class="page-body">
            <div style="max-width:780px;">
              <div class="card-box" style="padding:28px;">
                <!-- Back Button -->
                <button @click="goBack" style="background:transparent;border:none;color:#5b21b6;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;font-size:0.88rem;padding:0;margin-bottom:20px;display:flex;align-items:center;gap:6px;">
                  <i class="bi bi-arrow-left"></i> Back to My Drives
                </button>

                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;font-size:0.82rem;color:#1d4ed8;margin-bottom:24px;">
                  <i class="bi bi-info-circle me-2"></i>
                  {{ view==='edit' ? 'Update the drive details below.' : 'New drives require admin approval before students can apply.' }}
                </div>

                <div class="row g-3">
                  <!-- Job Title -->
                  <div class="col-12">
                    <label class="field-label">Job Title *</label>
                    <input v-model="form.job_title" class="field-input" placeholder="e.g. Software Developer"/>
                  </div>

                  <!-- Location + Package -->
                  <div class="col-md-6">
                    <label class="field-label">Location</label>
                    <input v-model="form.location" class="field-input" placeholder="e.g. Bangalore / Remote"/>
                  </div>
                  <div class="col-md-6">
                    <label class="field-label">Package (LPA)</label>
                    <input v-model="form.package_lpa" type="number" step="0.5" min="0" class="field-input" placeholder="e.g. 7"/>
                  </div>

                  <!-- Job Description -->
                  <div class="col-12">
                    <label class="field-label">Job Description</label>
                    <textarea v-model="form.job_description" rows="4" class="field-textarea" placeholder="Describe the role and responsibilities..." style="resize:vertical;"></textarea>
                  </div>

                  <!-- Eligibility -->
                  <div class="col-12" style="margin-top:4px;">
                    <label class="field-label" style="font-size:0.8rem;font-weight:800;text-transform:uppercase;color:#5b21b6;letter-spacing:0.05em;">Eligibility Criteria</label>
                  </div>
                  <div class="col-md-4">
                    <label class="field-label">Branch (comma separated)</label>
                    <input v-model="form.eligibility_branch" class="field-input" placeholder="CSE,ECE,IT"/>
                  </div>
                  <div class="col-md-4">
                    <label class="field-label">Min CGPA</label>
                    <input v-model="form.eligibility_cgpa" type="number" step="0.1" min="0" max="10" class="field-input" placeholder="e.g. 7.0"/>
                  </div>
                  <div class="col-md-4">
                    <label class="field-label">Year of Study</label>
                    <select v-model="form.eligibility_year" class="field-select">
                      <option value="">Any Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>

                  <!-- Deadline -->
                  <div class="col-12">
                    <label class="field-label">Application Deadline *</label>
                    <input v-model="form.application_deadline" type="datetime-local" class="field-input"/>
                  </div>

                  <!-- Submit buttons -->
                  <div class="col-12" style="display:flex;gap:12px;margin-top:8px;">
                    <button @click="view==='edit' ? submitEdit() : submitCreate()" :disabled="submitting"
                      style="background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:700;padding:10px 24px;cursor:pointer;font-family:'Inter',sans-serif;font-size:0.9rem;">
                      <span v-if="submitting">Submitting...</span>
                      <span v-else-if="view==='edit'"><i class="bi bi-check2 me-1"></i>Save Changes</span>
                      <span v-else><i class="bi bi-send me-1"></i>Submit for Approval</span>
                    </button>
                    <button @click="goBack"
                      style="background:white;border:1px solid #e5e7eb;border-radius:8px;color:#374151;font-weight:600;padding:10px 20px;cursor:pointer;font-family:'Inter',sans-serif;font-size:0.9rem;">
                      Cancel
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