const RegisterPage = {
  name: 'RegisterPage',
  data() {
    return {
      role: 'student', email: '', password: '', confirmPassword: '',
      name: '', roll_number: '', branch: '', year: '', cgpa: '', phone: '',
      company_name: '', hr_contact_name: '', hr_phone: '', website: '', description: '',
      loading: false, error: '', success: ''
    };
  },
  computed: {
    branches() { return ['CSE','ECE','EEE','IT','ME','CE','CH','BT','MCA','MBA']; }
  },
  methods: {
    async register() {
      this.error = ''; this.success = '';
      if (!this.email || !this.password) { this.error = 'Email and password are required'; return; }
      if (this.password !== this.confirmPassword) { this.error = 'Passwords do not match'; return; }
      if (this.password.length < 6) { this.error = 'Password must be at least 6 characters'; return; }
      const payload = { email: this.email, password: this.password, role: this.role };
      if (this.role === 'student') {
        if (!this.name) { this.error = 'Full name is required'; return; }
        Object.assign(payload, { name: this.name, roll_number: this.roll_number, branch: this.branch, year: Number(this.year), cgpa: Number(this.cgpa), phone: this.phone });
      } else {
        if (!this.company_name) { this.error = 'Company name is required'; return; }
        Object.assign(payload, { company_name: this.company_name, hr_contact_name: this.hr_contact_name, hr_phone: this.hr_phone, website: this.website, description: this.description });
      }
      this.loading = true;
      try {
        const res = await axios.post('/auth/register', payload);
        this.success = res.data.message || 'Account created successfully!';
        setTimeout(() => this.$router.push('/login'), 2000);
      } catch (e) { this.error = e.response?.data?.error || 'Registration failed'; }
      finally { this.loading = false; }
    }
  },
  template: `
    <div class="auth-wrap" style="align-items:flex-start;padding:32px 16px;">
      <div class="auth-box" style="max-width:520px;margin:auto;">
        <div class="auth-brand"><span>Placement</span><span>Hub</span></div>
        <div class="auth-sub">Create your account</div>

        <!-- Role Tabs -->
        <div style="display:flex;gap:6px;background:#f4f6fb;padding:4px;border-radius:10px;margin-bottom:22px;">
          <button @click="role='student'" :style="role==='student'?'flex:1;padding:8px;border-radius:7px;border:none;background:#5b21b6;color:white;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;font-size:0.85rem;':'flex:1;padding:8px;border-radius:7px;border:none;background:transparent;color:#6b7280;cursor:pointer;font-family:Inter,sans-serif;font-size:0.85rem;'">Student</button>
          <button @click="role='company'" :style="role==='company'?'flex:1;padding:8px;border-radius:7px;border:none;background:#5b21b6;color:white;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;font-size:0.85rem;':'flex:1;padding:8px;border-radius:7px;border:none;background:transparent;color:#6b7280;cursor:pointer;font-family:Inter,sans-serif;font-size:0.85rem;'">Company</button>
        </div>

        <div v-if="success" style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;font-size:0.83rem;color:#15803d;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          <i class="bi bi-check-circle"></i>{{ success }}
        </div>
        <div v-if="error" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;font-size:0.83rem;color:#dc2626;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          <i class="bi bi-exclamation-circle"></i>{{ error }}
        </div>

        <div style="margin-bottom:12px;">
          <label class="field-label">Email Address</label>
          <input v-model="email" type="email" placeholder="Enter your email" class="field-input"/>
        </div>
        <div class="row mb-3">
          <div class="col-6">
            <label class="field-label">Password</label>
            <input v-model="password" type="password" placeholder="Min 6 characters" class="field-input"/>
          </div>
          <div class="col-6">
            <label class="field-label">Confirm Password</label>
            <input v-model="confirmPassword" type="password" placeholder="Repeat password" class="field-input"/>
          </div>
        </div>

        <!-- Student Fields -->
        <template v-if="role==='student'">
          <div class="row mb-3">
            <div class="col-7">
              <label class="field-label">Full Name *</label>
              <input v-model="name" type="text" placeholder="John Doe" class="field-input"/>
            </div>
            <div class="col-5">
              <label class="field-label">Roll Number</label>
              <input v-model="roll_number" type="text" placeholder="2021CS001" class="field-input"/>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-5">
              <label class="field-label">Branch</label>
              <select v-model="branch" class="field-select">
                <option value="">Select branch</option>
                <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
            <div class="col-3">
              <label class="field-label">Year</label>
              <select v-model="year" class="field-select">
                <option value="">Yr</option>
                <option v-for="y in [1,2,3,4]" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div class="col-4">
              <label class="field-label">CGPA</label>
              <input v-model="cgpa" type="number" step="0.1" min="0" max="10" placeholder="8.5" class="field-input"/>
            </div>
          </div>
          <div style="margin-bottom:16px;">
            <label class="field-label">Phone</label>
            <input v-model="phone" type="tel" placeholder="+91 9876543210" class="field-input"/>
          </div>
        </template>

        <!-- Company Fields -->
        <template v-if="role==='company'">
          <div style="margin-bottom:12px;">
            <label class="field-label">Company Name *</label>
            <input v-model="company_name" type="text" placeholder="Acme Corp" class="field-input"/>
          </div>
          <div class="row mb-3">
            <div class="col-6">
              <label class="field-label">HR Contact Name</label>
              <input v-model="hr_contact_name" type="text" placeholder="Jane Smith" class="field-input"/>
            </div>
            <div class="col-6">
              <label class="field-label">HR Phone</label>
              <input v-model="hr_phone" type="tel" placeholder="+91 9876554129" class="field-input"/>
            </div>
          </div>
          <div style="margin-bottom:12px;">
            <label class="field-label">Website</label>
            <input v-model="website" type="url" placeholder="https://company.com" class="field-input"/>
          </div>
          <div style="margin-bottom:14px;">
            <label class="field-label">Description</label>
            <textarea v-model="description" rows="3" placeholder="About your company..." class="field-textarea"></textarea>
          </div>
          <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:9px 12px;font-size:0.78rem;color:#d97706;margin-bottom:14px;">
            <i class="bi bi-clock me-1"></i> Company accounts require admin approval before login.
          </div>
        </template>

        <button @click="register" :disabled="loading"
          style="width:100%;padding:11px;background:#5b21b6;border:none;border-radius:10px;color:white;font-weight:700;font-size:0.92rem;cursor:pointer;font-family:'Inter',sans-serif;margin-bottom:14px;">
          <span v-if="loading">Creating account...</span>
          <span v-else>Register</span>
        </button>

        <div style="text-align:center;font-size:0.85rem;color:#6b7280;">
          Already have an account?
          <span style="color:#5b21b6;cursor:pointer;font-weight:700;" @click="$router.push('/login')"> Login</span>
        </div>
      </div>
    </div>
  `
};