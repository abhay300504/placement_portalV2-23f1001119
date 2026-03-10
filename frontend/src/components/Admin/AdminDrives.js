const AdminDrives = {
  name: 'AdminDrives',
  data() { return { drives:[], loading:true, statusFilter:'' }; },
  async mounted() { await this.load(); },
  computed: { filtered() { return this.drives.filter(d=>!this.statusFilter||d.status===this.statusFilter); } },
  methods: {
    async load() { try { const r = await api.adminDrives(); this.drives=r.data; } catch(e) { store.error('Failed'); } finally { this.loading=false; } },
    async updateStatus(id,action) { try { await api.updateDriveStatus(id,action); store.success('Updated!'); await this.load(); } catch(e) { store.error(e.response?.data?.error||'Failed'); } },
    fdate(d) { return d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'; },
    badge(s) { return {pending:'badge badge-orange',approved:'badge badge-green',rejected:'badge badge-red',closed:'badge badge-gray'}[s]||'badge badge-gray'; }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Placement Drives</div>
            <div class="page-sub">Approve or reject drives submitted by companies.</div>
          </div>
        </div>
        <div class="page-body">
          <div class="filter-tabs mb-4" style="padding:0 0 16px;">
            <button class="filter-tab" :class="{active:statusFilter===''}"        @click="statusFilter='';load()">All</button>
            <button class="filter-tab" :class="{active:statusFilter==='pending'}" @click="statusFilter='pending';load()">Pending</button>
            <button class="filter-tab" :class="{active:statusFilter==='approved'}"@click="statusFilter='approved';load()">Approved</button>
            <button class="filter-tab" :class="{active:statusFilter==='rejected'}"@click="statusFilter='rejected';load()">Rejected</button>
            <button class="filter-tab" :class="{active:statusFilter==='closed'}"  @click="statusFilter='closed';load()">Closed</button>
          </div>
          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
          <div class="card-box" v-if="!loading">
            <div style="overflow-x:auto;">
              <table class="data-table">
                <thead><tr><th>#</th><th>Job Title</th><th>Company</th><th>Deadline</th><th>Applicants</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr v-if="filtered.length===0"><td colspan="7" style="text-align:center;color:#9ca3af;padding:32px;">No drives found</td></tr>
                  <tr v-for="(d,i) in filtered" :key="d.id">
                    <td style="color:#9ca3af;">{{ i+1 }}</td>
                    <td>
                      <div style="font-weight:600;">{{ d.job_title }}</div>
                      <div v-if="d.location" style="font-size:0.75rem;color:#9ca3af;"><i class="bi bi-geo-alt me-1"></i>{{ d.location }}</div>
                    </td>
                    <td style="font-weight:500;">{{ d.company_name }}</td>
                    <td style="font-size:0.83rem;">{{ fdate(d.application_deadline) }}</td>
                    <td><div class="count-bubble">{{ d.applicant_count||0 }}</div></td>
                    <td><span :class="badge(d.status)">{{ d.status }}</span></td>
                    <td>
                      <div style="display:flex;gap:5px;flex-wrap:wrap;">
                        <button class="btn-view" @click="$router.push('/admin/applications')"><i class="bi bi-eye me-1"></i>View</button>
                        <button v-if="d.status==='pending'" class="btn-approve" @click="updateStatus(d.id,'approve')">Approve</button>
                        <button v-if="d.status==='pending'" class="btn-reject"  @click="updateStatus(d.id,'reject')">Reject</button>
                        <button v-if="d.status==='approved'" class="btn-close-drive" @click="updateStatus(d.id,'close')">Close</button>
                      </div>
                    </td>
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