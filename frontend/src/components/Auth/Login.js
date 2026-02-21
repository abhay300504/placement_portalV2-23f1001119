const LoginPage = {
  name: 'LoginPage',
  data() {
    return { email: '', password: '', loading: false, error: '' };
  },
  methods: {
    async login() {
      this.error = '';
      if (!this.email || !this.password) { this.error = 'Please fill in all fields'; return; }
      this.loading = true;
      try {
        const res = await store.login(this.email, this.password);
        store.success('Welcome back!');
        this.$router.push(`/${res.role}/dashboard`);
      } catch (e) {
        this.error = e.response?.data?.error || 'Login failed. Check credentials.';
      } finally { this.loading = false; }
    }
  },
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">PlacementHub</div>
        <div class="auth-tagline">Your campus recruitment portal</div>

        <div v-if="error" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px 14px;font-size:0.85rem;color:var(--danger);margin-bottom:20px;">
          <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
        </div>

        <div class="mb-3">
          <label class="form-label-dark">Email Address</label>
          <input v-model="email" type="email" placeholder="you@example.com" class="form-control-dark w-100" @keyup.enter="login"/>
        </div>

        <div class="mb-4">
          <label class="form-label-dark">Password</label>
          <input v-model="password" type="password" placeholder="••••••••" class="form-control-dark w-100" @keyup.enter="login"/>
        </div>

        <button class="btn-primary-custom w-100" @click="login" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>

        <div style="text-align:center;margin-top:20px;font-size:0.85rem;color:var(--text-muted);">
          New student or company?
          <span style="color:var(--accent);cursor:pointer;" @click="$router.push('/register')"> Create account</span>
        </div>

        <div style="margin-top:20px;padding:14px;background:var(--surface);border-radius:8px;font-size:0.78rem;color:var(--text-muted);">
          <strong style="color:var(--text);display:block;margin-bottom:6px;">Demo Credentials</strong>
          Admin: admin@institute.com / admin123
        </div>
      </div>
    </div>
  `
};