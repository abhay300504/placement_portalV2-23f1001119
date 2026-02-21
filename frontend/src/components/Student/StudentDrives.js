// ═══════════════════════════════════════════════════════════
//  STUDENT DRIVES — Browse & Apply
// ═══════════════════════════════════════════════════════════

const StudentDrives = {
  name: 'StudentDrives',
  data() {
    return {
      drives: [], loading: true, applying: null,
      search: '', branch: '', location: '', minPkg: '',
      appliedIds: new Set()
    };
  },
  async mounted() {
    await this.loadApplied();
    await this.load();
  },
  methods: {
    async loadApplied() {
      try {
        const res = await api.myApplications();
        this.appliedIds = new Set(res.data.map(a => a.drive_id));
      } catch (e) {}
    },
    async load() {
      this.loading = true;
      try {
        const params = {};
        if (this.search)   params.search = this.search;
        if (this.branch)   params.branch = this.branch;
        if (this.location) params.location = this.location;
        if (this.minPkg)   params.min_package = this.minPkg;
        const res = await api.studentDrives(params);
        this.drives = res.data;
      } catch (e) { store.error('Failed to load drives'); }
      finally { this.loading = false; }
    },
    async apply(driveId) {
      this.applying = driveId;
      try {
        await api.applyToDrive(driveId);
        store.success('Application submitted!');
        this.appliedIds.add(driveId);
        this.appliedIds = new Set([...this.appliedIds]); // trigger reactivity
      } catch (e) {
        store.error(e.response?.data?.error || 'Failed to apply');
      } finally { this.applying = null; }
    },
    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    daysLeft(deadline) {
      if (!deadline) return null;
      return Math.ceil((new Date(deadline) - new Date()) / (1000*60*60*24));
    },
    clearFilters() {
      this.search = ''; this.branch = ''; this.location = ''; this.minPkg = '';
      this.load();
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">Browse Drives</div>
        <span style="color:var(--text-muted);font-size:0.85rem;">{{ drives.length }} drives found</span>
      </div>
      <div class="page-body">
        <!-- Filters -->
        <div class="card-dark mb-4">
          <div class="card-body-custom">
            <div class="row g-3">
              <div class="col-md-4">
                <div class="search-wrap">
                  <i class="bi bi-search"></i>
                  <input v-model="search" placeholder="Search job title..." class="form-control-dark w-100" @keyup.enter="load"/>
                </div>
              </div>
              <div class="col-md-2">
                <input v-model="branch" placeholder="Branch (e.g. CSE)" class="form-control-dark w-100"/>
              </div>
              <div class="col-md-2">
                <input v-model="location" placeholder="Location" class="form-control-dark w-100"/>
              </div>
              <div class="col-md-2">
                <input v-model="minPkg" type="number" placeholder="Min LPA" class="form-control-dark w-100"/>
              </div>
              <div class="col-md-2 d-flex gap-2">
                <button class="btn-primary-custom" style="flex:1;" @click="load">Search</button>
                <button class="btn-ghost" @click="clearFilters" title="Clear"><i class="bi bi-x-lg"></i></button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>

        <div v-if="!loading && drives.length===0" class="empty-state">
          <i class="bi bi-search"></i>
          <p>No drives found matching your criteria</p>
        </div>

        <div class="row g-3" v-if="!loading">
          <div class="col-md-6 col-lg-4" v-for="d in drives" :key="d.id">
            <div class="drive-card" style="display:flex;flex-direction:column;height:100%;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                <div class="drive-company">{{ d.company_name }}</div>
                <span v-if="d.package_lpa" style="font-weight:700;color:var(--success);font-size:0.9rem;">₹{{ d.package_lpa }} LPA</span>
              </div>
              <div class="drive-title">{{ d.job_title }}</div>
              <div class="drive-meta">
                <span class="drive-meta-item" v-if="d.location"><i class="bi bi-geo-alt"></i>{{ d.location }}</span>
                <span class="drive-meta-item" v-if="d.eligibility_cgpa"><i class="bi bi-star"></i>Min {{ d.eligibility_cgpa }} CGPA</span>
                <span class="drive-meta-item" v-if="d.eligibility_branch"><i class="bi bi-mortarboard"></i>{{ d.eligibility_branch }}</span>
              </div>

              <div v-if="d.job_description" style="font-size:0.82rem;color:var(--text-muted);line-height:1.5;margin-bottom:12px;flex:1;">
                {{ d.job_description.slice(0,120) }}{{ d.job_description.length>120 ? '...' : '' }}
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;">
                <div>
                  <div v-if="daysLeft(d.application_deadline) !== null"
                    :style="daysLeft(d.application_deadline) <= 3 ? 'font-size:0.78rem;color:var(--danger);font-weight:600;' : 'font-size:0.78rem;color:var(--text-muted);'">
                    <i class="bi bi-clock me-1"></i>
                    {{ daysLeft(d.application_deadline) > 0 ? daysLeft(d.application_deadline)+' days left' : 'Deadline passed' }}
                  </div>
                  <div style="font-size:0.72rem;color:var(--text-muted);">Due: {{ formatDate(d.application_deadline) }}</div>
                </div>
                <button
                  @click="apply(d.id)"
                  :disabled="appliedIds.has(d.id) || applying===d.id"
                  :class="appliedIds.has(d.id) ? 'btn-ghost' : 'btn-primary-custom'"
                  style="padding:7px 16px;font-size:0.82rem;"
                >
                  <span v-if="applying===d.id"><i class="bi bi-arrow-repeat me-1"></i>Applying...</span>
                  <span v-else-if="appliedIds.has(d.id)"><i class="bi bi-check me-1"></i>Applied</span>
                  <span v-else><i class="bi bi-send me-1"></i>Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};