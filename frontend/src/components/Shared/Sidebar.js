const Sidebar = {
  name: 'Sidebar',
  data() { return { dropdownOpen: false }; },
  computed: {
    role()       { return store.role; },
    initials()   { return (store.user?.email || 'U').slice(0,1).toUpperCase(); },
    displayName(){ return store.user?.email?.split('@')[0] || 'User'; },
    roleLabel()  { return {admin:'Admin',company:'Company',student:'Student'}[this.role] || this.role; },
    navItems() {
      if (this.role === 'admin') return [
        { section:'OVERVIEW', items:[
          {label:'Dashboard', icon:'bi-grid-fill', to:'/admin/dashboard'},
        ]},
        { section:'MANAGE', items:[
          {label:'Companies',    icon:'bi-building',          to:'/admin/companies'},
          {label:'Students',     icon:'bi-people',            to:'/admin/students'},
          {label:'Drives',       icon:'bi-briefcase',         to:'/admin/drives'},
          {label:'Applications', icon:'bi-file-earmark-text', to:'/admin/applications'},
        ]},
        { section:'TOOLS', items:[
          {label:'Search', icon:'bi-search', to:'/admin/search'},
        ]},

      ];
      if (this.role === 'company') return [
        { section:'OVERVIEW', items:[
          {label:'Dashboard', icon:'bi-grid-fill', to:'/company/dashboard'},
        ]},
        { section:'DRIVES', items:[
          {label:'My Drives',    icon:'bi-briefcase', to:'/company/drives'},
          {label:'Create Drive', icon:'bi-plus-circle', to:'/company/drives/create'},
        ]},
        { section:'ACCOUNT', items:[
          {label:'Edit Profile', icon:'bi-pencil', to:'/company/profile'},
        ]},
      ];
      if (this.role === 'student') return [
        { section:'OVERVIEW', items:[
          {label:'Dashboard', icon:'bi-grid-fill', to:'/student/dashboard'},
        ]},
        { section:'MANAGE', items:[
          {label:'Browse Drives',    icon:'bi-briefcase',         to:'/student/drives'},
          {label:'My Applications',  icon:'bi-file-earmark-text', to:'/student/applications'},
          {label:'Profile',          icon:'bi-person',            to:'/student/profile'},
        ]},
      ];
      return [];
    }
  },
  methods: {
    isActive(path) { return this.$route?.path === path; },
    logout() { this.dropdownOpen = false; store.logout(this.$router); },
    go(path) { this.dropdownOpen = false; this.$router.push(path); },
  },
  template: `
    <div>
      <!-- ── TOP NAVBAR ── -->
      <div style="position:fixed;top:0;left:0;right:0;height:60px;background:#fff;border-bottom:1px solid #eaecf0;display:flex;align-items:center;padding:0 24px;z-index:200;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
        <div style="width:260px;flex-shrink:0;font-size:1.2rem;font-weight:800;letter-spacing:-0.5px;">
          <span style="color:#5b21b6;">Placement</span><span style="color:#1a1d23;">Portal</span>
        </div>
        <div style="flex:1;"></div>

        <!-- User Button -->
        <div style="position:relative;">
          <div @click="dropdownOpen=!dropdownOpen" class="user-btn" style="cursor:pointer;">
            <div class="user-avatar">{{ initials }}</div>
            <div>
              <div class="user-name">{{ displayName }}</div>
              <div class="user-role">{{ roleLabel }}</div>
            </div>
            <i class="bi" :class="dropdownOpen?'bi-chevron-up':'bi-chevron-down'" style="font-size:0.75rem;color:#9ca3af;"></i>
          </div>

          <!-- Dropdown -->
          <div v-if="dropdownOpen" class="user-dropdown">
            <div class="dropdown-header">
              <div class="user-avatar">{{ initials }}</div>
              <div>
                <div style="font-weight:700;font-size:0.88rem;">{{ displayName }}</div>
                <div style="font-size:0.72rem;color:#9ca3af;">{{ roleLabel }} Account</div>
              </div>
            </div>
            <div style="padding:6px;">
              <div class="dropdown-item-btn" @click="go('/'+role+'/dashboard')">
                <i class="bi bi-grid"></i> Dashboard
              </div>
              <div v-if="role==='student'" class="dropdown-item-btn" @click="go('/student/profile')">
                <i class="bi bi-person"></i> Edit Profile
              </div>
              <div v-if="role==='company'" class="dropdown-item-btn" @click="go('/company/profile')">
                <i class="bi bi-pencil"></i> Edit Profile
              </div>
              <div v-if="role==='admin'" class="dropdown-item-btn" @click="go('/admin/search')">
                <i class="bi bi-search"></i> Search
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <div style="padding:6px;">
              <div class="dropdown-item-btn" style="color:#dc2626;" @click="logout">
                <i class="bi bi-box-arrow-right"></i> Logout
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Click outside closes dropdown -->
      <div v-if="dropdownOpen" @click="dropdownOpen=false" style="position:fixed;inset:0;z-index:199;"></div>

      <!-- ── SIDEBAR ── -->
      <aside class="sidebar" style="top:60px;height:calc(100vh - 60px);">
        <nav class="sidebar-nav">
          <template v-for="group in navItems" :key="group.section">
            <div class="nav-section">{{ group.section }}</div>
            <div
              v-for="item in group.items" :key="item.to"
              class="nav-item"
              :class="{active: isActive(item.to)}"
              @click="$router.push(item.to)"
            >
              <i :class="['bi', item.icon]"></i>{{ item.label }}
            </div>
          </template>
        </nav>
      </aside>
    </div>
  `
};