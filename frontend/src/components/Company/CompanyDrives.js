// ═══════════════════════════════════════════════════════════
//  COMPANY DRIVES
// ═══════════════════════════════════════════════════════════

const CompanyDrives = {
  name: 'CompanyDrives',
  data() {
    return {
      drives: [], loading: true, showForm: false, submitting: false,
      form: {
        job_title: '', job_description: '',
        eligibility_branch: '', eligibility_cgpa: '', eligibility_year: '',
        application_deadline: '', package_lpa: '', location: ''
      }
    };
  },
  async mounted() { await this.load(); },
  methods: {
    async load() {
      try {
        const res = await api.companyDrives();
        this.drives = res.data;
      } catch (e) { store.error('Failed to load drives'); }
      finally { this.loading = false; }
    },
    async createDrive() {
      if (!this.form.job_title || !this.form.application_deadline) {
        store.error('Job title and deadline are required'); return;
      }
      this.submitting = true;
      try {
        const payload = {
          ...this.form,
          eligibility_cgpa: this.form.eligibility_cgpa ? Number(this.form.eligibility_cgpa) : 0,
          eligibility_year: this.form.eligibility_year ? Number(this.form.eligibility_year) : null,
          package_lpa: this.form.package_lpa ? Number(this.form.package_lpa) : null,
          application_deadline: new Date(this.form.application_deadline).toISOString()
        };
        await api.createDrive(payload);
        store.success('Drive created! Awaiting admin approval.');
        this.showForm = false;
        this.form = { job_title:'',job_description:'',eligibility_branch:'',eligibility_cgpa:'',eligibility_year:'',application_deadline:'',package_lpa:'',location:'' };
        await this.load();
      } catch (e) {
        store.error(e.response?.data?.error || 'Failed to create drive');
      } finally { this.submitting = false; }
    },
    statusBadge(s) {
      return { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected', closed: 'badge-closed' }[s] || '';
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">Placement Drives</div>
        <button class="btn-primary-custom" @click="showForm=!showForm">
          <i class="bi" :class="showForm ? 'bi-x' : 'bi-plus'"></i> {{ showForm ? 'Cancel' : 'New Drive' }}
        </button>
      </div>
      <div class="page-body">

        <!-- Create Drive Form -->
        <div v-if="showForm" class="card-dark mb-4">
          <div class="card-header-custom">
            <span style="font-family:var(--font-head);font-weight:700;">Create New Placement Drive</span>
          </div>
          <div class="card-body-custom">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label-dark">Job Title *</label>
                <input v-model="form.job_title" type="text" placeholder="Software Engineer" class="form-control-dark w-100"/>
              </div>
              <div class="col-md-3">
                <label class="form-label-dark">Package (LPA)</label>
                <input v-model="form.package_lpa" type="number" step="0.5" placeholder="12" class="form-control-dark w-100"/>
              </div>
              <div class="col-md-3">
                <label class="form-label-dark">Location</label>
                <input v-model="form.location" type="text" placeholder="Bangalore" class="form-control-dark w-100"/>
              </div>
              <div class="col-12">
                <label class="form-label-dark">Job Description</label>
                <textarea v-model="form.job_description" rows="3" placeholder="Describe the role, responsibilities, skills required..." class="form-control-dark w-100" style="resize:vertical;"></textarea>
              </div>
              <div class="col-12">
                <div style="padding:14px;background:var(--surface);border-radius:10px;margin-bottom:4px;">
                  <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">Eligibility Criteria</div>
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label-dark">Eligible Branches</label>
                      <input v-model="form.eligibility_branch" type="text" placeholder="CSE,ECE,IT (comma separated)" class="form-control-dark w-100"/>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label-dark">Min CGPA</label>
                      <input v-model="form.eligibility_cgpa" type="number" step="0.1" min="0" max="10" placeholder="7.5" class="form-control-dark w-100"/>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label-dark">Year of Study</label>
                      <select v-model="form.eligibility_year" class="form-select-dark w-100">
                        <option value="">Any Year</option>
                        <option v-for="y in [1,2,3,4]" :key="y" :value="y">Year {{ y }}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label-dark">Application Deadline *</label>
                <input v-model="form.application_deadline" type="datetime-local" class="form-control-dark w-100"/>
              </div>
            </div>
            <div style="margin-top:20px;display:flex;gap:10px;">
              <button class="btn-primary-custom" @click="createDrive" :disabled="submitting">
                <span v-if="submitting"><i class="bi bi-arrow-repeat me-2"></i>Submitting...</span>
                <span v-else"><i class="bi bi-send me-2"></i>Submit for Approval</span>
              </button>
              <button class="btn-ghost" @click="showForm=false">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Drives List -->
        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>

        <div v-if="!loading && drives.length===0" class="empty-state">
          <i class="bi bi-briefcase"></i>
          <p>No drives created yet. Create your first placement drive!</p>
        </div>

        <div class="row g-3" v-if="!loading">
          <div class="col-md-6 col-lg-4" v-for="d in drives" :key="d.id">
            <div class="drive-card">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <span class="badge-custom" :class="statusBadge(d.status)">{{ d.status }}</span>
                <span v-if="d.package_lpa" style="font-weight:700;color:var(--success);font-size:0.9rem;">₹{{ d.package_lpa }} LPA</span>
              </div>
              <div class="drive-title">{{ d.job_title }}</div>
              <div class="drive-meta">
                <span class="drive-meta-item" v-if="d.location"><i class="bi bi-geo-alt"></i>{{ d.location }}</span>
                <span class="drive-meta-item"><i class="bi bi-calendar"></i>{{ formatDate(d.application_deadline) }}</span>
                <span class="drive-meta-item" v-if="d.eligibility_cgpa"><i class="bi bi-star"></i>Min {{ d.eligibility_cgpa }} CGPA</span>
                <span class="drive-meta-item" v-if="d.eligibility_branch"><i class="bi bi-mortarboard"></i>{{ d.eligibility_branch }}</span>
              </div>
              <div style="font-size:0.82rem;color:var(--text-muted);line-height:1.5;margin-bottom:12px;" v-if="d.job_description">
                {{ d.job_description.slice(0,100) }}{{ d.job_description.length > 100 ? '...' : '' }}
              </div>
              <button class="btn-ghost w-100" @click="$router.push('/company/applications')">
                View Applications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};