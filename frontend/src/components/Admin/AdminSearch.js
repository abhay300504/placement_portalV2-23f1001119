const AdminSearch = {
  name: 'AdminSearch',
  data() {
    return {
      query: '',
      searching: false,
      searched: false,
      students: [],
      companies: [],
      drives: [],
    };
  },
  methods: {
    async search() {
      if (!this.query.trim()) return;
      this.searching = true;
      this.searched = false;
      try {
        const [s, c, d] = await Promise.all([
          api.adminStudents({ search: this.query }),
          api.adminCompanies({ search: this.query }),
          api.adminDrives({ search: this.query }),
        ]);
        this.students  = s.data;
        this.companies = c.data;
        this.drives    = d.data;
        this.searched  = true;
      } catch(e) {
        store.error('Search failed');
      } finally {
        this.searching = false;
      }
    },
    fmtDate(d) {
      return d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
    },
  },
  mounted() {
    this.$nextTick(() => this.$refs.input?.focus());
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap">
        <div class="topbar">
          <div>
            <div class="page-heading">Search</div>
            <div class="page-sub">Search across students and companies simultaneously.</div>
          </div>
        </div>

        <div class="page-body">

          <!-- Search Bar -->
          <div style="display:flex;gap:12px;margin-bottom:28px;">
            <input
              ref="input"
              v-model="query"
              @keyup.enter="search"
              placeholder="Search by name, roll number, company, job title..."
              class="field-input"
              style="flex:1;font-size:1rem;padding:12px 16px;"
            />
            <button @click="search" :disabled="searching || !query.trim()"
              style="padding:12px 24px;background:#5b21b6;border:none;border-radius:10px;color:#fff;font-weight:700;font-size:0.95rem;cursor:pointer;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:8px;"
              :style="(!query.trim()||searching)?'opacity:0.5;cursor:not-allowed':''">
              <i class="bi" :class="searching ? 'bi-arrow-repeat' : 'bi-search'"
                :style="searching?'animation:spin 0.7s linear infinite;display:inline-block;':''"></i>
              {{ searching ? 'Searching...' : 'Search' }}
            </button>
          </div>

          <!-- Idle state -->
          <div v-if="!searched && !searching" style="text-align:center;padding:80px 20px;">
            <i class="bi bi-search" style="font-size:3rem;color:#d1d5db;display:block;margin-bottom:16px;"></i>
            <div style="font-size:1rem;font-weight:600;color:#6b7280;margin-bottom:6px;">Enter a keyword to search</div>
            <div style="font-size:0.85rem;color:#9ca3af;">Search students by name or roll number, companies by name, or drives by job title.</div>
          </div>

          <!-- No results -->
          <div v-if="searched && students.length===0 && companies.length===0 && drives.length===0"
            style="text-align:center;padding:80px 20px;">
            <i class="bi bi-emoji-frown" style="font-size:3rem;color:#d1d5db;display:block;margin-bottom:16px;"></i>
            <div style="font-size:1rem;font-weight:600;color:#6b7280;">No results found for "{{ query }}"</div>
            <div style="font-size:0.85rem;color:#9ca3af;margin-top:6px;">Try a different keyword.</div>
          </div>

          <!-- STUDENTS -->
          <div v-if="searched && students.length > 0" class="card-box" style="margin-bottom:20px;">
            <div class="card-head" style="display:flex;align-items:center;gap:10px;">
              <i class="bi bi-people" style="color:#5b21b6;"></i>
              <span class="card-title">Students ({{ students.length }})</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>BRANCH</th>
                  <th>YEAR</th>
                  <th>CGPA</th>
                  <th>ROLL NO</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in students" :key="s.id"
                  style="cursor:pointer;"
                  @click="$router.push('/admin/students')">
                  <td>
                    <div style="font-weight:600;color:#5b21b6;">{{ s.name }}</div>
                    <div style="font-size:0.78rem;color:#9ca3af;">{{ s.email }}</div>
                  </td>
                  <td>{{ s.branch || '—' }}</td>
                  <td>{{ s.year ? 'Year ' + s.year : '—' }}</td>
                  <td>{{ s.cgpa || '—' }}</td>
                  <td>{{ s.roll_number || '—' }}</td>
                  <td>
                    <span :class="s.is_blacklisted ? 'badge badge-red' : 'badge badge-green'">
                      {{ s.is_blacklisted ? 'Blacklisted' : 'Active' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- COMPANIES -->
          <div v-if="searched && companies.length > 0" class="card-box" style="margin-bottom:20px;">
            <div class="card-head" style="display:flex;align-items:center;gap:10px;">
              <i class="bi bi-building" style="color:#5b21b6;"></i>
              <span class="card-title">Companies ({{ companies.length }})</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>COMPANY</th>
                  <th>HR CONTACT</th>
                  <th>EMAIL</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in companies" :key="c.id"
                  style="cursor:pointer;"
                  @click="$router.push('/admin/companies')">
                  <td>
                    <div style="font-weight:600;color:#5b21b6;">{{ c.company_name }}</div>
                    <div v-if="c.website" style="font-size:0.78rem;color:#9ca3af;">{{ c.website }}</div>
                  </td>
                  <td>{{ c.hr_contact_name || '—' }}</td>
                  <td>{{ c.email }}</td>
                  <td>
                    <span :class="c.approval_status==='approved'?'badge badge-green':c.approval_status==='pending'?'badge badge-orange':'badge badge-red'">
                      {{ c.approval_status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- DRIVES -->
          <div v-if="searched && drives.length > 0" class="card-box" style="margin-bottom:20px;">
            <div class="card-head" style="display:flex;align-items:center;gap:10px;">
              <i class="bi bi-briefcase" style="color:#5b21b6;"></i>
              <span class="card-title">Drives ({{ drives.length }})</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>JOB TITLE</th>
                  <th>COMPANY</th>
                  <th>PACKAGE</th>
                  <th>LOCATION</th>
                  <th>DEADLINE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in drives" :key="d.id"
                  style="cursor:pointer;"
                  @click="$router.push('/admin/drives')">
                  <td style="font-weight:600;color:#5b21b6;">{{ d.job_title }}</td>
                  <td>{{ d.company_name }}</td>
                  <td style="color:#15803d;font-weight:600;">{{ d.package_lpa ? '₹'+d.package_lpa+' LPA' : '—' }}</td>
                  <td>{{ d.location || '—' }}</td>
                  <td>{{ fmtDate(d.application_deadline) }}</td>
                  <td>
                    <span :class="d.status==='approved'?'badge badge-green':d.status==='pending'?'badge badge-orange':d.status==='closed'?'badge badge-gray':'badge badge-red'">
                      {{ d.status }}
                    </span>
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