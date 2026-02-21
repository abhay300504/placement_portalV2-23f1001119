// ═══════════════════════════════════════════════════════════
//  STUDENT PROFILE
// ═══════════════════════════════════════════════════════════

const StudentProfile = {
  name: 'StudentProfile',
  data() {
    return {
      profile: null, loading: true, saving: false, editing: false,
      uploading: false, form: {}
    };
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
        await api.updateStudentProfile({
          name: this.form.name, phone: this.form.phone,
          branch: this.form.branch, year: Number(this.form.year),
          cgpa: Number(this.form.cgpa), roll_number: this.form.roll_number
        });
        store.success('Profile updated!');
        this.editing = false;
        await this.load();
      } catch (e) { store.error('Failed to save'); }
      finally { this.saving = false; }
    },
    async uploadResume(event) {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('resume', file);
      this.uploading = true;
      try {
        await api.uploadResume(formData);
        store.success('Resume uploaded!');
        await this.load();
      } catch (e) {
        store.error(e.response?.data?.error || 'Upload failed');
      } finally { this.uploading = false; }
    },
    cgpaColor(cgpa) {
      if (!cgpa) return 'var(--text-muted)';
      return cgpa >= 8 ? 'var(--success)' : cgpa >= 6 ? 'var(--warning)' : 'var(--danger)';
    }
  },
  template: `
    <div>
      <div class="topbar">
        <div class="topbar-title">My Profile</div>
        <button class="btn-ghost" @click="editing=!editing">
          <i class="bi" :class="editing ? 'bi-x' : 'bi-pencil'"></i> {{ editing ? 'Cancel' : 'Edit Profile' }}
        </button>
      </div>
      <div class="page-body">
        <div v-if="loading" class="loading-center"><div class="spinner-ring"></div></div>

        <div v-if="profile" class="row g-3">
          <!-- Left: Profile Info -->
          <div class="col-lg-8">
            <div class="card-dark">
              <div class="card-body-custom">
                <!-- Avatar + Name -->
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;">
                  <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:1.6rem;font-weight:800;flex-shrink:0;">
                    {{ profile.name.charAt(0) }}
                  </div>
                  <div>
                    <div style="font-family:var(--font-head);font-size:1.4rem;font-weight:800;">{{ profile.name }}</div>
                    <div style="color:var(--text-muted);font-size:0.82rem;margin-top:4px;">{{ profile.email }}</div>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label-dark">Full Name</label>
                    <input v-if="editing" v-model="form.name" class="form-control-dark w-100"/>
                    <div v-else style="color:var(--text);padding:10px 0;border-bottom:1px solid var(--border);">{{ profile.name }}</div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-dark">Roll Number</label>
                    <input v-if="editing" v-model="form.roll_number" class="form-control-dark w-100"/>
                    <div v-else style="color:var(--text);padding:10px 0;border-bottom:1px solid var(--border);">{{ profile.roll_number || '—' }}</div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label-dark">Branch</label>
                    <select v-if="editing" v-model="form.branch" class="form-select-dark w-100">
                      <option v-for="b in ['CSE','ECE','EEE','IT','ME','CE','CH','BT','MCA','MBA']" :key="b" :value="b">{{ b }}</option>
                    </select>
                    <div v-else style="color:var(--text);padding:10px 0;border-bottom:1px solid var(--border);">{{ profile.branch || '—' }}</div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label-dark">Year of Study</label>
                    <select v-if="editing" v-model="form.year" class="form-select-dark w-100">
                      <option v-for="y in [1,2,3,4]" :key="y" :value="y">Year {{ y }}</option>
                    </select>
                    <div v-else style="color:var(--text);padding:10px 0;border-bottom:1px solid var(--border);">{{ profile.year ? 'Year '+profile.year : '—' }}</div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label-dark">CGPA</label>
                    <input v-if="editing" v-model="form.cgpa" type="number" step="0.1" min="0" max="10" class="form-control-dark w-100"/>
                    <div v-else style="padding:10px 0;border-bottom:1px solid var(--border);">
                      <span :style="'color:'+cgpaColor(profile.cgpa)+';font-weight:700;'">{{ profile.cgpa || '—' }}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-dark">Phone</label>
                    <input v-if="editing" v-model="form.phone" type="tel" class="form-control-dark w-100"/>
                    <div v-else style="color:var(--text);padding:10px 0;border-bottom:1px solid var(--border);">{{ profile.phone || '—' }}</div>
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

          <!-- Right: Resume Upload -->
          <div class="col-lg-4">
            <div class="card-dark">
              <div class="card-header-custom">
                <span style="font-family:var(--font-head);font-weight:700;">Resume</span>
              </div>
              <div class="card-body-custom">
                <div v-if="profile.resume_path"
                  style="padding:14px;background:var(--surface);border-radius:10px;display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                  <i class="bi bi-file-earmark-pdf" style="font-size:1.5rem;color:var(--danger);"></i>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:0.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ profile.resume_path }}</div>
                    <div style="font-size:0.72rem;color:var(--success);">Uploaded</div>
                  </div>
                </div>
                <div v-else style="padding:24px;border:2px dashed var(--border);border-radius:10px;text-align:center;margin-bottom:16px;color:var(--text-muted);">
                  <i class="bi bi-cloud-upload" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
                  No resume uploaded
                </div>

                <label style="display:block;width:100%;">
                  <input type="file" accept=".pdf,.doc,.docx" style="display:none;" @change="uploadResume"/>
                  <div class="btn-primary-custom w-100" style="text-align:center;cursor:pointer;">
                    <span v-if="uploading"><i class="bi bi-arrow-repeat me-2"></i>Uploading...</span>
                    <span v-else"><i class="bi bi-upload me-2"></i>{{ profile.resume_path ? 'Replace Resume' : 'Upload Resume' }}</span>
                  </div>
                </label>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;text-align:center;">PDF, DOC, DOCX · Max 5MB</div>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="card-dark" style="margin-top:12px;">
              <div class="card-body-custom">
                <div style="font-family:var(--font-head);font-weight:700;margin-bottom:14px;">Eligibility Status</div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:0.82rem;color:var(--text-muted);">CGPA</span>
                    <span :style="'font-weight:700;color:'+cgpaColor(profile.cgpa)">{{ profile.cgpa || 'Not set' }}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:0.82rem;color:var(--text-muted);">Branch</span>
                    <span style="font-weight:600;">{{ profile.branch || 'Not set' }}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:0.82rem;color:var(--text-muted);">Year</span>
                    <span style="font-weight:600;">{{ profile.year ? 'Year '+profile.year : 'Not set' }}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:0.82rem;color:var(--text-muted);">Resume</span>
                    <span :style="'font-weight:600;color:'+(profile.resume_path?'var(--success)':'var(--danger)')">
                      {{ profile.resume_path ? '✓ Uploaded' : '✗ Missing' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};