const CompanyDashboard = {
  name: 'CompanyDashboard',
  data() { return { data: null, loading: true, closingId: null }; },
  async mounted() {
    try { const r = await api.companyDashboard(); this.data = r.data; }
    catch(e) { store.error('Failed to load dashboard'); }
    finally { this.loading = false; }
  },
  computed: {
    upcoming() {
      return (this.data?.drives || [])
        .filter(d => d.status === 'approved' || d.status === 'pending')
        .map((d,i) => ({...d, srno: i+1}));
    },
    closed() {
      return (this.data?.drives || [])
        .filter(d => d.status === 'closed' || d.status === 'rejected')
        .map((d,i) => ({...d, srno: i+1}));
    }
  },
  methods: {
    fdate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    },
    statusClass(s) {
      return { approved:'badge badge-green', pending:'badge badge-orange', closed:'badge badge-gray', rejected:'badge badge-red' }[s] || 'badge badge-gray';
    },
    async closeDrive(id) {
      if (!confirm('Close this drive? Students will no longer be able to apply.')) return;
      this.closingId = id;
      try {
        await api.updateDriveStatus(id, 'close');
        store.success('Drive closed successfully');
        const r = await api.companyDashboard(); this.data = r.data;
      } catch(e) { store.error(e.response?.data?.error || 'Failed to close drive'); }
      finally { this.closingId = null; }
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Welcome, {{ data?.company?.company_name || 'Company' }} 👋</div>
            <div class="page-sub">Manage your placement drives and review applicants.</div>
          </div>
        </div>

        <div class="page-body">
          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>

          <template v-if="!loading && data">
            <!-- Company Info Card -->
            <div class="card-box mb-4" style="padding:20px 24px;">
              <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
                <div style="width:52px;height:52px;background:#ede9fe;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800;color:#5b21b6;flex-shrink:0;">
                  {{ (data.company.company_name||'C').charAt(0).toUpperCase() }}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:1.1rem;font-weight:800;color:#1a1d23;">{{ data.company.company_name }}</div>
                  <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:4px;font-size:0.82rem;color:#6b7280;align-items:center;">
                    <span v-if="data.company.email"><i class="bi bi-envelope me-1"></i>{{ data.company.email }}</span>
                    <span v-if="data.company.hr_phone"><i class="bi bi-person me-1"></i>{{ data.company.hr_phone }}</span>
                    <a v-if="data.company.website" :href="data.company.website" target="_blank" style="color:#5b21b6;font-weight:600;"><i class="bi bi-link-45deg me-1"></i>{{ data.company.website }}</a>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                  <span :class="data.company.approval_status==='approved'?'badge badge-green':data.company.approval_status==='pending'?'badge badge-orange':'badge badge-red'">
                    {{ data.company.approval_status }}
                  </span>
                  <button @click="$router.push('/company/profile')" style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:7px 14px;font-size:0.82rem;font-weight:600;color:#374151;cursor:pointer;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:6px;">
                    <i class="bi bi-pencil"></i> Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <!-- Drives Section -->
            <div class="card-box">
              <div style="padding:20px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6;">
                <div style="font-size:1rem;font-weight:700;color:#1a1d23;">Your Placement Drives</div>
                <button @click="$router.push('/company/drives/create')" style="background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:700;padding:9px 18px;cursor:pointer;font-family:'Inter',sans-serif;font-size:0.85rem;display:flex;align-items:center;gap:6px;">
                  <i class="bi bi-plus-circle"></i> Create Drive
                </button>
              </div>

              <!-- Upcoming Drives -->
              <div style="padding:20px 24px 0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                  <i class="bi bi-rocket-takeoff" style="color:#5b21b6;font-size:1rem;"></i>
                  <span style="font-size:0.9rem;font-weight:700;color:#374151;">Upcoming Drives</span>
                </div>
                <div v-if="upcoming.length===0" style="text-align:center;padding:32px;color:#9ca3af;font-size:0.88rem;">No upcoming drives.</div>
                <div v-else style="overflow-x:auto;">
                  <table class="data-table" style="width:100%;">
                    <thead>
                      <tr>
                        <th>SR NO.</th>
                        <th>DRIVE NAME</th>
                        <th>DEADLINE</th>
                        <th>APPLICANTS</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="d in upcoming" :key="d.id">
                        <td style="color:#6b7280;">{{ d.srno }}</td>
                        <td style="font-weight:600;">{{ d.job_title }}</td>
                        <td style="color:#6b7280;">{{ fdate(d.application_deadline) }}</td>
                        <td>
                          <span style="background:#ede9fe;color:#5b21b6;border-radius:50%;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;">{{ d.applicant_count||0 }}</span>
                        </td>
                        <td><span :class="statusClass(d.status)">{{ d.status }}</span></td>
                        <td>
                          <div style="display:flex;gap:8px;align-items:center;">
                            <button @click="$router.push('/company/drives')" style="background:white;border:1px solid #5b21b6;color:#5b21b6;border-radius:6px;padding:5px 12px;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">View Details</button>
                            <button v-if="d.status==='approved'" @click="closeDrive(d.id)" :disabled="closingId===d.id" style="background:white;border:1px solid #e5e7eb;color:#374151;border-radius:6px;padding:5px 12px;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">
                              {{ closingId===d.id ? '...' : 'Close' }}
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Closed Drives -->
              <div style="padding:20px 24px 24px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;margin-top:8px;">
                  <i class="bi bi-archive" style="color:#6b7280;font-size:1rem;"></i>
                  <span style="font-size:0.9rem;font-weight:700;color:#374151;">Closed Drives</span>
                </div>
                <div v-if="closed.length===0" style="text-align:center;padding:32px;color:#9ca3af;font-size:0.88rem;">No closed drives yet.</div>
                <div v-else style="overflow-x:auto;">
                  <table class="data-table" style="width:100%;">
                    <thead>
                      <tr>
                        <th>SR NO.</th>
                        <th>DRIVE NAME</th>
                        <th>APPLICANTS</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="d in closed" :key="d.id">
                        <td style="color:#6b7280;">{{ d.srno }}</td>
                        <td style="font-weight:600;">{{ d.job_title }}</td>
                        <td>
                          <span style="background:#f3f4f6;color:#374151;border-radius:50%;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;">{{ d.applicant_count||0 }}</span>
                        </td>
                        <td><span :class="statusClass(d.status)">{{ d.status }}</span></td>
                        <td>
                          <button @click="$router.push('/company/drives')" style="background:white;border:1px solid #e5e7eb;color:#374151;border-radius:6px;padding:5px 12px;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">Update</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  `
};