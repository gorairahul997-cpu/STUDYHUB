/* ============================================
   SETTINGS.JS — App Customization
   ============================================ */

const Settings = {
  currentSection: 'profile',
  accentColors: [
    { name: 'Violet',  hex: '#6C63FF' },
    { name: 'Rose',    hex: '#F43F5E' },
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Amber',   hex: '#F59E0B' },
    { name: 'Sky',     hex: '#0EA5E9' },
    { name: 'Purple',  hex: '#A855F7' },
    { name: 'Orange',  hex: '#F97316' },
    { name: 'Teal',    hex: '#14B8A6' },
  ],

  init() { this.render(); },

  render() {
    const el = document.getElementById('page-settings');
    el.innerHTML = `
      <div class="page-header">
        <div class="page-eyebrow">Settings</div>
        <div class="page-title">⚙️ Settings</div>
        <div class="page-subtitle">Customize StudyDesk to match your style</div>
      </div>
      <div class="settings-layout">
        <div class="settings-nav">
          ${[
            {id:'profile', icon:'👤', label:'Profile'},
            {id:'appearance', icon:'🎨', label:'Appearance'},
            {id:'calendar', icon:'📅', label:'Calendar'},
            {id:'data', icon:'💾', label:'Data'},
            {id:'about', icon:'ℹ️', label:'About'},
          ].map(s => `
            <button class="settings-nav-item ${this.currentSection===s.id?'active':''}" onclick="Settings.setSection('${s.id}')">
              <span>${s.icon}</span> ${s.label}
            </button>
          `).join('')}
        </div>
        <div class="settings-content" id="settingsContent"></div>
      </div>
    `;
    this.renderSection();
  },

  setSection(id) {
    this.currentSection = id;
    document.querySelectorAll('.settings-nav-item').forEach(el => {
      el.classList.toggle('active', el.textContent.includes(id.charAt(0).toUpperCase() + id.slice(1)) ||
        el.onclick?.toString().includes(`'${id}'`));
    });
    // Re-activate current
    document.querySelectorAll('.settings-nav-item').forEach(el => {
      el.classList.remove('active');
      if (el.getAttribute('onclick')?.includes(`'${id}'`)) el.classList.add('active');
    });
    this.renderSection();
  },

  renderSection() {
    const content = document.getElementById('settingsContent');
    const s = Store.get('settings', {});
    switch (this.currentSection) {
      case 'profile': content.innerHTML = this.renderProfile(s); break;
      case 'appearance': content.innerHTML = this.renderAppearance(s); break;
      case 'calendar': content.innerHTML = this.renderCalendar(s); break;
      case 'data': content.innerHTML = this.renderData(); break;
      case 'about': content.innerHTML = this.renderAbout(); break;
    }
  },

  renderProfile(s) {
    return `
      <div class="settings-section">
        <div class="settings-section-title">👤 Student Profile</div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Your Name</div>
            <div class="settings-item-desc">Used in the greeting on the Dashboard</div>
          </div>
          <div class="settings-item-control">
            <input class="form-control" id="set-name" value="${s.studentName||''}" placeholder="Enter your name" style="min-width:200px" />
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Class / Section</div>
            <div class="settings-item-desc">Your class and section (e.g. 12A)</div>
          </div>
          <div class="settings-item-control">
            <input class="form-control" id="set-class" value="${s.className||''}" placeholder="e.g. 12-A" style="min-width:120px" />
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">School Name</div>
          </div>
          <div class="settings-item-control">
            <input class="form-control" id="set-school" value="${s.school||''}" placeholder="School name" style="min-width:200px" />
          </div>
        </div>
        <div class="settings-item" style="border-bottom:none">
          <div class="settings-item-info"></div>
          <div class="settings-item-control">
            <button class="btn btn-primary" onclick="Settings.saveProfile()">Save Profile</button>
          </div>
        </div>
      </div>
    `;
  },

  saveProfile() {
    const s = Store.get('settings', {});
    s.studentName = document.getElementById('set-name').value.trim();
    s.className = document.getElementById('set-class').value.trim();
    s.school = document.getElementById('set-school').value.trim();
    Store.set('settings', s);
    showToast('Profile saved!', 'success');
    // Refresh dashboard greeting
    if (document.getElementById('page-dashboard').classList.contains('active')) Dashboard.render();
  },

  renderAppearance(s) {
    const currentAccent = s.accentColor || '#6C63FF';
    const currentSize = s.fontSize || 'normal';
    return `
      <div class="settings-section">
        <div class="settings-section-title">🎨 Appearance</div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Accent Color</div>
            <div class="settings-item-desc">Changes the primary brand color throughout the app</div>
          </div>
          <div class="settings-item-control">
            <div class="accent-color-grid">
              ${this.accentColors.map(c => `
                <div class="accent-swatch ${currentAccent===c.hex?'selected':''}"
                  style="background:${c.hex}"
                  title="${c.name}"
                  onclick="Settings.applyAccent('${c.hex}', this)">
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Font Size</div>
            <div class="settings-item-desc">Adjust the base text size</div>
          </div>
          <div class="settings-item-control">
            <div class="font-size-toggle">
              <button class="font-toggle-btn ${currentSize==='small'?'active':''}" onclick="Settings.applyFontSize('small', this, 14)">Small</button>
              <button class="font-toggle-btn ${currentSize==='normal'?'active':''}" onclick="Settings.applyFontSize('normal', this, 16)">Normal</button>
              <button class="font-toggle-btn ${currentSize==='large'?'active':''}" onclick="Settings.applyFontSize('large', this, 18)">Large</button>
            </div>
          </div>
        </div>
        <div class="settings-item" style="border-bottom:none">
          <div class="settings-item-info">
            <div class="settings-item-label">Sidebar Width</div>
            <div class="settings-item-desc">Toggle between compact and full sidebar</div>
          </div>
          <div class="settings-item-control">
            <button class="btn btn-secondary btn-sm" onclick="App.toggleSidebarCompact()">Toggle Compact</button>
          </div>
        </div>
      </div>
    `;
  },

  applyAccent(hex, el) {
    document.querySelectorAll('.accent-swatch').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    document.documentElement.style.setProperty('--accent', hex);
    // Compute light variant
    document.documentElement.style.setProperty('--accent-dark', hex);
    const s = Store.get('settings', {});
    s.accentColor = hex;
    Store.set('settings', s);
    showToast('Accent color applied!', 'success');
  },

  applyFontSize(size, el, px) {
    document.querySelectorAll('.font-toggle-btn').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
    document.documentElement.style.fontSize = px + 'px';
    const s = Store.get('settings', {});
    s.fontSize = size;
    s.fontSizePx = px;
    Store.set('settings', s);
    showToast('Font size changed!', 'success');
  },

  renderCalendar(s) {
    return `
      <div class="settings-section">
        <div class="settings-section-title">📅 Calendar Preferences</div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">First Day of Week</div>
            <div class="settings-item-desc">Currently set to Sunday</div>
          </div>
          <div class="settings-item-control">
            <span class="badge badge-accent">Sunday (default)</span>
          </div>
        </div>
        <div class="settings-item" style="border-bottom:none">
          <div class="settings-item-info">
            <div class="settings-item-label">Show Tuitions on Calendar</div>
            <div class="settings-item-desc">Automatically display tuition schedule on calendar days</div>
          </div>
          <div class="settings-item-control">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="set-tuitions-cal" ${s.showTuitionsOnCal!==false?'checked':''} onchange="Settings.savePref('showTuitionsOnCal',this.checked)" style="width:16px;height:16px;accent-color:var(--accent)" />
              <span style="font-size:0.85rem;font-weight:600">Enabled</span>
            </label>
          </div>
        </div>
      </div>
    `;
  },

  savePref(key, val) {
    const s = Store.get('settings', {});
    s[key] = val;
    Store.set('settings', s);
    showToast('Setting saved!', 'success');
  },

  renderData() {
    const allData = Store.exportAll();
    const size = JSON.stringify(allData).length;
    const sizeKB = (size / 1024).toFixed(1);
    const isSynced = !!Store.syncDirHandle;
    return `
      <div class="settings-section">
        <div class="settings-section-title">💾 Data Management</div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Offline Auto-Sync</div>
            <div class="settings-item-desc">Prevent data loss from cache clears by syncing to a local folder</div>
          </div>
          <div class="settings-item-control" style="display:flex; align-items:center; gap:8px;">
            ${isSynced 
              ? `<span class="badge badge-accent">Linked ✅</span>
                 <button class="btn btn-secondary btn-sm" onclick="Settings.unlinkFolder()">Unlink</button>`
              : `<button class="btn btn-primary btn-sm" onclick="Settings.linkFolder()">Link Sync Folder</button>`
            }
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Storage Used</div>
            <div class="settings-item-desc">All data stored locally in your browser</div>
          </div>
          <div class="settings-item-control">
            <span class="badge badge-blue">~${sizeKB} KB</span>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Export All Data</div>
            <div class="settings-item-desc">Download a JSON backup of all your data</div>
          </div>
          <div class="settings-item-control">
            <button class="btn btn-secondary btn-sm" onclick="Settings.exportJSON()">⬇️ Export JSON</button>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Import Data</div>
            <div class="settings-item-desc">Restore from a previously exported backup</div>
          </div>
          <div class="settings-item-control">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('jsonImport').click()">⬆️ Import JSON</button>
            <input type="file" id="jsonImport" accept=".json" style="display:none" onchange="Settings.importJSON(this)" />
          </div>
        </div>
        <div class="settings-item" style="border-bottom:none">
          <div class="settings-item-info">
            <div class="settings-item-label">Clear All Data</div>
            <div class="settings-item-desc">⚠️ This will permanently delete all your data</div>
          </div>
          <div class="settings-item-control">
            <button class="btn btn-danger btn-sm" onclick="Settings.clearAll()">🗑️ Clear All</button>
          </div>
        </div>
      </div>
    `;
  },

  async linkFolder() {
    const success = await Store.linkSyncFolder();
    if (success) this.renderSection();
  },

  async unlinkFolder() {
    const success = await Store.unlinkSyncFolder();
    if (success) this.renderSection();
  },

  exportJSON() {
    const data = Store.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studydesk-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!', 'success');
  },

  importJSON(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        Store.importAll(data);
        showToast('Data imported successfully!', 'success');
        setTimeout(() => window.location.reload(), 500);
      } catch { showToast('Invalid backup file', 'error'); }
    };
    reader.readAsText(file);
    input.value = '';
  },

  clearAll() {
    if (!confirm('Are you sure you want to delete ALL your data? This cannot be undone.')) return;
    if (!confirm('Second confirmation: This will erase ALL subjects, exams, events, and tuitions!')) return;
    Store.clearAll();
    showToast('All data cleared', 'info');
    setTimeout(() => window.location.reload(), 500);
  },

  renderAbout() {
    return `
      <div class="settings-section">
        <div class="about-card">
          <div class="about-icon" style="background:transparent overflow:hidden; display:flex; align-items:center; justify-content:center;">
             <img src="assets/logo.png" alt="Logo" style="width:64px; height:64px; object-fit:cover; border-radius:12px;" />
          </div>
          <div class="about-app-name">StudyDesk</div>
          <p class="about-desc">A premium student organizer built for Class 12 students. Track subjects, exams, tuitions, and more — all in one place.</p>
          <div class="about-version">Version 1.0 · Built with ❤️ for students</div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">📋 Features</div>
        ${[
          ['🏠 Dashboard', 'Overview of your day with quick stats and event preview'],
          ['📌 My Board', 'Mac-inspired Dock and Note Cards slider with drag-to-reorder'],
          ['📅 Calendar', 'Full calendar with color-coded homework, tuition, exam events'],
          ['📚 Subjects', 'Track subjects, topics, and progress with color themes'],
          ['📝 Exams', 'Countdown tracker for upcoming exams with urgency indicators'],
          ['🎓 Tuitions', 'Schedule table with CSV export & import'],
        ].map(([title, desc]) => `
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-label">${title}</div>
              <div class="settings-item-desc">${desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  applyStoredSettings() {
    const s = Store.get('settings', {});
    if (s.accentColor) {
      document.documentElement.style.setProperty('--accent', s.accentColor);
    }
    if (s.fontSizePx) {
      document.documentElement.style.fontSize = s.fontSizePx + 'px';
    }
  }
};
