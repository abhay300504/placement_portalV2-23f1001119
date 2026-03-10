const AdminCompanies = {
  name: 'AdminCompanies',
  data() { return { companies: [], loading: true, search: '', filter: 'all', acting: null }; },
  async mounted() { await this.load(); },
  methods: {
    async load() {
      try { const r = await api.adminCompanies(); this.companies = r.data || []; }
      catch(e) { store.error('Failed to load companies'); }
      finally { this.loading = false; }
    },
    async approve(c) {
      this.acting = c.id;
      try { await api.updateCompanyStatus(c.id,'approve'); c.approval_status='approved'; store.success('Approved!'); }
      catch(e) { store.error('Failed'); } finally { this.acting = null; }
    },
    async reject(c) {
      this.acting = c.id;
      try { await api.updateCompanyStatus(c.id,'reject'); c.approval_status='rejected'; store.success('Rejected.'); }
      catch(e) { store.error('Failed'); } finally { this.acting = null; }
    },
    async toggleBlacklist(c) {
      this.acting = c.id;
      try {
        const val = !c.is_blacklisted;
        await api.blacklistCompany(c.id, val);
        c.is_blacklisted = val;
        store.success(val ? 'Blacklisted' : 'Blacklist removed');
      } catch(e) { store.error('Failed'); } finally { this.acting = null; }
    },
    async deleteCompany(c) {
      if (!confirm('Delete ' + c.company_name + '? This cannot be undone.')) return;
      this.acting = c.id;
      try {
        await axios.delete(API_BASE + '/admin/companies/' + c.id);
        this.companies = this.companies.filter(x => x.id !== c.id);
        store.success('Company deleted.');
      } catch(e) { store.error(e.response?.data?.error || 'Failed to delete'); } finally { this.acting = null; }
    },
    fdate(d) { return d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'; },
    exportCSV() {
      const headers = ['ID','Company Name','HR Contact','Email','Phone','Website','Status','Blacklisted','Registered'];
      const rows = this.filtered.map(c => [
        c.id,
        c.company_name || '',
        c.hr_contact_name || '',
        c.email || c.hr_email || '',
        c.hr_phone || '',
        c.website || '',
        c.approval_status || 'pending',
        c.is_blacklisted ? 'Yes' : 'No',
        this.fdate(c.created_at)
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'companies.csv'; a.click();
      URL.revokeObjectURL(url);
    }
  },
  computed: {
    filtered() {
      return this.companies.filter(c => {
        const q = this.search.toLowerCase();
        const matchSearch = !q || c.company_name.toLowerCase().includes(q) || (c.email||c.hr_email||'').toLowerCase().includes(q);
        const matchFilter =
          this.filter === 'all'         ? true :
          this.filter === 'pending'     ? c.approval_status === 'pending' :
          this.filter === 'approved'    ? c.approval_status === 'approved' :
          this.filter === 'rejected'    ? c.approval_status === 'rejected' :
          this.filter === 'blacklisted' ? c.is_blacklisted : true;
        return matchSearch && matchFilter;
      });
    },
    counts() {
      return {
        all:         this.companies.length,
        pending:     this.companies.filter(c => c.approval_status==='pending').length,
        approved:    this.companies.filter(c => c.approval_status==='approved').length,
        rejected:    this.companies.filter(c => c.approval_status==='rejected').length,
        blacklisted: this.companies.filter(c => c.is_blacklisted).length
      };
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Registered Companies</div>
            <div class="page-sub">Approve, reject, or manage company accounts.</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <input v-model="search" placeholder="Search by name..."
              style="border:1px solid #e5e7eb;border-radius:8px;padding:8px 14px;font-size:0.85rem;font-family:Inter,sans-serif;outline:none;width:220px;"/>
            <button style="background:#5b21b6;border:none;border-radius:8px;padding:9px 12px;cursor:pointer;color:white;font-size:0.9rem;">
              <i class="bi bi-search"></i>
            </button>
            <button @click="exportCSV"
              style="background:#15803d;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;color:white;font-size:0.85rem;font-weight:700;font-family:Inter,sans-serif;display:flex;align-items:center;gap:6px;">
              <i class="bi bi-file-earmark-spreadsheet"></i> Export CSV
            </button>
          </div>
        </div>

        <div class="page-body">
          <!-- Filter Tabs -->
          <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
            <button v-for="tab in ['all','pending','approved','rejected','blacklisted']" :key="tab"
              @click="filter=tab"
              :style="filter===tab
                ? 'background:#5b21b6;color:white;border:none;border-radius:8px;padding:7px 18px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;text-transform:capitalize;'
                : 'background:white;color:#374151;border:1px solid #e5e7eb;border-radius:8px;padding:7px 18px;font-size:0.85rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;text-transform:capitalize;'">
              {{ tab.charAt(0).toUpperCase()+tab.slice(1) }}
              <span :style="filter===tab?'background:rgba(255,255,255,0.3);':'background:#f3f4f6;'"
                style="margin-left:6px;padding:1px 7px;border-radius:10px;font-size:0.75rem;">{{ counts[tab] }}</span>
            </button>
          </div>

          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>

          <div v-else class="card-box">
            <div v-if="filtered.length===0" style="text-align:center;padding:40px;color:#9ca3af;">
              No companies found.
            </div>
            <table v-else class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>COMPANY</th>
                  <th>HR CONTACT</th>
                  <th>REGISTERED</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in filtered" :key="c.id">
                  <td style="color:#9ca3af;font-weight:600;">{{ c.id }}</td>
                  <td>
                    <div style="font-weight:700;color:#1a1d23;">{{ c.company_name }}</div>
                    <div style="font-size:0.76rem;color:#9ca3af;">{{ c.email || c.hr_email || '' }}</div>
                  </td>
                  <td style="font-size:0.86rem;color:#374151;">{{ c.hr_contact_name || c.hr_phone || '—' }}</td>
                  <td style="font-size:0.82rem;color:#6b7280;">{{ fdate(c.created_at) }}</td>
                  <td>
                    <span v-if="c.is_blacklisted" class="badge badge-red">blacklisted</span>
                    <span v-else :class="c.approval_status==='approved'?'badge badge-green':c.approval_status==='rejected'?'badge badge-red':'badge badge-orange'">
                      {{ c.approval_status || 'pending' }}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <!-- Pending: Approve + Reject -->
                      <template v-if="c.approval_status==='pending'">
                        <button @click="approve(c)" :disabled="acting===c.id" class="btn-approve" style="padding:5px 12px;font-size:0.78rem;">Approve</button>
                        <button @click="reject(c)"  :disabled="acting===c.id" class="btn-reject"  style="padding:5px 12px;font-size:0.78rem;">Reject</button>
                      </template>
                      <!-- Eye: view detail -->
                      <button @click="$router.push('/admin/companies/'+c.id)"
                        style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:7px;padding:5px 10px;cursor:pointer;color:#5b21b6;font-size:0.85rem;">
                        <i class="bi bi-eye"></i>
                      </button>
                      <!-- Blacklist toggle -->
                      <button @click="toggleBlacklist(c)" :disabled="acting===c.id"
                        :style="c.is_blacklisted
                          ? 'background:#f5f3ff;border:1px solid #5b21b6;border-radius:7px;padding:5px 10px;cursor:pointer;color:#5b21b6;font-size:0.78rem;font-weight:600;font-family:Inter,sans-serif;'
                          : 'background:#fff7ed;border:1px solid #fb923c;border-radius:7px;padding:5px 10px;cursor:pointer;color:#ea580c;font-size:0.78rem;font-weight:600;font-family:Inter,sans-serif;'">
                        {{ c.is_blacklisted ? 'Unblacklist' : 'Blacklist' }}
                      </button>
                      <!-- Delete -->
                      <button @click="deleteCompany(c)" :disabled="acting===c.id"
                        style="background:#fef2f2;border:1px solid #fecaca;border-radius:7px;padding:5px 9px;cursor:pointer;color:#dc2626;font-size:0.85rem;">
                        <i class="bi bi-trash"></i>
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