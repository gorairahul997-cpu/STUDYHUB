/* ============================================
   PAYMENTS.JS — Sir Payment Tracker (v2)
   Fully rewritten: simple, clean, bug-free.

   Storage keys:
     payments_sirs    = [{id, name, subject, fee, emoji, color}]
     payments_records = [{id, sirId, monthKey, status, datePaid, amount, notes}]
   ============================================ */

const Payments = {

  // "YYYY-MM" for the month currently on screen
  _viewMonth: null,

  COLORS: ['#6C63FF','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6','#F97316'],
  EMOJIS: ['👨‍🏫','👩‍🏫','📐','🔬','📖','✏️','🧮','💻','🏛️','🧪','🎵','🌍'],

  /* ─────────────────── INIT ─────────────────── */

  init() {
    const now = new Date();
    this._viewMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.render();
  },

  /* ─────────────────── HELPERS ─────────────────── */

  _monthLabel(mk) {
    if (!mk) return '';
    const [y, m] = mk.split('-');
    return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  },

  _shortMonth(mk) {
    if (!mk) return '';
    const [y, m] = mk.split('-');
    return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'short' });
  },

  _shiftMK(mk, delta) {
    const [y, m] = mk.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  _todayMK() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  },

  // Get record for sirId + monthKey (returns null if not found)
  _rec(sirId, mk) {
    return (Store.get('payments_records', []))
      .find(r => r.sirId === sirId && r.monthKey === mk) || null;
  },

  // Last 6 months ending at viewMonth (oldest → newest)
  _last6() {
    const out = [];
    let cur = this._viewMonth;
    for (let i = 5; i >= 0; i--) out.push(this._shiftMK(this._viewMonth, -i));
    return out;
  },

  // Aggregate stats for the currently viewed month
  _monthStats(sirs) {
    let paid = 0, pending = 0, overdue = 0;
    let paidAmt = 0, pendingAmt = 0, overdueAmt = 0;
    sirs.forEach(s => {
      const r = this._rec(s.id, this._viewMonth);
      const fee = Number(s.fee) || 0;
      if (!r || !r.status || r.status === 'none') return;
      if (r.status === 'paid')    { paid++;    paidAmt    += r.amount != null ? Number(r.amount) : fee; }
      if (r.status === 'pending') { pending++; pendingAmt += fee; }
      if (r.status === 'overdue') { overdue++; overdueAmt += fee; }
    });
    return { paid, pending, overdue, paidAmt, pendingAmt, overdueAmt };
  },

  _fmt(n) { return Number(n || 0).toLocaleString('en-IN'); },

  /* ─────────────────── RENDER ─────────────────── */

  render() {
    const el = document.getElementById('page-payments');
    if (!el) return;

    const sirs = Store.get('payments_sirs', []);
    const st = this._monthStats(sirs);
    const isCurrentMonth = this._viewMonth === this._todayMK();

    el.innerHTML = `
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-eyebrow">Payments</div>
            <div class="page-title">💰 Sir Payment Tracker</div>
            <div class="page-subtitle">Track monthly fee payments for each tutor or sir</div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="Payments.exportCSV()">⬇️ Export CSV</button>
            <button class="btn btn-primary" onclick="Payments.openAddSir()">＋ Add Sir</button>
          </div>
        </div>
      </div>

      <!-- Month Navigator -->
      <div class="pay-nav-bar">
        <div class="pay-nav-month">📅 ${this._monthLabel(this._viewMonth)}</div>
        <div class="pay-nav-btns">
          <button class="pay-nav-btn" onclick="Payments.goMonth(-1)" title="Previous month">‹</button>
          ${!isCurrentMonth ? `<button class="pay-today-btn" onclick="Payments.goToday()">Today</button>` : ''}
          <button class="pay-nav-btn" onclick="Payments.goMonth(1)" title="Next month">›</button>
        </div>
      </div>

      <!-- Summary Row -->
      <div class="pay-summary-row">
        <div class="pay-summary-card paid">
          <div class="pay-summary-icon">✅</div>
          <div>
            <div class="pay-summary-val">₹${this._fmt(st.paidAmt)}</div>
            <div class="pay-summary-sub">${st.paid} sir${st.paid !== 1 ? 's' : ''} paid</div>
          </div>
        </div>
        <div class="pay-summary-card pending">
          <div class="pay-summary-icon">⏳</div>
          <div>
            <div class="pay-summary-val">₹${this._fmt(st.pendingAmt)}</div>
            <div class="pay-summary-sub">${st.pending} pending</div>
          </div>
        </div>
        <div class="pay-summary-card overdue">
          <div class="pay-summary-icon">❌</div>
          <div>
            <div class="pay-summary-val">₹${this._fmt(st.overdueAmt)}</div>
            <div class="pay-summary-sub">${st.overdue} overdue</div>
          </div>
        </div>
      </div>

      <!-- Sir Cards Grid -->
      <div class="pay-grid" id="payGrid"></div>
    `;

    this._renderCards(sirs);
  },

  _renderCards(sirs) {
    const grid = document.getElementById('payGrid');
    if (!grid) return;

    if (!sirs.length) {
      grid.innerHTML = `
        <div class="empty-state pay-empty">
          <span class="empty-state-icon">💸</span>
          <div class="empty-state-title">No tutors added yet</div>
          <p class="empty-state-desc">Add each sir/tutor you pay fees to, then mark payments each month.</p>
          <button class="btn btn-primary" onclick="Payments.openAddSir()">＋ Add Sir</button>
        </div>`;
      return;
    }

    grid.innerHTML = sirs.map((sir, si) => {
      const rec = this._rec(sir.id, this._viewMonth);
      const status = (rec && rec.status && rec.status !== 'none') ? rec.status : 'none';
      const months6 = this._last6();
      const avatarBg = sir.color + '22';
      const fee = Number(sir.fee) || 0;
      const paidAmt = (rec && rec.amount != null) ? Number(rec.amount) : fee;

      return `
        <div class="pay-card">
          <div class="pay-card-stripe" style="background:${sir.color}"></div>
          <div class="pay-card-body">

            <!-- Top: avatar + name + edit/delete -->
            <div class="pay-card-top">
              <div class="pay-card-left">
                <div class="pay-avatar" style="background:${avatarBg}">${sir.emoji || '👨‍🏫'}</div>
                <div style="min-width:0">
                  <div class="pay-sir-name">${sir.name}</div>
                  <div class="pay-sir-sub">${sir.subject || 'No subject set'}</div>
                </div>
              </div>
              <div class="pay-card-menu">
                <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="Payments.openEditSir(${si})">✏️</button>
                <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="Payments.deleteSir(${si})">🗑️</button>
              </div>
            </div>

            <!-- Fee row -->
            <div class="pay-fee-badge">
              <span class="pay-fee-label">Monthly Fee</span>
              <span class="pay-fee-text" style="color:${sir.color}">₹${this._fmt(fee)}</span>
            </div>

            <!-- Status: 3 click-to-set buttons -->
            <div class="pay-status-section">
              <div class="pay-status-month-label">${this._monthLabel(this._viewMonth)}</div>
              <div class="pay-status-3">
                <button class="pay-status-btn paid ${status === 'paid' ? 'active' : ''}"
                  onclick="Payments.quickSet('${sir.id}', 'paid')">
                  <span class="s-icon">✅</span>Paid
                  ${status === 'paid' ? `<span style="font-size:0.6rem;opacity:0.8">₹${this._fmt(paidAmt)}</span>` : ''}
                </button>
                <button class="pay-status-btn pending ${status === 'pending' ? 'active' : ''}"
                  onclick="Payments.quickSet('${sir.id}', 'pending')">
                  <span class="s-icon">⏳</span>Pending
                </button>
                <button class="pay-status-btn overdue ${status === 'overdue' ? 'active' : ''}"
                  onclick="Payments.quickSet('${sir.id}', 'overdue')">
                  <span class="s-icon">❌</span>Overdue
                </button>
              </div>
              ${status === 'paid'
                ? `<div style="margin-top:8px;font-size:0.75rem;color:var(--text-muted);text-align:center">
                     Paid ${rec.datePaid ? 'on ' + formatDate(rec.datePaid) : ''} ${rec.notes ? '· '+rec.notes : ''}
                     <button style="background:none;border:none;cursor:pointer;color:var(--accent);font-size:0.7rem;font-weight:700" onclick="Payments.openEditRecord('${sir.id}','${sir.name}')">Edit</button>
                   </div>`
                : `<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;font-size:0.75rem" onclick="Payments.openEditRecord('${sir.id}','${sir.name}')">＋ Add details</button>`
              }
            </div>

            <!-- Mini 6-month history strip -->
            <div class="pay-mini-history">
              ${months6.map(mk => {
                const r = this._rec(sir.id, mk);
                const s = (r && r.status && r.status !== 'none') ? r.status : 'none';
                const isCurrent = mk === this._viewMonth;
                return `<button class="pay-mini-pill ${s}" title="${this._monthLabel(mk)}: ${s}"
                  onclick="Payments._jumpMonth('${mk}')"
                  style="${isCurrent ? 'outline:2px solid var(--accent);outline-offset:1px' : ''}">
                  <div class="pill-dot"></div>
                  ${this._shortMonth(mk)}
                </button>`;
              }).join('')}
              <button class="pay-mini-pill none" title="Full history" onclick="Payments.openHistory('${sir.id}','${sir.name}')">
                <div class="pill-dot"></div>All
              </button>
            </div>

          </div>
        </div>`;
    }).join('');
  },

  /* ─────────────────── NAVIGATION ─────────────────── */

  goMonth(dir) {
    this._viewMonth = this._shiftMK(this._viewMonth, dir);
    this.render();
  },

  goToday() {
    this._viewMonth = this._todayMK();
    this.render();
  },

  _jumpMonth(mk) {
    this._viewMonth = mk;
    this.render();
  },

  /* ─────────────────── QUICK SET STATUS ─────────────────── */

  // One-click to set paid/pending/overdue. If same status → toggle off (remove).
  // If setting "paid", prompt for amount + notes.
  quickSet(sirId, newStatus) {
    const records = Store.get('payments_records', []);
    const idx = records.findIndex(r => r.sirId === sirId && r.monthKey === this._viewMonth);
    const existing = idx >= 0 ? records[idx] : null;

    // Toggle off if already this status
    if (existing && existing.status === newStatus) {
      if (newStatus === 'paid') {
        // Let user confirm before removing paid record
        if (!confirm('Remove the "Paid" record for this month?')) return;
      }
      if (idx >= 0) records.splice(idx, 1);
      Store.set('payments_records', records);
      this.render();
      showToast('Record removed', 'info');
      return;
    }

    if (newStatus === 'paid') {
      // Prompt for amount & date
      this._promptPaid(sirId);
      return;
    }

    // Set pending / overdue immediately
    const entry = { id: existing?.id || uid(), sirId, monthKey: this._viewMonth, status: newStatus, datePaid: '', amount: null, notes: '' };
    if (idx >= 0) records[idx] = entry; else records.push(entry);
    Store.set('payments_records', records);
    this.render();
    showToast(newStatus === 'pending' ? '⏳ Marked as pending' : '❌ Marked as overdue', 'info');
  },

  _promptPaid(sirId) {
    const sirs = Store.get('payments_sirs', []);
    const sir = sirs.find(s => s.id === sirId);
    const existingRec = this._rec(sirId, this._viewMonth);

    openModal(`
      <div class="modal-body">
        <div style="text-align:center;padding:var(--space-4) 0;border-bottom:1.5px solid var(--border);margin-bottom:var(--space-4)">
          <div style="font-size:2rem;margin-bottom:4px">✅</div>
          <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700">${sir?.name || 'Sir'}</div>
          <div style="font-size:0.82rem;color:var(--text-muted)">${this._monthLabel(this._viewMonth)}</div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Amount Paid (₹)</label>
            <input type="number" class="form-control" id="pp-amount" placeholder="Leave blank = full fee (₹${this._fmt(sir?.fee)})" value="${existingRec?.amount ?? ''}" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Date Paid</label>
            <input type="date" class="form-control" id="pp-date" value="${existingRec?.datePaid || todayStr()}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <input class="form-control" id="pp-notes" placeholder="e.g. Cash, UPI, Bank transfer..." value="${existingRec?.notes || ''}" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" style="background:#10B981;border-color:#10B981" onclick="Payments._savePaid('${sirId}')">✅ Mark as Paid</button>
      </div>
    `, '✅ Confirm Payment');
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  _savePaid(sirId) {
    const amount = document.getElementById('pp-amount')?.value.trim();
    const datePaid = document.getElementById('pp-date')?.value || todayStr();
    const notes = document.getElementById('pp-notes')?.value.trim() || '';

    const records = Store.get('payments_records', []);
    const idx = records.findIndex(r => r.sirId === sirId && r.monthKey === this._viewMonth);
    const entry = {
      id: (idx >= 0 ? records[idx].id : null) || uid(),
      sirId,
      monthKey: this._viewMonth,
      status: 'paid',
      datePaid,
      amount: amount !== '' ? Number(amount) : null,
      notes
    };
    if (idx >= 0) records[idx] = entry; else records.push(entry);
    Store.set('payments_records', records);
    closeModal();
    this.render();
    showToast('✅ Payment marked as paid!', 'success');
  },

  /* ─────────────────── EDIT RECORD (add details) ─────────────────── */

  openEditRecord(sirId, sirName) {
    const rec = this._rec(sirId, this._viewMonth);
    const sirs = Store.get('payments_sirs', []);
    const sir = sirs.find(s => s.id === sirId);

    openModal(`
      <div class="modal-body">
        <div style="text-align:center;margin-bottom:var(--space-4);padding-bottom:var(--space-4);border-bottom:1.5px solid var(--border)">
          <div style="font-family:var(--font-display);font-weight:700;font-size:1rem">${sirName}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${this._monthLabel(this._viewMonth)}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            ${['paid','pending','overdue'].map(s => `
              <label style="cursor:pointer">
                <input type="radio" name="er-status" value="${s}" ${(rec?.status===s)?'checked':''} style="display:none">
                <div class="pay-status-btn ${s} ${rec?.status===s?'active':''}" id="er-opt-${s}"
                  onclick="document.querySelectorAll('[id^=er-opt-]').forEach(x=>x.classList.remove('active'));this.classList.add('active')">
                  <span class="s-icon">${s==='paid'?'✅':s==='pending'?'⏳':'❌'}</span>
                  ${s.charAt(0).toUpperCase()+s.slice(1)}
                </div>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Amount Paid (₹)</label>
            <input type="number" class="form-control" id="er-amount" placeholder="₹${this._fmt(sir?.fee)}" value="${rec?.amount??''}" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-control" id="er-date" value="${rec?.datePaid || todayStr()}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <input class="form-control" id="er-notes" placeholder="e.g. Cash, UPI..." value="${rec?.notes||''}" />
        </div>
      </div>
      <div class="modal-footer">
        ${rec ? `<button class="btn btn-danger" onclick="Payments._deleteRecord('${sirId}')">Remove</button>` : ''}
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Payments._saveEditRecord('${sirId}')">Save</button>
      </div>
    `, '📝 Edit Payment Record');
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  _saveEditRecord(sirId) {
    const statusEl = document.querySelector('[id^="er-opt-"].active');
    const status = statusEl ? statusEl.id.replace('er-opt-', '') : null;
    if (!status) { showToast('Select a status', 'error'); return; }
    const amount = document.getElementById('er-amount')?.value.trim();
    const datePaid = document.getElementById('er-date')?.value || todayStr();
    const notes = document.getElementById('er-notes')?.value.trim() || '';

    const records = Store.get('payments_records', []);
    const idx = records.findIndex(r => r.sirId === sirId && r.monthKey === this._viewMonth);
    const entry = {
      id: (idx >= 0 ? records[idx].id : null) || uid(),
      sirId, monthKey: this._viewMonth, status,
      datePaid, amount: amount !== '' ? Number(amount) : null, notes
    };
    if (idx >= 0) records[idx] = entry; else records.push(entry);
    Store.set('payments_records', records);
    closeModal();
    this.render();
    showToast('Record saved!', 'success');
  },

  _deleteRecord(sirId) {
    if (!confirm('Remove this payment record?')) return;
    let records = Store.get('payments_records', []);
    records = records.filter(r => !(r.sirId === sirId && r.monthKey === this._viewMonth));
    Store.set('payments_records', records);
    closeModal();
    this.render();
    showToast('Record removed', 'info');
  },

  /* ─────────────────── HISTORY MODAL ─────────────────── */

  openHistory(sirId, sirName) {
    const all = Store.get('payments_records', [])
      .filter(r => r.sirId === sirId)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    const sirs = Store.get('payments_sirs', []);
    const sir = sirs.find(s => s.id === sirId);

    const icons = { paid: '✅', pending: '⏳', overdue: '❌' };

    openModal(`
      <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:var(--space-4)">${sirName} · ₹${this._fmt(sir?.fee)}/month · ${all.length} record${all.length !== 1 ? 's' : ''}</div>
      ${all.length === 0
        ? `<div class="empty-state" style="padding:24px"><span class="empty-state-icon">📭</span><div class="empty-state-title">No payment records yet</div></div>`
        : `<div style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto">
            ${all.map(r => `
              <div class="pay-hist-row ${r.status}">
                <div>${icons[r.status] || '—'}</div>
                <div class="pay-hist-month">${this._monthLabel(r.monthKey)}</div>
                <div>
                  ${r.amount != null ? `<div style="font-weight:700;font-size:var(--text-sm)">₹${this._fmt(r.amount)}</div>` : ''}
                  ${r.datePaid ? `<div class="pay-hist-date">${formatDate(r.datePaid)}</div>` : ''}
                  ${r.notes ? `<div class="pay-hist-date">${r.notes}</div>` : ''}
                </div>
              </div>`).join('')}
          </div>`
      }
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      </div>
    `, `📋 Payment History — ${sirName}`);
  },

  /* ─────────────────── ADD SIR ─────────────────── */

  _tmpColor: '#6C63FF',
  _tmpEmoji: '👨‍🏫',

  openAddSir() {
    this._tmpColor = this.COLORS[0];
    this._tmpEmoji = this.EMOJIS[0];
    openModal(`
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Sir / Teacher Name *</label>
            <input class="form-control" id="as-name" placeholder="e.g. Ramesh Sir" />
          </div>
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input class="form-control" id="as-subject" placeholder="e.g. Mathematics" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Monthly Fee (₹) *</label>
          <input type="number" class="form-control" id="as-fee" placeholder="e.g. 2000" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">Icon</label>
          <div class="emoji-options" id="as-emojis">
            ${this.EMOJIS.map(e => `<div class="emoji-opt ${e === this.EMOJIS[0] ? 'selected' : ''}" onclick="Payments._peEmoji(this,'${e}')">${e}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Colour</label>
          <div class="color-swatch-grid" id="as-colors">
            ${this.COLORS.map(c => `<div class="color-swatch ${c === this.COLORS[0] ? 'selected' : ''}" style="background:${c}" onclick="Payments._peColor(this,'${c}')"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Payments._saveNewSir()">Add Sir</button>
      </div>
    `, '👨‍🏫 Add Sir / Tutor');
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  _peEmoji(el, e) { document.querySelectorAll('#as-emojis .emoji-opt').forEach(x => x.classList.remove('selected')); el.classList.add('selected'); this._tmpEmoji = e; },
  _peColor(el, c) { document.querySelectorAll('#as-colors .color-swatch').forEach(x => x.classList.remove('selected')); el.classList.add('selected'); this._tmpColor = c; },

  _saveNewSir() {
    const name = document.getElementById('as-name')?.value.trim();
    const fee  = document.getElementById('as-fee')?.value.trim();
    if (!name) { showToast('Please enter a name', 'error'); return; }
    if (!fee || isNaN(+fee) || +fee < 0) { showToast('Enter a valid monthly fee', 'error'); return; }
    const sirs = Store.get('payments_sirs', []);
    sirs.push({
      id: uid(), name,
      subject: document.getElementById('as-subject')?.value.trim() || '',
      fee: +fee,
      emoji: this._tmpEmoji,
      color: this._tmpColor
    });
    Store.set('payments_sirs', sirs);
    closeModal();
    this.render();
    showToast(`${name} added! 🎉`, 'success');
  },

  /* ─────────────────── EDIT SIR ─────────────────── */

  openEditSir(si) {
    const sir = Store.get('payments_sirs', [])[si];
    if (!sir) return;
    this._tmpColor = sir.color;
    this._tmpEmoji = sir.emoji;
    openModal(`
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-control" id="es-name" value="${sir.name}" />
          </div>
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input class="form-control" id="es-subject" value="${sir.subject || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Monthly Fee (₹)</label>
          <input type="number" class="form-control" id="es-fee" value="${sir.fee || 0}" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">Icon</label>
          <div class="emoji-options" id="es-emojis">
            ${this.EMOJIS.map(e => `<div class="emoji-opt ${e === sir.emoji ? 'selected' : ''}" onclick="Payments._eeEmoji(this,'${e}')">${e}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Colour</label>
          <div class="color-swatch-grid" id="es-colors">
            ${this.COLORS.map(c => `<div class="color-swatch ${c === sir.color ? 'selected' : ''}" style="background:${c}" onclick="Payments._eeColor(this,'${c}')"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Payments._saveEditSir(${si})">Save Changes</button>
      </div>
    `, '✏️ Edit Sir');
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  _eeEmoji(el, e) { document.querySelectorAll('#es-emojis .emoji-opt').forEach(x => x.classList.remove('selected')); el.classList.add('selected'); this._tmpEmoji = e; },
  _eeColor(el, c) { document.querySelectorAll('#es-colors .color-swatch').forEach(x => x.classList.remove('selected')); el.classList.add('selected'); this._tmpColor = c; },

  _saveEditSir(si) {
    const name = document.getElementById('es-name')?.value.trim();
    if (!name) { showToast('Name is required', 'error'); return; }
    const sirs = Store.get('payments_sirs', []);
    sirs[si] = { ...sirs[si], name, subject: document.getElementById('es-subject')?.value.trim() || '', fee: +document.getElementById('es-fee')?.value || 0, emoji: this._tmpEmoji, color: this._tmpColor };
    Store.set('payments_sirs', sirs);
    closeModal();
    this.render();
    showToast('Updated!', 'success');
  },

  deleteSir(si) {
    const sirs = Store.get('payments_sirs', []);
    const sir = sirs[si];
    if (!confirm(`Delete "${sir.name}" and all payment history?`)) return;
    sirs.splice(si, 1);
    let records = Store.get('payments_records', []);
    records = records.filter(r => r.sirId !== sir.id);
    Store.set('payments_sirs', sirs);
    Store.set('payments_records', records);
    this.render();
    showToast(`${sir.name} deleted`, 'info');
  },

  /* ─────────────────── EXPORT CSV ─────────────────── */

  exportCSV() {
    const sirs = Store.get('payments_sirs', []);
    const records = Store.get('payments_records', []);
    if (!sirs.length) { showToast('No data to export', 'error'); return; }
    const rows = [];
    sirs.forEach(sir => {
      const recs = records.filter(r => r.sirId === sir.id);
      if (!recs.length) {
        rows.push([sir.name, sir.subject || '', sir.fee || 0, '', '', '', '']);
      } else {
        recs.forEach(r => rows.push([sir.name, sir.subject || '', sir.fee || 0, r.monthKey, r.status, r.datePaid || '', r.notes || '']));
      }
    });
    const csv = [['Name', 'Subject', 'Monthly Fee', 'Month', 'Status', 'Date Paid', 'Notes'], ...rows]
      .map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'sir_payments.csv' });
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported as sir_payments.csv!', 'success');
  }
};
