// ═══════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════

const AdminDashboard = {
  name: 'AdminDashboard',
  data() {
    return { stats: null, loading: true, chart: null };
  },
  async mounted() {
    await this.loadStats();
    this.$nextTick(() => this.renderChart());
  },
  methods: {
    async loadStats() {
      try {
        const res = await api.adminDashboard();
        this.stats = res.data;
      } catch (e) {
        store.error('Failed to load dashboard');
      } finally {
        this.loading = false;
      }
    },
    renderChart() {
      if (!this.stats) return;
      const ctx = document.getElementById('statsChart');
      if (!ctx) return;
      if (this.chart) this.chart.destroy();
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Students', 'Companies', 'Drives', 'Applications'],
          datasets: [{
            data: [this.stats.total_students, this.stats.total_companies, this.stats.total_drives, this.stats.total_applications],
            backgroundColor: ['rgba(79,140,255,0.8)', 'rgba(124,92,252,0.8)', 'rgba(34,197,94,0.8)', 'rgba(245,158,11,0.8)'],
            borderColor: '#1e2330', borderWidth: 3
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#6b7591', font: { family: 'DM Sans' } } } }
        }
      });
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">Dashboard</div>
        <span style="font-size:0.8rem;color:var(--text-muted);">Welcome back, Admin</span>
      </div>
      <div class="page-body">
        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>

        <template v-if="stats">
          <!-- Stat Cards -->
          <div class="row g-3 mb-4">
            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon" style="background:rgba(79,140,255,0.1);color:var(--accent);">
                  <i class="bi bi-people-fill"></i>
                </div>
                <div class="stat-value">{{ stats.total_students }}</div>
                <div class="stat-label">Total Students</div>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon" style="background:rgba(124,92,252,0.1);color:var(--accent2);">
                  <i class="bi bi-building"></i>
                </div>
                <div class="stat-value">{{ stats.total_companies }}</div>
                <div class="stat-label">Companies</div>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon" style="background:rgba(34,197,94,0.1);color:var(--success);">
                  <i class="bi bi-briefcase-fill"></i>
                </div>
                <div class="stat-value">{{ stats.total_drives }}</div>
                <div class="stat-label">Placement Drives</div>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon" style="background:rgba(245,158,11,0.1);color:var(--warning);">
                  <i class="bi bi-trophy-fill"></i>
                </div>
                <div class="stat-value">{{ stats.selected_students }}</div>
                <div class="stat-label">Students Selected</div>
              </div>
            </div>
          </div>

          <!-- Pending Approvals + Chart -->
          <div class="row g-3">
            <div class="col-lg-6">
              <div class="card-dark h-100">
                <div class="card-header-custom">
                  <span style="font-family:var(--font-head);font-weight:700;">Pending Approvals</span>
                </div>
                <div class="card-body-custom">
                  <div style="display:flex;flex-direction:column;gap:12px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--surface);border-radius:10px;">
                      <div style="display:flex;align-items:center;gap:10px;">
                        <i class="bi bi-building" style="color:var(--accent2);font-size:1.1rem;"></i>
                        <span>Company Registrations</span>
                      </div>
                      <div style="display:flex;align-items:center;gap:12px;">
                        <span class="badge-custom badge-pending">{{ stats.pending_companies }} pending</span>
                        <button class="btn-ghost" @click="$router.push('/admin/companies')">Review</button>
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--surface);border-radius:10px;">
                      <div style="display:flex;align-items:center;gap:10px;">
                        <i class="bi bi-briefcase" style="color:var(--accent);font-size:1.1rem;"></i>
                        <span>Placement Drives</span>
                      </div>
                      <div style="display:flex;align-items:center;gap:12px;">
                        <span class="badge-custom badge-pending">{{ stats.pending_drives }} pending</span>
                        <button class="btn-ghost" @click="$router.push('/admin/drives')">Review</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="card-dark h-100">
                <div class="card-header-custom">
                  <span style="font-family:var(--font-head);font-weight:700;">Overview</span>
                </div>
                <div class="card-body-custom" style="height:220px;">
                  <canvas id="statsChart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  `
};