// ═══════════════════════════════════════════════════════════
//  ADMIN STUDENTS
// ═══════════════════════════════════════════════════════════

const AdminStudents = {
  name: 'AdminStudents',
  data() {
    return { students: [], loading: true, search: '', branchFilter: '' };
  },
  async mounted() { await this.load(); },
  computed: {
    filtered() {
      return this.students.filter(s => {
        const q = this.search.toLowerCase();
        const matchSearch = !this.search || s.name.toLowerCase().includes(q) || (s.roll_number||'').toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
        const matchBranch = !this.branchFilter || s.branch === this.branchFilter;
        return matchSearch && matchBranch;
      });
    },
    branches() {
      return [...new Set(this.students.map(s => s.branch).filter(Boolean))];
    }
  },
  methods: {
    async load() {
      try {
        const res = await api.adminStudents();
        this.students = res.data;
      } catch (e) { store.error('Failed to load students'); }
      finally { this.loading = false; }
    },
    async toggleBlacklist(s) {
      try {
        await api.blacklistStudent(s.id, !s.is_blacklisted);
        store.success(s.is_blacklisted ? 'Student unblacklisted' : 'Student blacklisted');
        await this.load();
      } catch (e) { store.error('Failed'); }
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">Students</div>
      </div>
      <div class="page-body">
        <div class="card-dark mb-4">
          <div class="card-body-custom">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="search-wrap">
                  <i class="bi bi-search"></i>
                  <input v-model="search" placeholder="Search name, roll no, email..." class="form-control-dark w-100"/>
                </div>
              </div>
              <div class="col-md-3">
                <select v-model="branchFilter" class="form-select-dark w-100">
                  <option value="">All Branches</option>
                  <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
              <div class="col-md-3 d-flex align-items-center">
                <span style="color:var(--text-muted);font-size:0.85rem;">{{ filtered.length }} students</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>

        <div class="card-dark" v-if="!loading">
          <div style="overflow-x:auto;">
            <table class="table-dark-custom">
              <thead>
                <tr><th>Student</th><th>Roll No</th><th>Branch</th><th>Year</th><th>CGPA</th><th>Email</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                <tr v-if="filtered.length===0">
                  <td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px;">No students found</td>
                </tr>
                <tr v-for="s in filtered" :key="s.id">
                  <td>
                    <div style="font-weight:600;">{{ s.name }}</div>
                  </td>
                  <td style="font-size:0.82rem;color:var(--text-muted);">{{ s.roll_number || '—' }}</td>
                  <td><span style="font-size:0.82rem;">{{ s.branch || '—' }}</span></td>
                  <td>{{ s.year ? 'Year ' + s.year : '—' }}</td>
                  <td>
                    <span :style="s.cgpa >= 8 ? 'color:var(--success)' : s.cgpa >= 6 ? 'color:var(--warning)' : 'color:var(--danger)'">
                      {{ s.cgpa || '—' }}
                    </span>
                  </td>
                  <td style="font-size:0.82rem;">{{ s.email }}</td>
                  <td>
                    <span class="badge-custom" :class="s.is_blacklisted ? 'badge-rejected' : 'badge-approved'">
                      {{ s.is_blacklisted ? 'Blacklisted' : 'Active' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-ghost" style="font-size:0.78rem;padding:5px 10px;" @click="toggleBlacklist(s)">
                      {{ s.is_blacklisted ? 'Unblacklist' : 'Blacklist' }}
                    </button>
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