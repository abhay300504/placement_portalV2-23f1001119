const { createApp } = Vue;

const App = {
  components: { ToastContainer },
  template: `
    <div>
      <router-view></router-view>
      <ToastContainer/>
    </div>
  `
};

const app = createApp(App);
app.component('Sidebar', Sidebar);
app.use(router);
app.mount('#app');

// Ctrl+K global shortcut to open search
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    // Find sidebar component and trigger search
    const sidebarEl = document.querySelector('[data-sidebar]');
    // Dispatch custom event that Sidebar listens to
    document.dispatchEvent(new CustomEvent('open-search'));
  }
  if (e.key === 'Escape') {
    document.dispatchEvent(new CustomEvent('close-search'));
  }
});