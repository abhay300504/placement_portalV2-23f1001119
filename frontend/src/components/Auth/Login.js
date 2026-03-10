const LoginPage = {
  name: 'LoginPage',
  data() {
    return { email: '', password: '', loading: false, error: '' };
  },
  mounted() {
    // If already logged in, redirect straight to dashboard
    if (store.isAuthenticated && store.role) {
      this.$router.replace('/' + store.role + '/dashboard');
    }
  },
  methods: {
    async login() {
      this.error = '';
      if (!this.email || !this.password) { this.error = 'Please fill in all fields'; return; }
      this.loading = true;
      try {
        const res = await store.login(this.email, this.password);
        const role = res.role;
        store.success('Welcome back!');
        // Use replace so back button does not go back to login
        this.$router.replace('/' + role + '/dashboard');
      } catch (e) {
        this.error = e.response?.data?.error || 'Login failed. Check your credentials.';
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div class="auth-wrap">
      <div class="auth-box">
        <div class="auth-brand">
          <span>Placement</span><span>Hub</span>
        </div>
        <div class="auth-sub">Campus Recruitment Portal</div>

        <div v-if="error" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;font-size:0.83rem;color:#dc2626;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          <i class="bi bi-exclamation-circle"></i> {{ error }}
        </div>

        <div style="margin-bottom:14px;">
          <label class="field-label">Username / Email</label>
          <input v-model="email" type="email" placeholder="Enter your email" class="field-input" @keyup.enter="login"/>
        </div>

        <div style="margin-bottom:22px;">
          <label class="field-label">Password</label>
          <input v-model="password" type="password" placeholder="Enter your password" class="field-input" @keyup.enter="login"/>
        </div>

        <button @click="login" :disabled="loading"
          style="width:100%;padding:11px;background:#5b21b6;border:none;border-radius:10px;color:white;font-weight:700;font-size:0.95rem;cursor:pointer;font-family:'Inter',sans-serif;">
          <span v-if="loading">Logging in...</span>
          <span v-else>Login</span>
        </button>

        <div style="text-align:center;margin-top:18px;font-size:0.85rem;color:#6b7280;">
          Do not have an account?
          <span style="color:#5b21b6;cursor:pointer;font-weight:700;" @click="$router.push('/register')"> Register</span>
        </div>

      </div>
    </div>
  `
};