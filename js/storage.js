/* ============================================
   STORAGE.JS — localStorage abstraction
   ============================================ */

// Lightweight IndexedDB wrapper for storing File System handles
const idbSync = {
  db: null,
  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('StudyDeskDB_Sync', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(this.db); };
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('handles');
      };
    });
  },
  async get(key) {
    try {
      const db = await this.init();
      return new Promise((resolve) => {
        const tx = db.transaction('handles', 'readonly');
        const store = tx.objectStore('handles');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });
    } catch { return null; }
  },
  async set(key, value) {
    try {
      const db = await this.init();
      return new Promise((resolve) => {
        const tx = db.transaction('handles', 'readwrite');
        const store = tx.objectStore('handles');
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch {}
  },
  async remove(key) {
    try {
      const db = await this.init();
      return new Promise((resolve) => {
        const tx = db.transaction('handles', 'readwrite');
        const store = tx.objectStore('handles');
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch {}
  }
};

const Store = {
  syncDirHandle: null,
  syncTimeout: null,

  async initSync() {
    try {
      const handle = await idbSync.get('syncDirHandle');
      if (handle) {
        this.syncDirHandle = handle;
      }
    } catch (e) {
      console.error('Failed to init sync:', e);
    }
  },

  async verifyPermission() {
    if (!this.syncDirHandle) return false;
    const opts = { mode: 'readwrite' };
    if ((await this.syncDirHandle.queryPermission(opts)) === 'granted') return true;
    if ((await this.syncDirHandle.requestPermission(opts)) === 'granted') return true;
    return false;
  },

  async linkSyncFolder() {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'studydesk_sync', startIn: 'documents' });
      this.syncDirHandle = dirHandle;
      await idbSync.set('syncDirHandle', dirHandle);
      
      try {
        const fileHandle = await dirHandle.getFileHandle('studydesk_sync.json');
        const file = await fileHandle.getFile();
        const text = await file.text();
        if (text) {
          const data = JSON.parse(text);
          if (Object.keys(data).length > 0) {
            if (confirm('Backup file found in this folder. Restore it now? (Current data will be overwritten)')) {
               this.importAll(data);
               showToast('Data restored from folder!', 'success');
               setTimeout(() => window.location.reload(), 1000);
               return true;
            }
          }
        }
      } catch (e) {}
      
      showToast('Sync folder linked successfully!', 'success');
      this.triggerSync();
      return true;
    } catch (err) {
      console.error(err);
      if (err.name !== 'AbortError') showToast('Failed to link folder', 'error');
      return false;
    }
  },

  async unlinkSyncFolder() {
    if (!confirm("Are you sure you want to stop syncing to this folder?")) return false;
    this.syncDirHandle = null;
    await idbSync.remove('syncDirHandle');
    showToast('Sync folder unlinked.', 'info');
    return true;
  },

  async triggerSync() {
    if (!this.syncDirHandle) return;
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(async () => {
      try {
        if (!(await this.verifyPermission())) return;
        const fileHandle = await this.syncDirHandle.getFileHandle('studydesk_sync.json', { create: true });
        const writable = await fileHandle.createWritable();
        const data = this.exportAll();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
      } catch (err) {
        console.error('Auto-sync failed:', err);
      }
    }, 2000); // 2 second debounce
  },

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem('studydesk_' + key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch { return defaultValue; }
  },

  set(key, value) {
    try {
      localStorage.setItem('studydesk_' + key, JSON.stringify(value));
      if (this.triggerSync) this.triggerSync();
      return true;
    } catch { return false; }
  },

  remove(key) {
    localStorage.removeItem('studydesk_' + key);
    if (this.triggerSync) this.triggerSync();
  },

  exportAll() {
    const data = {};
    const prefix = 'studydesk_';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        try { data[key.slice(prefix.length)] = JSON.parse(localStorage.getItem(key)); }
        catch { data[key.slice(prefix.length)] = localStorage.getItem(key); }
      }
    }
    return data;
  },

  importAll(data) {
    Object.entries(data).forEach(([key, value]) => {
      try { localStorage.setItem('studydesk_' + key, JSON.stringify(value)); } catch {}
    });
    if (this.triggerSync) this.triggerSync();
  },

  clearAll() {
    const prefix = 'studydesk_';
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i).startsWith(prefix)) keys.push(localStorage.key(i));
    }
    keys.forEach(k => localStorage.removeItem(k));
    if (this.triggerSync) this.triggerSync();
  }
};

/* ============================================
   GLOBAL UTILITIES
   ============================================ */

// Open modal with given HTML content
let lastActiveElement = null;
function openModal(contentHTML, title = '') {
  lastActiveElement = document.activeElement;
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  const box = document.getElementById('modalBox');
  content.innerHTML = (title ? `<div class="modal-title">${title}</div>` : '') + contentHTML;
  overlay.classList.add('open');
  content.scrollTop = 0;

  // Auto-focus first input
  setTimeout(() => {
    const firstInput = content.querySelector('input, textarea, select');
    if (firstInput) firstInput.focus();
  }, 100);
}

// Close modal
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  if (lastActiveElement) {
    lastActiveElement.focus();
    lastActiveElement = null;
  }
}

// Bind Enter key to a primary button in modal
function bindEnterToSubmit(containerSelector, btnSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.querySelector(btnSelector)?.click();
    }
  });
}

// Show toast
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: '💡' };
  toast.innerHTML = `<span>${icons[type] || '💡'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// Days until date
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

// Format time to 12-hour format (HH:mm -> h:mm AM/PM)
function formatTime12(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours);
  const m = minutes;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // the hour '0' should be '12'
  return `${h}:${m} ${ampm}`;
}

// Generate small unique ID
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Get current date as YYYY-MM-DD string
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
