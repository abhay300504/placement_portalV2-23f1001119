// ═══════════════════════════════════════════════════════════
//  REGISTER PAGE
// ═══════════════════════════════════════════════════════════

const RegisterPage = {
  name: 'RegisterPage',
  data() {
    return {
      role: 'student',
      email: '', password: '', confirmPassword: '',
      // Student fields
      name: '', roll_number: '', branch: '', year: null, cgpa: null, phone: '',
      // Company fields
      company_name: '', hr_contact_name: '', hr_phone: '', website: '', description: '',
      loading: false, error: '', success: ''
    };
  },
  computed: {
    branches() {
      return ['CSE','ECE','EEE','IT','ME','CE','CH','BT','MCA','MBA'];
    }
  },
  methods: {
    async register() {
      this.error = ''; this.success = '';
      if (!this.email || !this.password) { this.error = 'Email and password required'; return; }
      if (this.password !== this.confirmPassword) { this.error = 'Passwords do not match'; return; }
      if (this.password.length < 6) { this.error = 'Password must be at least 6 characters'; return; }

      const payload = { email: this.email, password: this.password, role: this.role };

      if (this.role === 'student') {
        if (!this.name) { this.error = 'Name is required'; return; }
        Object.assign(payload, {
          name: this.name, roll_number: this.roll_number,
          branch: this.branch, year: Number(this.year),
          cgpa: Number(this.cgpa), phone: this.phone
        });
      } else {
        if (!this.company_name) { this.error = 'Company name is required'; return; }
        Object.assign(payload, {
          company_name: this.company_name,
          hr_contact_name: this.hr_contact_name,
          hr_phone: this.hr_phone, website: this.website,
          description: this.description
        });
      }

      this.loading = true;
      try {
        const res = await axios.post('/auth/register', payload);
        this.success = res.data.message;
        setTimeout(() => this.$router.push('/login'), 2000);
      } catch (e) {
        this.error = e.response?.data?.error || 'Registration failed';
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div class="auth-page" style="align-items:flex-start;padding:40px 20px;">
      <div class="auth-card" style="max-width:520px;margin:auto;">
        <div class="auth-logo">PlacementHub</div>
        <div class="auth-tagline">Create your account</div>

        <!-- Role Tabs -->
        <div style="display:flex;gap:8px;margin-bottom:24px;background:var(--surface);padding:4px;border-radius:10px;">
          <button
            v-for="r in ['student','company']" :key="r"
            @click="role=r"
            :style="role===r ? 'flex:1;padding:8px;border-radius:7px;border:none;background:var(--accent);color:white;font-weight:600;cursor:pointer;font-family:var(--font-body);' : 'flex:1;padding:8px;border-radius:7px;border:none;background:transparent;color:var(--text-muted);cursor:pointer;font-family:var(--font-body);'"
          >{{ role===r ? '✓' : '' }} {{ r.charAt(0).toUpperCase()+r.slice(1) }}</button>
        </div>

        <!-- Success -->
        <div v-if="success" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:12px 14px;font-size:0.85rem;color:var(--success);margin-bottom:20px;">
          <i class="bi bi-check-circle me-2"></i>{{ success }}
        </div>

        <!-- Error -->
        <div v-if="error" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px 14px;font-size:0.85rem;color:var(--danger);margin-bottom:20px;">
          <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
        </div>

        <!-- Common fields -->
        <div class="mb-3">
          <label class="form-label-dark">Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" class="form-control-dark w-100"/>
        </div>
        <div class="row mb-3">
          <div class="col-6">
            <label class="form-label-dark">Password</label>
            <input v-model="password" type="password" placeholder="••••••" class="form-control-dark w-100"/>
          </div>
          <div class="col-6">
            <label class="form-label-dark">Confirm Password</label>
            <input v-model="confirmPassword" type="password" placeholder="••••••" class="form-control-dark w-100"/>
          </div>
        </div>

        <!-- Student Fields -->
        <template v-if="role==='student'">
          <div class="row mb-3">
            <div class="col-7">
              <label class="form-label-dark">Full Name *</label>
              <input v-model="name" type="text" placeholder="John Doe" class="form-control-dark w-100"/>
            </div>
            <div class="col-5">
              <label class="form-label-dark">Roll Number</label>
              <input v-model="roll_number" type="text" placeholder="2021CS001" class="form-control-dark w-100"/>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-6">
              <label class="form-label-dark">Branch</label>
              <select v-model="branch" class="form-select-dark w-100">
                <option value="">Select branch</option>
                <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
            <div class="col-3">
              <label class="form-label-dark">Year</label>
              <select v-model="year" class="form-select-dark w-100">
                <option value="">Yr</option>
                <option v-for="y in [1,2,3,4]" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div class="col-3">
              <label class="form-label-dark">CGPA</label>
              <input v-model="cgpa" type="number" step="0.1" min="0" max="10" placeholder="8.5" class="form-control-dark w-100"/>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label-dark">Phone</label>
            <input v-model="phone" type="tel" placeholder="+91 9876543210" class="form-control-dark w-100"/>
          </div>
        </template>

        <!-- Company Fields -->
        <template v-if="role==='company'">
          <div class="mb-3">
            <label class="form-label-dark">Company Name *</label>
            <input v-model="company_name" type="text" placeholder="Acme Corp" class="form-control-dark w-100"/>
          </div>
          <div class="row mb-3">
            <div class="col-6">
              <label class="form-label-dark">HR Contact Name</label>
              <input v-model="hr_contact_name" type="text" placeholder="Jane Smith" class="form-control-dark w-100"/>
            </div>
            <div class="col-6">
              <label class="form-label-dark">HR Phone</label>
              <input v-model="hr_phone" type="tel" placeholder="+91 9876543210" class="form-control-dark w-100"/>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label-dark">Website</label>
            <input v-model="website" type="url" placeholder="https://acmecorp.com" class="form-control-dark w-100"/>
          </div>
          <div class="mb-3">
            <label class="form-label-dark">Company Description</label>
            <textarea v-model="description" rows="3" placeholder="Tell students about your company..." class="form-control-dark w-100" style="resize:vertical;"></textarea>
          </div>
          <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:10px 14px;font-size:0.8rem;color:var(--warning);margin-bottom:16px;">
            <i class="bi bi-info-circle me-2"></i>Company registrations require admin approval before login.
          </div>
        </template>

        <button class="btn-primary-custom w-100" @click="register" :disabled="loading">
          <span v-if="loading"><i class="bi bi-arrow-repeat me-2"></i>Creating...</span>
          <span v-else><i class="bi bi-person-plus me-2"></i>Create Account</span>
        </button>

        <div style="text-align:center;margin-top:16px;font-size:0.85rem;color:var(--text-muted);">
          Already have an account?
          <span style="color:var(--accent);cursor:pointer;" @click="$router.push('/login')"> Sign In</span>
        </div>
      </div>
    </div>
  `
};