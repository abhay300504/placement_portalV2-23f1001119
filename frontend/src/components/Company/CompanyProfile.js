// ═══════════════════════════════════════════════════════════
//  COMPANY PROFILE
// ═══════════════════════════════════════════════════════════

const CompanyProfile = {
  name: 'CompanyProfile',
  data() {
    return { profile: null, loading: true, saving: false, editing: false, form: {} };
  },
  async mounted() { await this.load(); },
  methods: {
    async load() {
      try {
        const res = await api.me();
        this.profile = res.data.profile;
        this.form = { ...this.profile };
      } catch (e) { store.error('Failed to load profile'); }
      finally { this.loading = false; }
    },
    async save() {
      this.saving = true;
      try {
        await api.updateCompanyProfile(this.form);
        store.success('Profile updated!');
        this.editing = false;
        await this.load();
      } catch (e) { store.error('Failed to save'); }
      finally { this.saving = false; }
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">Company Profile</div>
        <button class="btn-ghost" @click="editing=!editing">
          <i class="bi" :class="editing ? 'bi-x' : 'bi-pencil'"></i> {{ editing ? 'Cancel' : 'Edit' }}
        </button>
      </div>
      <div class="page-body">
        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>
        <div class="card-dark" v-if="profile">
          <div class="card-body-custom">
            <div style="display:flex;align-items:center;gap:20px;margin-bottom:28px;">
              <div style="width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:1.8rem;font-weight:800;">
                {{ profile.company_name.charAt(0) }}
              </div>
              <div>
                <div style="font-family:var(--font-head);font-size:1.5rem;font-weight:800;">{{ profile.company_name }}</div>
                <div style="color:var(--text-muted);margin-top:4px;">{{ profile.email }}</div>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label-dark">Company Name</label>
                <input v-if="editing" v-model="form.company_name" class="form-control-dark w-100"/>
                <div v-else style="color:var(--text);padding:10px 0;border-bottom:1px solid var(--border);">{{ profile.company_name }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label-dark">HR Contact Name</label>
                <input v-if="editing" v-model="form.hr_contact_name" class="form-control-dark w-100"/>
                <div v-else style="color:var(--text);padding:10px 0;border-bottom:1px solid var(--border);">{{ profile.hr_contact_name || '—' }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label-dark">HR Phone</label>
                <input v-if="editing" v-model="form.hr_phone" type="tel" class="form-control-dark w-100"/>
                <div v-else style="color:var(--text);padding:10px 0;border-bottom:1px solid var(--border);">{{ profile.hr_phone || '—' }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label-dark">Website</label>
                <input v-if="editing" v-model="form.website" type="url" class="form-control-dark w-100"/>
                <div v-else style="padding:10px 0;border-bottom:1px solid var(--border);">
                  <a v-if="profile.website" :href="profile.website" target="_blank" style="color:var(--accent);">{{ profile.website }}</a>
                  <span v-else style="color:var(--text-muted);">—</span>
                </div>
              </div>
              <div class="col-12">
                <label class="form-label-dark">Description</label>
                <textarea v-if="editing" v-model="form.description" rows="4" class="form-control-dark w-100" style="resize:vertical;"></textarea>
                <div v-else style="color:var(--text);padding:10px 0;border-bottom:1px solid var(--border);line-height:1.6;">{{ profile.description || '—' }}</div>
              </div>
            </div>

            <div v-if="editing" style="margin-top:20px;display:flex;gap:10px;">
              <button class="btn-primary-custom" @click="save" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};