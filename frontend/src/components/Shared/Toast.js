const ToastContainer = {
  name: 'ToastContainer',
  computed: {
    toasts() { return store.toasts; }
  },
  methods: {
    iconFor(type) {
      return {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        info: 'bi-info-circle-fill'
      }[type] || 'bi-info-circle-fill';
    }
  },
  template: `
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast-msg" :class="toast.type">
        <i :class="['bi', iconFor(toast.type)]"></i>
        {{ toast.message }}
      </div>
    </div>
  `
};