// ═══════════════════════════════════════════════════════════
//  MAIN.JS — App root component + mount
// ═══════════════════════════════════════════════════════════

const { createApp } = Vue;

const App = {
  name: 'App',

  components: {
    Sidebar,
    ToastContainer
  },

  computed: {
    isPublicRoute() {
      return this.$route.meta.public;
    }
  },

  template: `
    <div>
      <ToastContainer />
      <template v-if="isPublicRoute">
        <router-view />
      </template>
      <template v-else>
        <div class="app-shell">
          <Sidebar />
          <div class="main-content">
            <router-view />
          </div>
        </div>
      </template>
    </div>
  `
};

const app = createApp(App);

// Register ALL components globally so they work everywhere
app.component('Sidebar', Sidebar);
app.component('ToastContainer', ToastContainer);
app.component('LoginPage', LoginPage);
app.component('RegisterPage', RegisterPage);
app.component('AdminDashboard', AdminDashboard);
app.component('AdminCompanies', AdminCompanies);
app.component('AdminStudents', AdminStudents);
app.component('AdminDrives', AdminDrives);
app.component('AdminApplications', AdminApplications);
app.component('CompanyDashboard', CompanyDashboard);
app.component('CompanyDrives', CompanyDrives);
app.component('CompanyApplications', CompanyApplications);
app.component('CompanyProfile', CompanyProfile);
app.component('StudentDashboard', StudentDashboard);
app.component('StudentDrives', StudentDrives);
app.component('StudentApplications', StudentApplications);
app.component('StudentProfile', StudentProfile);

app.use(router);

// Make store + api available everywhere
app.config.globalProperties.$store = store;
app.config.globalProperties.$api   = api;

app.mount('#app');