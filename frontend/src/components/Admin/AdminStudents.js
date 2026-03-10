const AdminStudents = {
  name: 'AdminStudents',
  data() {
    return {
      students: [], loading: true, search: '',
      acting: null, editStudent: null, editForm: {}
    };
  },
  async mounted() { await this.load(); },
  methods: {
    async load() {
      try { const r = await api.adminStudents(); this.students = r.data || []; }
      catch(e) { store.error('Failed to load students'); }
      finally { this.loading = false; }
    },
    async toggleBlacklist(s) {
      this.acting = s.id;
      try {
        const val = !s.is_blacklisted;
        await api.blacklistStudent(s.id, val);
        s.is_blacklisted = val;
        store.success(val ? 'Student deactivated' : 'Student activated');
      } catch(e) { store.error('Failed'); } finally { this.acting = null; }
    },
    async deleteStudent(s) {
      if (!confirm('Delete ' + s.name + '? This cannot be undone.')) return;
      this.acting = s.id;
      try {
        await axios.delete(API_BASE + '/admin/students/' + s.id);
        this.students = this.students.filter(x => x.id !== s.id);
        store.success('Student deleted.');
      } catch(e) { store.error(e.response?.data?.error || 'Failed to delete'); } finally { this.acting = null; }
    },
    openEdit(s) {
      this.editStudent = s;
      this.editForm = { name: s.name, branch: s.branch, year: s.year, cgpa: s.cgpa, phone: s.phone, roll_number: s.roll_number };
    },
    async saveEdit() {
      this.acting = this.editStudent.id;
      try {
        await axios.put(API_BASE + '/admin/students/' + this.editStudent.id, this.editForm);
        Object.assign(this.editStudent, this.editForm);
        store.success('Student updated!');
        this.editStudent = null;
      } catch(e) { store.error(e.response?.data?.error || 'Failed to update'); } finally { this.acting = null; }
    },
    fdate(d) { return d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'; },
    branches() { return ['CSE','ECE','EEE','IT','ME','CE','CH','BT','MCA','MBA']; },
    exportCSV() {
      const headers = ['ID','Name','Email','Roll Number','Branch','Year','CGPA','Phone','Status','Registered'];
      const rows = this.filtered.map(s => [
        s.id,
        s.name || '',
        s.email || '',
        s.roll_number || '',
        s.branch || '',
        s.year || '',
        s.cgpa || '',
        s.phone || '',
        s.is_blacklisted ? 'Deactivated' : 'Active',
        this.fdate(s.created_at)
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'students.csv'; a.click();
      URL.revokeObjectURL(url);
    }
  },
  computed: {
    filtered() {
      const q = this.search.toLowerCase();
      return this.students.filter(s =>
        !q || s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.roll_number?.toLowerCase().includes(q)
      );
    }
  },
  template: `
    <div class="app-shell">
      <Sidebar/>
      <div class="main-wrap" style="margin-left:260px;margin-top:60px;">
        <div class="topbar">
          <div class="topbar-left">
            <div class="page-heading">Registered Students</div>
            <div class="page-sub">Search, edit, or manage student accounts.</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <input v-model="search" placeholder="Search by name, email..."
              style="border:1px solid #e5e7eb;border-radius:8px;padding:8px 14px;font-size:0.85rem;font-family:Inter,sans-serif;outline:none;width:240px;"/>
            <button style="background:#5b21b6;border:none;border-radius:8px;padding:9px 12px;cursor:pointer;color:white;font-size:0.9rem;">
              <i class="bi bi-search"></i>
            </button>
            <button @click="exportCSV"
              style="background:#15803d;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;color:white;font-size:0.85rem;font-weight:700;font-family:Inter,sans-serif;display:flex;align-items:center;gap:6px;">
              <i class="bi bi-file-earmark-spreadsheet"></i> Export CSV
            </button>
          </div>
        </div>

        <div class="page-body">
          <div v-if="loading" class="loading-box"><div class="spinner"></div></div>

          <div v-else class="card-box">
            <div v-if="filtered.length===0" style="text-align:center;padding:40px;color:#9ca3af;">No students found.</div>
            <table v-else class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>STUDENT</th>
                  <th>BRANCH</th>
                  <th>CGPA</th>
                  <th>REGISTERED</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in filtered" :key="s.id">
                  <td style="color:#9ca3af;font-weight:600;">{{ s.id }}</td>
                  <td>
                    <div style="font-weight:700;color:#1a1d23;">{{ s.name || '—' }}</div>
                    <div style="font-size:0.76rem;color:#9ca3af;">{{ s.email || '' }}</div>
                  </td>
                  <td style="font-size:0.86rem;color:#374151;">{{ s.branch || '—' }}</td>
                  <td>
                    <span :style="'font-weight:700;color:'+(s.cgpa>=8?'#15803d':s.cgpa>=6?'#d97706':'#dc2626')">
                      {{ s.cgpa || '—' }}
                    </span>
                  </td>
                  <td style="font-size:0.82rem;color:#6b7280;">{{ fdate(s.created_at) }}</td>
                  <td>
                    <span :class="s.is_blacklisted ? 'badge badge-red' : 'badge badge-green'">
                      {{ s.is_blacklisted ? 'Deactivated' : 'Active' }}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <!-- Eye: view profile -->
                      <button @click="$router.push('/admin/students/'+s.id)"
                        style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:7px;padding:5px 9px;cursor:pointer;color:#5b21b6;font-size:0.85rem;"
                        title="View">
                        <i class="bi bi-eye"></i>
                      </button>
                      <!-- Edit pencil -->
                      <button @click="openEdit(s)"
                        style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:7px;padding:5px 9px;cursor:pointer;color:#15803d;font-size:0.85rem;"
                        title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <!-- Deactivate / Activate -->
                      <button @click="toggleBlacklist(s)" :disabled="acting===s.id"
                        :style="s.is_blacklisted
                          ? 'background:#f5f3ff;border:1px solid #5b21b6;border-radius:7px;padding:5px 10px;cursor:pointer;color:#5b21b6;font-size:0.78rem;font-weight:700;font-family:Inter,sans-serif;'
                          : 'background:#fff7ed;border:1px solid #fb923c;border-radius:7px;padding:5px 10px;cursor:pointer;color:#ea580c;font-size:0.78rem;font-weight:700;font-family:Inter,sans-serif;'">
                        {{ s.is_blacklisted ? 'Activate' : 'Deactivate' }}
                      </button>
                      <!-- Delete -->
                      <button @click="deleteStudent(s)" :disabled="acting===s.id"
                        style="background:#fef2f2;border:1px solid #fecaca;border-radius:7px;padding:5px 9px;cursor:pointer;color:#dc2626;font-size:0.85rem;"
                        title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <div v-if="editStudent" class="modal-overlay" @click.self="editStudent=null">
        <div class="modal-box" style="max-width:480px;">
          <div class="modal-head">
            <span class="modal-title"><i class="bi bi-pencil me-2"></i>Edit Student</span>
            <button @click="editStudent=null" style="border:none;background:transparent;cursor:pointer;font-size:1.2rem;color:#6b7280;"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-7">
                <label class="field-label">Full Name</label>
                <input v-model="editForm.name" class="field-input" placeholder="Full name"/>
              </div>
              <div class="col-md-5">
                <label class="field-label">Roll Number</label>
                <input v-model="editForm.roll_number" class="field-input" placeholder="Roll no"/>
              </div>
              <div class="col-md-4">
                <label class="field-label">Branch</label>
                <select v-model="editForm.branch" class="field-select">
                  <option value="">Select</option>
                  <option v-for="b in branches()" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="field-label">Year</label>
                <select v-model="editForm.year" class="field-select">
                  <option value="">Select</option>
                  <option v-for="y in [1,2,3,4]" :key="y" :value="y">Year {{ y }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="field-label">CGPA</label>
                <input v-model="editForm.cgpa" type="number" step="0.1" min="0" max="10" class="field-input"/>
              </div>
              <div class="col-md-6">
                <label class="field-label">Phone</label>
                <input v-model="editForm.phone" class="field-input" placeholder="Phone"/>
              </div>
            </div>
          </div>
          <div class="modal-foot">
            <button @click="editStudent=null" class="btn-view">Cancel</button>
            <button @click="saveEdit" :disabled="acting===editStudent?.id"
              style="background:#5b21b6;border:none;border-radius:8px;color:white;font-weight:700;padding:8px 22px;cursor:pointer;font-family:Inter,sans-serif;font-size:0.88rem;">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  `
};