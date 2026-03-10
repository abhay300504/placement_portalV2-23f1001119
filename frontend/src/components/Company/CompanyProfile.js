const CompanyProfile = {
  name: 'CompanyProfile',
  data() {
    return {
      loading: true,
      saving: false,
      form: {
        company_name: '',
        hr_contact_name: '',
        hr_phone: '',
        website: '',
        description: ''
      }
    };
  },
  async mounted() {
    try {
      // Load profile from dashboard endpoint (has company data)
      const r = await api.companyDashboard();
      const c = r.data.company;
      this.form = {
        company_name:    c.company_name    || '',
        hr_contact_name: c.hr_contact_name || '',
        hr_phone:        c.hr_phone        || '',
        website:         c.website         || '',
        description:     c.description     || ''
      };
    } catch(e) {
      store.error('Failed to load profile');
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async save() {
      if (!this.form.company_name.trim()) { store.error('Company name is required'); return; }
      this.saving = true;
      try {
        await api.updateCompanyProfile(this.form);
        store.success('Profile updated successfully!');
        this.$router.push('/company/dashboard');
      } catch(e) {
        store.error(e.response?.data?.error || 'Failed to save profile');
      } finally {
        this.saving = false;
      }
    },
    cancel() {
      this.$router.push('/company/dashboard');
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Edit Company Profile</div>
          </div>
        </div>

        <div class="page-body">
          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>

          <div v-if="!loading" style="max-width:780px;margin:0 auto;">
            <div class="card-box" style="padding:32px;">
              <div style="font-size:1.1rem;font-weight:800;color:#1a1d23;margin-bottom:24px;">Edit Company Profile</div>

              <!-- Company Name -->
              <div style="margin-bottom:20px;">
                <label class="field-label">Company Name</label>
                <input v-model="form.company_name" class="field-input" placeholder="Acme Corp"/>
              </div>

              <!-- HR Contact + Phone -->
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="field-label">HR Contact Name</label>
                  <input v-model="form.hr_contact_name" class="field-input" placeholder="Jane Smith"/>
                </div>
                <div class="col-md-6">
                  <label class="field-label">Phone Number</label>
                  <input v-model="form.hr_phone" class="field-input" placeholder="+91 98765 00000"/>
                </div>
              </div>

              <!-- Website -->
              <div style="margin-bottom:20px;">
                <label class="field-label">Website</label>
                <input v-model="form.website" class="field-input" placeholder="https://company.com"/>
              </div>

              <!-- Description -->
              <div style="margin-bottom:28px;">
                <label class="field-label">Company Description</label>
                <textarea v-model="form.description" rows="5" class="field-textarea" placeholder="Tell students about your company..." style="resize:vertical;"></textarea>
              </div>

              <!-- Buttons -->
              <div style="display:flex;gap:12px;">
                <button @click="save" :disabled="saving"
                  style="background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:700;padding:10px 24px;cursor:pointer;font-family:'Inter',sans-serif;font-size:0.9rem;display:flex;align-items:center;gap:6px;">
                  <i v-if="!saving" class="bi bi-check2"></i>
                  <span>{{ saving ? 'Saving...' : 'Save Changes' }}</span>
                </button>
                <button @click="cancel"
                  style="background:white;border:1px solid #e5e7eb;border-radius:8px;color:#374151;font-weight:600;padding:10px 20px;cursor:pointer;font-family:'Inter',sans-serif;font-size:0.9rem;">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};