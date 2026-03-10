const ToastContainer = {
  name: 'ToastContainer',
  computed: { toasts() { return store.toasts; } },
  methods: {
    icon(t) { return {success:'bi-check-circle-fill',error:'bi-x-circle-fill',info:'bi-info-circle-fill'}[t]||'bi-info-circle-fill'; },
    color(t) { return {success:'#22c55e',error:'#ef4444',info:'#5b21b6'}[t]||'#5b21b6'; }
  },
  template: `
    <div class="toast-wrap">
      <div v-for="t in toasts" :key="t.id" class="toast-item" :class="t.type">
        <i :class="['bi',icon(t.type)]" :style="'color:'+color(t.type)"></i>
        {{ t.message }}
      </div>
    </div>
  `
};