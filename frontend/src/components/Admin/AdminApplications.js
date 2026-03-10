const AdminApplications = {
  name: 'AdminApplications',
  data() { return { applications:[], loading:true, statusFilter:'' }; },
  async mounted() { await this.load(); },
  computed: { filtered() { return this.applications.filter(a=>!this.statusFilter||a.status===this.statusFilter); } },
  methods: {
    async load() { try { const r = await api.adminApplications(); this.applications=r.data; } catch(e) { store.error('Failed'); } finally { this.loading=false; } },
    fdate(d) { return d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'; },
    badge(s) { return {applied:'badge badge-blue',shortlisted:'badge badge-purple',selected:'badge badge-green',rejected:'badge badge-red'}[s]||'badge badge-gray'; }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Student Applications</div>
            <div class="page-sub">Overview of all placement applications</div>
          </div>
        </div>
        <div class="page-body">
          <div class="filter-tabs mb-4" style="padding:0 0 16px;">
            <button class="filter-tab" :class="{active:statusFilter===''}"           @click="statusFilter=''">All</button>
            <button class="filter-tab" :class="{active:statusFilter==='applied'}"    @click="statusFilter='applied'">Applied</button>
            <button class="filter-tab" :class="{active:statusFilter==='shortlisted'}"@click="statusFilter='shortlisted'">Shortlisted</button>
            <button class="filter-tab" :class="{active:statusFilter==='selected'}"   @click="statusFilter='selected'">Selected</button>
            <button class="filter-tab" :class="{active:statusFilter==='rejected'}"   @click="statusFilter='rejected'">Rejected</button>
          </div>
          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
          <div class="card-box" v-if="!loading">
            <div style="overflow-x:auto;">
              <table class="data-table">
                <thead><tr><th>#</th><th>Student</th><th>Job Title</th><th>Company</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  <tr v-if="filtered.length===0"><td colspan="6" style="text-align:center;color:#9ca3af;padding:32px;">No applications found</td></tr>
                  <tr v-for="(a,i) in filtered" :key="a.id">
                    <td style="color:#9ca3af;">{{ i+1 }}</td>
                    <td style="font-weight:600;">{{ a.student_name }}</td>
                    <td>{{ a.job_title }}</td>
                    <td>{{ a.company_name }}</td>
                    <td style="font-size:0.82rem;color:#6b7280;">{{ fdate(a.application_date) }}</td>
                    <td><span :class="badge(a.status)">{{ a.status }}</span></td>
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