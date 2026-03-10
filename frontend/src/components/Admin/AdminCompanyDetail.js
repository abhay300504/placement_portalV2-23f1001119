const AdminCompanyDetail = {
  name: 'AdminCompanyDetail',
  data() { return { company: null, drives: [], loading: true, acting: false }; },
  async mounted() {
    const id = parseInt(this.$route.params.id);
    try {
      // Try dedicated endpoint first, fall back to list
      let company = null;
      let drives = [];
      try {
        const r = await api.adminCompanyDetail(id);
        company = r.data.company || r.data;
        drives  = r.data.drives  || [];
      } catch(e) {
        // Fallback: get from companies list
        const [rc, rd] = await Promise.all([api.adminCompanies(), api.adminDrives()]);
        company = (rc.data || []).find(c => c.id === id);
        drives  = (rd.data || []).filter(d => d.company_id === id);
      }
      this.company = company;
      this.drives  = drives;
      if (!company) store.error('Company not found');
    } catch(e) {
      store.error('Failed to load company');
    } finally { this.loading = false; }
  },
  methods: {
    fdate(d) { return d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'; },
    driveBadge(s) {
      return { approved:'badge badge-green', rejected:'badge badge-red', closed:'badge badge-gray', pending:'badge badge-orange' }[s] || 'badge badge-gray';
    },
    async toggleBlacklist() {
      this.acting = true;
      try {
        const val = !this.company.is_blacklisted;
        await api.blacklistCompany(this.company.id, val);
        this.company.is_blacklisted = val;
        store.success(val ? 'Company blacklisted' : 'Blacklist removed');
      } catch(e) { store.error('Failed'); } finally { this.acting = false; }
    },
    async approveCompany() {
      this.acting = true;
      try {
        await api.updateCompanyStatus(this.company.id, 'approve');
        this.company.approval_status = 'approved';
        store.success('Company approved!');
      } catch(e) { store.error('Failed'); } finally { this.acting = false; }
    },
    async rejectCompany() {
      this.acting = true;
      try {
        await api.updateCompanyStatus(this.company.id, 'reject');
        this.company.approval_status = 'rejected';
        store.success('Company rejected.');
      } catch(e) { store.error('Failed'); } finally { this.acting = false; }
    },
    async deleteCompany() {
      if (!confirm('Are you sure you want to delete this company? This cannot be undone.')) return;
      this.acting = true;
      try {
        await axios.delete(API_BASE + '/admin/companies/' + this.company.id);
        store.success('Company deleted.');
        this.$router.push('/admin/companies');
      } catch(e) { store.error(e.response?.data?.error || 'Failed to delete'); } finally { this.acting = false; }
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Company Details</div>
          </div>
        </div>
        <div class="page-body">
          <div style="margin-bottom:20px;">
            <button @click="$router.push('/admin/companies')"
              style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px 18px;font-size:0.85rem;font-weight:600;color:#374151;cursor:pointer;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:6px;">
              <i class="bi bi-arrow-left"></i> Back to Companies
            </button>
          </div>

          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
          <div v-else-if="!company" style="text-align:center;padding:48px;color:#9ca3af;">Company not found.</div>

          <div v-else style="display:grid;grid-template-columns:320px 1fr;gap:20px;align-items:start;">
            <!-- Left card -->
            <div class="card-box" style="padding:28px;text-align:center;">
              <div style="width:72px;height:72px;background:#ede9fe;border-radius:18px;display:flex;align-items:center;justify-content:center;color:#5b21b6;font-weight:800;font-size:1.8rem;margin:0 auto 14px;">
                {{ (company.company_name||'C').charAt(0).toUpperCase() }}
              </div>
              <div style="font-size:1.1rem;font-weight:800;color:#1a1d23;">{{ company.company_name }}</div>
              <div style="margin-top:8px;display:flex;justify-content:center;gap:6px;flex-wrap:wrap;">
                <span v-if="company.is_blacklisted" class="badge badge-red">Blacklisted</span>
                <span v-else :class="company.approval_status==='approved'?'badge badge-green':company.approval_status==='rejected'?'badge badge-red':'badge badge-orange'">
                  {{ company.approval_status || 'pending' }}
                </span>
              </div>

              <div style="border-top:1px solid #f3f4f6;margin:18px 0;"></div>

              <div style="text-align:left;display:grid;gap:12px;">
                <div v-if="company.email||company.hr_email" style="display:flex;gap:10px;align-items:flex-start;">
                  <i class="bi bi-envelope" style="color:#5b21b6;width:16px;flex-shrink:0;margin-top:2px;"></i>
                  <span style="font-size:0.86rem;color:#374151;word-break:break-all;">{{ company.email || company.hr_email }}</span>
                </div>
                <div v-if="company.hr_contact_name" style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-person" style="color:#5b21b6;width:16px;flex-shrink:0;"></i>
                  <span style="font-size:0.86rem;color:#374151;">{{ company.hr_contact_name }}</span>
                </div>
                <div v-if="company.hr_phone" style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-telephone" style="color:#5b21b6;width:16px;flex-shrink:0;"></i>
                  <span style="font-size:0.86rem;color:#374151;">{{ company.hr_phone }}</span>
                </div>
                <div v-if="company.website" style="display:flex;gap:10px;align-items:flex-start;">
                  <i class="bi bi-globe" style="color:#5b21b6;width:16px;flex-shrink:0;margin-top:2px;"></i>
                  <a :href="company.website" target="_blank" style="font-size:0.86rem;color:#5b21b6;word-break:break-all;">{{ company.website }}</a>
                </div>
                <div v-if="company.created_at" style="display:flex;gap:10px;align-items:center;">
                  <i class="bi bi-calendar" style="color:#5b21b6;width:16px;flex-shrink:0;"></i>
                  <span style="font-size:0.86rem;color:#374151;">Registered {{ fdate(company.created_at) }}</span>
                </div>
              </div>

              <div v-if="company.description" style="margin-top:16px;text-align:left;font-size:0.85rem;color:#6b7280;line-height:1.6;padding:12px;background:#fafafa;border-radius:8px;">
                {{ company.description }}
              </div>

              <div style="border-top:1px solid #f3f4f6;margin:18px 0;"></div>

              <div style="display:grid;gap:8px;">
                <div v-if="company.approval_status==='pending'" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <button @click="approveCompany" :disabled="acting" class="btn-approve" style="width:100%;padding:9px;">Approve</button>
                  <button @click="rejectCompany"  :disabled="acting" class="btn-reject"  style="width:100%;padding:9px;">Reject</button>
                </div>
                <button @click="toggleBlacklist" :disabled="acting"
                  :style="company.is_blacklisted
                    ? 'width:100%;padding:9px;background:#f5f3ff;border:1px solid #5b21b6;border-radius:8px;color:#5b21b6;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;font-size:0.85rem;'
                    : 'width:100%;padding:9px;background:#fff7ed;border:1px solid #fb923c;border-radius:8px;color:#ea580c;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;font-size:0.85rem;'">
                  {{ company.is_blacklisted ? 'Remove Blacklist' : 'Blacklist Company' }}
                </button>
                <button @click="deleteCompany" :disabled="acting"
                  style="width:100%;padding:9px;background:white;border:1.5px solid #dc2626;border-radius:8px;color:#dc2626;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;font-size:0.85rem;display:flex;align-items:center;justify-content:center;gap:6px;">
                  <i class="bi bi-trash"></i> Delete Company
                </button>
              </div>
            </div>

            <!-- Right: Drives -->
            <div class="card-box">
              <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;">
                <span style="font-weight:700;color:#1a1d23;font-size:0.95rem;">
                  <i class="bi bi-briefcase me-2" style="color:#5b21b6;"></i>Placement Drives ({{ drives.length }})
                </span>
              </div>
              <div v-if="drives.length===0" style="text-align:center;padding:40px;color:#9ca3af;">
                No drives posted by this company.
              </div>
              <table v-else class="data-table">
                <thead><tr><th>#</th><th>JOB TITLE</th><th>DEADLINE</th><th>STATUS</th><th>ACTION</th></tr></thead>
                <tbody>
                  <tr v-for="d in drives" :key="d.id">
                    <td style="color:#9ca3af;font-weight:600;">{{ d.id }}</td>
                    <td style="font-weight:700;color:#1a1d23;">{{ d.job_title }}</td>
                    <td style="font-size:0.83rem;color:#6b7280;">{{ fdate(d.application_deadline) }}</td>
                    <td><span :class="driveBadge(d.status)">{{ d.status }}</span></td>
                    <td><button @click="$router.push('/admin/drives/'+d.id)" class="btn-view">View</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};