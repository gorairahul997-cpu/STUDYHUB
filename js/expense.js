/* ============================================
   EXPENSE.JS — Expense Tracker
   Data key: expense_entries = [{id, name, amount, category, date, notes, emoji}]
   ============================================ */

const Expense = {

  _viewMonth: null,   // "YYYY-MM"
  _filter: 'all',    // current category filter

  CATEGORIES: [
    { id: 'food',        label: 'Food & Drinks',   emoji: '🍔', color: '#F59E0B', bg: '#FEF3C7' },
    { id: 'travel',      label: 'Travel',           emoji: '🚌', color: '#3B82F6', bg: '#DBEAFE' },
    { id: 'stationery',  label: 'Stationery',       emoji: '✏️', color: '#8B5CF6', bg: '#EDE9FE' },
    { id: 'tuition',     label: 'Tuition/Fees',     emoji: '🎓', color: '#10B981', bg: '#D1FAE5' },
    { id: 'shopping',    label: 'Shopping',         emoji: '🛍️', color: '#EC4899', bg: '#FCE7F3' },
    { id: 'health',      label: 'Health',           emoji: '💊', color: '#EF4444', bg: '#FEE2E2' },
    { id: 'entertainment',label: 'Entertainment',   emoji: '🎮', color: '#06B6D4', bg: '#CFFAFE' },
    { id: 'other',       label: 'Other',            emoji: '💸', color: '#9CA3AF', bg: '#F3F4F6' },
  ],

  init() {
    const now = new Date();
    this._viewMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    this._filter = 'all';
    this.render();
  },

  /* ---- HELPERS ---- */

  _cat(id) {
    return this.CATEGORIES.find(c => c.id === id) || this.CATEGORIES[this.CATEGORIES.length - 1];
  },

  _monthLabel(key) {
    const [y, m] = key.split('-');
    return new Date(parseInt(y), parseInt(m)-1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  },

  _prevMonth(key) {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m-2, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },

  _nextMonth(key) {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },

  _entriesForMonth() {
    const all = Store.get('expense_entries', []);
    return all.filter(e => {
      const mk = e.date ? e.date.slice(0,7) : '';
      return mk === this._viewMonth;
    });
  },

  _filteredEntries() {
    const entries = this._entriesForMonth();
    if (this._filter === 'all') return entries;
    return entries.filter(e => e.category === this._filter);
  },

  _totalFor(entries) {
    return entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  },

  _statsForMonth(entries) {
    const stats = {};
    this.CATEGORIES.forEach(c => stats[c.id] = 0);
    entries.forEach(e => {
      const cid = e.category || 'other';
      stats[cid] = (stats[cid] || 0) + (Number(e.amount) || 0);
    });
    return stats;
  },

  /* ---- RENDER ---- */

  render() {
    const el = document.getElementById('page-expense');
    if (!el) return;
    const entries = this._entriesForMonth();
    const total = this._totalFor(entries);
    const catStats = this._statsForMonth(entries);

    /* quick top-4 category totals for stat strip */
    const topCats = ['food','travel','stationery','other'];

    el.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-eyebrow">Finance</div>
            <div class="page-title">💸 Expense Tracker</div>
            <div class="page-subtitle">Log and analyse your daily spending — ${this._monthLabel(this._viewMonth)}</div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="Expense.exportCSV()">⬇️ Export CSV</button>
            <button class="btn btn-primary" onclick="Expense.openAdd()">＋ Add Expense</button>
          </div>
        </div>
      </div>

      <!-- Stats Strip -->
      <div class="exp-stats-strip">
        <div class="exp-stat-card">
          <div class="exp-stat-icon total">💸</div>
          <div>
            <div class="exp-stat-value" style="color:var(--accent)">₹${total.toLocaleString('en-IN')}</div>
            <div class="exp-stat-label">Total Spent</div>
          </div>
        </div>
        <div class="exp-stat-card">
          <div class="exp-stat-icon food">🍔</div>
          <div>
            <div class="exp-stat-value">₹${catStats['food'].toLocaleString('en-IN')}</div>
            <div class="exp-stat-label">Food & Drinks</div>
          </div>
        </div>
        <div class="exp-stat-card">
          <div class="exp-stat-icon travel">🚌</div>
          <div>
            <div class="exp-stat-value">₹${catStats['travel'].toLocaleString('en-IN')}</div>
            <div class="exp-stat-label">Travel</div>
          </div>
        </div>
        <div class="exp-stat-card">
          <div class="exp-stat-icon other">💸</div>
          <div>
            <div class="exp-stat-value">₹${(total - catStats['food'] - catStats['travel']).toLocaleString('en-IN')}</div>
            <div class="exp-stat-label">Everything Else</div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="exp-toolbar">
        <div class="exp-filter-pills">
          <button class="exp-pill ${this._filter==='all'?'active':''}" onclick="Expense._setFilter('all')">All</button>
          ${this.CATEGORIES.map(c =>
            `<button class="exp-pill ${this._filter===c.id?'active':''}" onclick="Expense._setFilter('${c.id}')" style="${this._filter===c.id?`background:${c.bg};border-color:${c.color};color:${c.color}`:''}">
              ${c.emoji} ${c.label}
            </button>`
          ).join('')}
        </div>
        <div class="exp-month-nav">
          <button onclick="Expense._shiftMonth(-1)" title="Previous Month">‹</button>
          <div class="exp-month-display">${this._monthLabel(this._viewMonth)}</div>
          <button onclick="Expense._shiftMonth(1)" title="Next Month">›</button>
        </div>
      </div>

      <!-- Main layout -->
      <div class="exp-main-layout">
        <!-- Category Breakdown -->
        <div class="exp-breakdown-card">
          <div class="exp-breakdown-title">📊 Breakdown</div>
          <div class="exp-donut" id="expDonut">
            <div class="exp-donut-hole">
              <div class="exp-donut-total">₹${total > 0 ? this._shortNum(total) : '0'}</div>
              <div class="exp-donut-label">Total</div>
            </div>
          </div>
          <div class="exp-cat-list">
            ${this.CATEGORIES.map(c => {
              const amt = catStats[c.id] || 0;
              const pct = total > 0 ? Math.round((amt/total)*100) : 0;
              return `
                <div class="exp-cat-row">
                  <div class="exp-cat-dot" style="background:${c.color}"></div>
                  <div style="flex:1">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                      <span class="exp-cat-name">${c.emoji} ${c.label}</span>
                      <span class="exp-cat-amount">₹${amt.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="exp-cat-bar">
                      <div class="exp-cat-bar-fill" style="width:${pct}%;background:${c.color}"></div>
                    </div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Entry List -->
        <div class="exp-list-card">
          <div class="exp-list-header">
            <div class="exp-list-title">📋 Transactions</div>
            <span style="font-size:var(--text-xs);color:var(--text-muted);font-weight:600">${this._filteredEntries().length} entries</span>
          </div>
          <div class="exp-entry-list" id="expEntryList"></div>
        </div>
      </div>
    `;

    this._renderDonut(catStats, total);
    this._renderEntries();
  },

  _shortNum(n) {
    if (n >= 1000) return (n/1000).toFixed(1).replace(/\.0$/,'') + 'k';
    return n.toLocaleString('en-IN');
  },

  _renderDonut(catStats, total) {
    const donut = document.getElementById('expDonut');
    if (!donut) return;
    if (total === 0) {
      donut.style.background = 'var(--border)';
      return;
    }
    let gradient = '';
    let acc = 0;
    this.CATEGORIES.forEach(c => {
      const amt = catStats[c.id] || 0;
      if (!amt) return;
      const pct = (amt / total) * 100;
      gradient += `${c.color} ${acc.toFixed(1)}% ${(acc + pct).toFixed(1)}%, `;
      acc += pct;
    });
    gradient = gradient.slice(0, -2); // remove trailing comma
    donut.style.background = `conic-gradient(${gradient})`;
  },

  _renderEntries() {
    const list = document.getElementById('expEntryList');
    if (!list) return;
    const filtered = this._filteredEntries()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state" style="padding:var(--space-12) var(--space-6)">
          <span class="empty-state-icon">📭</span>
          <div class="empty-state-title">No expenses ${this._filter !== 'all' ? 'in this category' : 'this month'}</div>
          <p class="empty-state-desc">Start logging your daily expenses to see a full breakdown here.</p>
          <button class="btn btn-primary" onclick="Expense.openAdd()">＋ Add Expense</button>
        </div>`;
      return;
    }

    /* Group by date */
    const grouped = {};
    filtered.forEach(e => {
      const d = e.date || 'Unknown';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(e);
    });

    list.innerHTML = Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).map(date => {
      const dayEntries = grouped[date];
      const dayTotal = this._totalFor(dayEntries);
      return `
        <div class="exp-date-group-label">
          ${formatDate(date)} &nbsp;·&nbsp; ₹${dayTotal.toLocaleString('en-IN')}
        </div>
        ${dayEntries.map(e => {
          const cat = this._cat(e.category);
          const allEntries = Store.get('expense_entries', []);
          const globalIdx = allEntries.findIndex(x => x.id === e.id);
          return `
            <div class="exp-entry-row">
              <div class="exp-entry-icon" style="background:${cat.bg}">${e.emoji || cat.emoji}</div>
              <div class="exp-entry-info">
                <div class="exp-entry-name">${e.name}</div>
                <div class="exp-entry-meta">
                  <span class="exp-cat-tag" style="background:${cat.bg};color:${cat.color}">${cat.emoji} ${cat.label}</span>
                  ${e.notes ? ` · ${e.notes}` : ''}
                </div>
              </div>
              <div class="exp-entry-amount">₹${Number(e.amount).toLocaleString('en-IN')}</div>
              <div class="exp-entry-actions">
                <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="Expense.openEdit(${globalIdx})">✏️</button>
                <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="Expense.deleteEntry(${globalIdx})">🗑️</button>
              </div>
            </div>`;
        }).join('')}`;
    }).join('');
  },

  /* ---- FILTER & MONTH NAV ---- */

  _setFilter(cat) {
    this._filter = cat;
    this.render();
  },

  _shiftMonth(dir) {
    this._viewMonth = dir < 0 ? this._prevMonth(this._viewMonth) : this._nextMonth(this._viewMonth);
    this.render();
  },

  /* ---- ADD EXPENSE ---- */

  openAdd() {
    this._openForm(null);
  },

  openEdit(idx) {
    this._openForm(idx);
  },

  _openForm(editIdx) {
    const isEdit = editIdx !== null && editIdx !== undefined;
    const all = Store.get('expense_entries', []);
    const entry = isEdit ? all[editIdx] : null;

    openModal(`
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label class="form-label">Description</label>
            <input class="form-control" id="exp-name" placeholder="e.g. Lunch at canteen" value="${entry?.name||''}" />
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Amount (₹)</label>
            <input class="form-control" id="exp-amount" type="number" min="0" placeholder="0.00" value="${entry?.amount||''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-control" id="exp-category">
              ${this.CATEGORIES.map(c =>
                `<option value="${c.id}" ${entry?.category===c.id?'selected':''}>${c.emoji} ${c.label}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-control" id="exp-date" value="${entry?.date||todayStr()}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Custom Emoji (optional)</label>
          <div class="emoji-options" id="exp-emoji-picker">
            ${['🍔','☕','🍕','🌮','🚌','🚕','📚','✏️','🎮','💊','👕','🛍️','🎬','🎵','💸','📱','🍦','🥤'].map(em =>
              `<div class="emoji-opt ${(entry?.emoji||'') === em ? 'selected' : ''}" onclick="Expense._pickEmoji(this,'${em}')">${em}</div>`
            ).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <input class="form-control" id="exp-notes" placeholder="e.g. Paid by UPI, shared with friend" value="${entry?.notes||''}" />
        </div>
      </div>
      <div class="modal-footer">
        ${isEdit ? `<button class="btn btn-danger" onclick="Expense.deleteEntry(${editIdx})">Delete</button>` : ''}
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Expense.saveEntry(${isEdit ? editIdx : 'null'})">
          ${isEdit ? 'Save Changes' : 'Add Expense'}
        </button>
      </div>
    `, `${isEdit ? '✏️ Edit' : '＋ Add'} Expense`);

    this._pickedEmoji = entry?.emoji || '';
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  _pickedEmoji: '',
  _pickEmoji(el, em) {
    document.querySelectorAll('#exp-emoji-picker .emoji-opt').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
    this._pickedEmoji = em;
  },

  saveEntry(editIdx) {
    const name   = document.getElementById('exp-name')?.value.trim();
    const amount = document.getElementById('exp-amount')?.value.trim();
    const cat    = document.getElementById('exp-category')?.value;
    const date   = document.getElementById('exp-date')?.value;
    const notes  = document.getElementById('exp-notes')?.value.trim();

    if (!name)   { showToast('Enter a description', 'error'); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showToast('Enter a valid amount', 'error'); return;
    }

    const entry = {
      id:       editIdx !== null ? (Store.get('expense_entries', [])[editIdx]?.id || uid()) : uid(),
      name,
      amount:   Number(amount),
      category: cat || 'other',
      date:     date || todayStr(),
      notes,
      emoji:    this._pickedEmoji || '',
    };

    const all = Store.get('expense_entries', []);

    if (editIdx !== null && editIdx !== undefined) {
      all[editIdx] = entry;
      showToast('Expense updated!', 'success');
    } else {
      all.push(entry);
      showToast('Expense added!', 'success');
    }

    Store.set('expense_entries', all);
    closeModal();
    this.render();
  },

  deleteEntry(idx) {
    const all = Store.get('expense_entries', []);
    const name = all[idx]?.name || 'this expense';
    if (!confirm(`Delete "${name}"?`)) return;
    all.splice(idx, 1);
    Store.set('expense_entries', all);
    closeModal();
    this.render();
    showToast('Expense deleted', 'info');
  },

  /* ---- EXPORT CSV ---- */

  exportCSV() {
    const all = Store.get('expense_entries', []);
    if (!all.length) { showToast('No expenses to export', 'error'); return; }
    const rows = all.map(e => [e.name, e.amount, e.category, e.date, e.notes||'']);
    const csv = [['Description','Amount','Category','Date','Notes'], ...rows]
      .map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'expenses.csv'; a.click(); URL.revokeObjectURL(url);
    showToast('Exported as expenses.csv!', 'success');
  }
};
