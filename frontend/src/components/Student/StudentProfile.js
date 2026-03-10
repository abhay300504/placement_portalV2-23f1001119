const StudentProfile = {
  name: 'StudentProfile',
  data() { return { profile:null, loading:true, saving:false, uploading:false, form:{}, resumeFile:null }; },
  async mounted() {
    try {
      let r;
      try {
        r = await api.studentProfile();
      } catch(e) {
        // Fallback: get student data from dashboard
        r = await api.studentDashboard();
        r.data = r.data.student;
      }
      this.profile = r.data;
      this.form = {
        name:        r.data.name        || '',
        roll_number: r.data.roll_number || '',
        branch:      r.data.branch      || '',
        year:        r.data.year        || '',
        cgpa:        r.data.cgpa        || '',
        phone:       r.data.phone       || ''
      };
    } catch(e) {
      store.error('Failed to load profile. Please check if Flask is running.');
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async save() {
      this.saving=true;
      try { await api.updateStudentProfile(this.form); store.success('Profile saved!'); const r=await api.studentProfile(); this.profile=r.data; }
      catch(e) { store.error('Failed'); } finally { this.saving=false; }
    },
    onFileChange(e) { this.resumeFile = e.target.files[0]||null; },
    async uploadResume() {
      if (!this.resumeFile) { store.error('Select a PDF file'); return; }
      this.uploading=true;
      try {
        const fd = new FormData(); fd.append('resume',this.resumeFile);
        await api.uploadResume(fd); store.success('Resume uploaded!');
        const r = await api.studentProfile(); this.profile=r.data; this.form={...r.data}; this.resumeFile=null;
        this.$refs.fileInput.value='';
      } catch(e) { store.error(e.response?.data?.error||'Upload failed'); } finally { this.uploading=false; }
    },
    cgpaColor(v) { return v>=8?'#15803d':v>=6?'#d97706':'#dc2626'; },
    branches() { return ['CSE','ECE','EEE','IT','ME','CE','CH','BT','MCA','MBA']; }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">My Profile</div>
            <div class="page-sub">Manage your personal and academic details</div>
          </div>
        </div>
        <div class="page-body">
          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
          <div v-if="!loading" class="row g-4">
            <!-- Left card -->
            <div class="col-md-4">
              <div class="card-box" style="padding:24px;text-align:center;">
                <div style="width:72px;height:72px;background:#ede9fe;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.8rem;color:#5b21b6;">{{ (profile.name||'S').slice(0,1).toUpperCase() }}</div>
                <div style="font-size:1.05rem;font-weight:800;color:#1a1d23;">{{ profile.name }}</div>
                <div style="font-size:0.8rem;color:#9ca3af;margin-top:4px;">{{ profile.email }}</div>
                <div style="margin-top:10px;display:flex;justify-content:center;gap:6px;flex-wrap:wrap;">
                  <span class="badge badge-purple">{{ profile.branch||'—' }}</span>
                  <span class="badge badge-blue">Year {{ profile.year||'—' }}</span>
                  <span :style="'display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;background:#dcfce7;color:'+cgpaColor(profile.cgpa)">CGPA {{ profile.cgpa||'—' }}</span>
                </div>
                <div v-if="profile.roll_number" style="margin-top:12px;font-size:0.82rem;color:#6b7280;"><i class="bi bi-hash me-1"></i>{{ profile.roll_number }}</div>
                <div v-if="profile.phone" style="margin-top:4px;font-size:0.82rem;color:#6b7280;"><i class="bi bi-phone me-1"></i>{{ profile.phone }}</div>
                <div v-if="profile.is_blacklisted" style="margin-top:10px;" class="badge badge-red"><i class="bi bi-slash-circle me-1"></i>Blacklisted</div>
              </div>
              <!-- Resume card -->
              <div class="card-box mt-3" style="padding:18px 20px;">
                <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:12px;">Resume</div>
                <div v-if="profile.resume_path" style="display:flex;align-items:center;gap:10px;padding:10px;background:#f5f3ff;border-radius:8px;margin-bottom:12px;">
                  <i class="bi bi-file-earmark-pdf" style="color:#dc2626;font-size:1.3rem;"></i>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:0.82rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ profile.resume_path }}</div>
                    <div style="font-size:0.72rem;color:#9ca3af;">Uploaded</div>
                  </div>
                  <a :href="'http://127.0.0.1:5000/uploads/'+profile.resume_path" target="_blank" class="btn-view" style="flex-shrink:0;">View</a>
                </div>
                <div v-else style="text-align:center;padding:12px;background:#fafafa;border:1.5px dashed #d1d5db;border-radius:8px;margin-bottom:12px;color:#9ca3af;font-size:0.83rem;">
                  <i class="bi bi-cloud-upload" style="font-size:1.4rem;display:block;margin-bottom:6px;"></i>No resume uploaded
                </div>
                <label class="field-label">Upload / Replace Resume (PDF only)</label>
                <input ref="fileInput" type="file" accept=".pdf" class="field-input" @change="onFileChange" style="padding:6px;cursor:pointer;"/>
                <button v-if="resumeFile" @click="uploadResume" :disabled="uploading"
                  style="width:100%;margin-top:10px;padding:9px;background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;font-size:0.85rem;">
                  <span v-if="uploading"><i class="bi bi-arrow-repeat me-1"></i>Uploading...</span>
                  <span v-else><i class="bi bi-cloud-upload me-1"></i>Upload Resume</span>
                </button>
              </div>
            </div>

            <!-- Right: Edit Form -->
            <div class="col-md-8">
              <div class="card-box">
                <div class="card-head"><span class="card-title"><i class="bi bi-pencil"></i> Edit Profile</span></div>
                <div style="padding:24px;">
                  <div class="row g-3">
                    <div class="col-md-7">
                      <label class="field-label">Full Name</label>
                      <input v-model="form.name" class="field-input" placeholder="John Doe"/>
                    </div>
                    <div class="col-md-5">
                      <label class="field-label">Roll Number</label>
                      <input v-model="form.roll_number" class="field-input" placeholder="2021CS001"/>
                    </div>
                    <div class="col-md-4">
                      <label class="field-label">Branch</label>
                      <select v-model="form.branch" class="field-select">
                        <option value="">Select branch</option>
                        <option v-for="b in branches()" :key="b" :value="b">{{ b }}</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="field-label">Year</label>
                      <select v-model="form.year" class="field-select">
                        <option value="">Select year</option>
                        <option v-for="y in [1,2,3,4]" :key="y" :value="y">Year {{ y }}</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="field-label">CGPA</label>
                      <input v-model="form.cgpa" type="number" step="0.1" min="0" max="10" class="field-input" placeholder="8.5"/>
                    </div>
                    <div class="col-md-6">
                      <label class="field-label">Phone</label>
                      <input v-model="form.phone" class="field-input" placeholder="+91 9876543210"/>
                    </div>
                    <div class="col-12">
                      <button @click="save" :disabled="saving" style="background:#5b21b6;border:none;border-radius:10px;color:white;font-weight:700;padding:10px 24px;cursor:pointer;font-family:'Inter',sans-serif;font-size:0.9rem;">
                        <span v-if="saving">Saving...</span>
                        <span v-else><i class="bi bi-check2 me-1"></i>Save Changes</span>
                      </button>
                    </div>
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