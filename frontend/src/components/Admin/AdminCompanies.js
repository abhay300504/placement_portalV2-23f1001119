// ═══════════════════════════════════════════════════════════
//  ADMIN COMPANIES
// ═══════════════════════════════════════════════════════════

const AdminCompanies = {
  name: 'AdminCompanies',
  data() {
    return { companies: [], loading: true, search: '', statusFilter: '' };
  },
  async mounted() { await this.load(); },
  computed: {
    filtered() {
      return this.companies.filter(c => {
        const matchSearch = !this.search || c.company_name.toLowerCase().includes(this.search.toLowerCase()) || c.email.toLowerCase().includes(this.search.toLowerCase());
        const matchStatus = !this.statusFilter || c.approval_status === this.statusFilter;
        return matchSearch && matchStatus;
      });
    }
  },
  methods: {
    async load() {
      try {
        const res = await api.adminCompanies();
        this.companies = res.data;
      } catch (e) { store.error('Failed to load companies'); }
      finally { this.loading = false; }
    },
    async approve(id) {
      try {
        await api.updateCompanyStatus(id, 'approve');
        store.success('Company approved!');
        await this.load();
      } catch (e) { store.error(e.response?.data?.error || 'Failed'); }
    },
    async reject(id) {
      try {
        await api.updateCompanyStatus(id, 'reject');
        store.success('Company rejected');
        await this.load();
      } catch (e) { store.error(e.response?.data?.error || 'Failed'); }
    },
    async toggleBlacklist(c) {
      try {
        await api.blacklistCompany(c.id, !c.is_blacklisted);
        store.success(c.is_blacklisted ? 'Company unblacklisted' : 'Company blacklisted');
        await this.load();
      } catch (e) { store.error('Failed'); }
    },
    statusBadge(s) {
      return { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[s] || '';
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">Companies</div>
      </div>
      <div class="page-body">
        <!-- Filters -->
        <div class="card-dark mb-4">
          <div class="card-body-custom">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="search-wrap">
                  <i class="bi bi-search"></i>
                  <input v-model="search" placeholder="Search by name or email..." class="form-control-dark w-100"/>
                </div>
              </div>
              <div class="col-md-3">
                <select v-model="statusFilter" class="form-select-dark w-100">
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div class="col-md-3 d-flex align-items-center">
                <span style="color:var(--text-muted);font-size:0.85rem;">{{ filtered.length }} companies</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>

        <div class="card-dark" v-if="!loading">
          <div style="overflow-x:auto;">
            <table class="table-dark-custom">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>HR Contact</th>
                  <th>Email</th>
                  <th>Website</th>
                  <th>Status</th>
                  <th>Blacklisted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filtered.length===0">
                  <td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px;">No companies found</td>
                </tr>
                <tr v-for="c in filtered" :key="c.id">
                  <td>
                    <div style="font-weight:600;">{{ c.company_name }}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">ID: {{ c.id }}</div>
                  </td>
                  <td>{{ c.hr_contact_name || '—' }}</td>
                  <td style="font-size:0.82rem;">{{ c.email }}</td>
                  <td>
                    <a v-if="c.website" :href="c.website" target="_blank" style="color:var(--accent);font-size:0.82rem;">
                      <i class="bi bi-box-arrow-up-right me-1"></i>Visit
                    </a>
                    <span v-else style="color:var(--text-muted);">—</span>
                  </td>
                  <td><span class="badge-custom" :class="statusBadge(c.approval_status)">{{ c.approval_status }}</span></td>
                  <td>
                    <span class="badge-custom" :class="c.is_blacklisted ? 'badge-rejected' : 'badge-approved'">
                      {{ c.is_blacklisted ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                      <button v-if="c.approval_status==='pending'" class="btn-success-custom" @click="approve(c.id)">Approve</button>
                      <button v-if="c.approval_status==='pending'" class="btn-danger-custom" @click="reject(c.id)">Reject</button>
                      <button class="btn-ghost" style="font-size:0.78rem;padding:5px 10px;" @click="toggleBlacklist(c)">
                        {{ c.is_blacklisted ? 'Unblacklist' : 'Blacklist' }}
                      </button>
                    </div>
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