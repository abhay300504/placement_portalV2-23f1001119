const Sidebar = {
  name: 'Sidebar',
  computed: {
    role()    { return store.role; },
    user()    { return store.user; },
    initials(){ return store.user?.email?.slice(0,2).toUpperCase() || '??'; },
    navItems() {
      const role = this.role;
      if (role === 'admin') return [
        { label: 'Dashboard',    icon: 'bi-grid-1x2',          to: '/admin/dashboard' },
        { label: 'Companies',    icon: 'bi-building',           to: '/admin/companies' },
        { label: 'Students',     icon: 'bi-people',             to: '/admin/students' },
        { label: 'Drives',       icon: 'bi-briefcase',          to: '/admin/drives' },
        { label: 'Applications', icon: 'bi-file-earmark-text',  to: '/admin/applications' },
      ];
      if (role === 'company') return [
        { label: 'Dashboard',    icon: 'bi-grid-1x2',           to: '/company/dashboard' },
        { label: 'My Drives',    icon: 'bi-briefcase',          to: '/company/drives' },
        { label: 'Applications', icon: 'bi-people',             to: '/company/applications' },
        { label: 'Profile',      icon: 'bi-building',           to: '/company/profile' },
      ];
      if (role === 'student') return [
        { label: 'Dashboard',       icon: 'bi-grid-1x2',          to: '/student/dashboard' },
        { label: 'Browse Drives',   icon: 'bi-search',             to: '/student/drives' },
        { label: 'My Applications', icon: 'bi-file-earmark-text',  to: '/student/applications' },
        { label: 'Profile',         icon: 'bi-person',             to: '/student/profile' },
      ];
      return [];
    }
  },
  methods: {
    isActive(path) { return this.$route.path === path; },
    logout() { store.logout(this.$router); }
  },
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo">PlacementHub</div>
        <div class="brand-sub">Campus Recruitment Portal</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">Navigation</div>
        <div class="nav-item" v-for="item in navItems" :key="item.to">
          <div class="nav-link-custom" :class="{ active: isActive(item.to) }" @click="$router.push(item.to)">
            <i :class="['bi', item.icon]"></i>
            {{ item.label }}
          </div>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="user-pill" @click="logout" title="Click to logout">
          <div class="user-avatar">{{ initials }}</div>
          <div class="user-info">
            <div class="user-name">{{ user?.email }}</div>
            <div class="user-role">{{ role }} · Logout</div>
          </div>
          <i class="bi bi-box-arrow-right" style="color:var(--text-muted);font-size:0.9rem;"></i>
        </div>
      </div>
    </aside>
  `
};