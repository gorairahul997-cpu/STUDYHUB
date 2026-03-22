/* ============================================
   EXAMS.JS — Upcoming Exams Tracker
   ============================================ */

const Exams = {
  currentFilter: 'upcoming',

  init() { this.render(); },

  render() {
    const el = document.getElementById('page-exams');
    el.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-eyebrow">Exams</div>
            <div class="page-title">📝 Exam Tracker</div>
            <div class="page-subtitle">Track upcoming exams with countdowns and syllabus notes</div>
          </div>
          <button class="btn btn-primary" onclick="Exams.openAdd()">＋ Add Exam</button>
        </div>
      </div>
      <div class="exams-filter-bar">
        <button class="filter-btn ${this.currentFilter==='upcoming'?'active':''}" onclick="Exams.setFilter('upcoming')">Upcoming</button>
        <button class="filter-btn ${this.currentFilter==='all'?'active':''}" onclick="Exams.setFilter('all')">All Exams</button>
        <button class="filter-btn ${this.currentFilter==='past'?'active':''}" onclick="Exams.setFilter('past')">Past</button>
      </div>
      <div class="exams-list" id="examsList"></div>
    `;
    this.renderList();
  },

  renderList() {
    const all = Store.get('exams', []);
    const list = document.getElementById('examsList');
    let filtered = all;
    if (this.currentFilter === 'upcoming') filtered = all.filter(e => daysUntil(e.date) >= 0);
    if (this.currentFilter === 'past') filtered = all.filter(e => daysUntil(e.date) < 0);
    filtered = filtered.sort((a,b) => new Date(a.date) - new Date(b.date));

    if (!filtered.length) {
      list.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🎉</span><div class="empty-state-title">${this.currentFilter==='past'?'No past exams':'No upcoming exams'}</div><p class="empty-state-desc">${this.currentFilter==='upcoming'?'Add your upcoming board or school exams.':'Enjoy the freedom!'}</p>${this.currentFilter!=='past'?'<button class="btn btn-primary" onclick="Exams.openAdd()">＋ Add Exam</button>':''}</div>`;
      return;
    }

    const upcoming = filtered.filter(e => daysUntil(e.date) >= 0);
    const past = filtered.filter(e => daysUntil(e.date) < 0);

    let html = '';
    if (upcoming.length) {
      html += upcoming.map(e => this.renderCard(e)).join('');
    }
    if (past.length && this.currentFilter !== 'upcoming') {
      html += `<div class="exams-section-header">Past Exams</div>`;
      html += past.reverse().map(e => this.renderCard(e)).join('');
    }
    list.innerHTML = html;
  },

  renderCard(e) {
    const days = daysUntil(e.date);
    const isPast = days < 0;
    const urgency = isPast ? 'past' : days <= 2 ? 'urgent' : days <= 7 ? 'warning' : 'safe';
    const importanceBadge = { High: 'badge-red', Medium: 'badge-amber', Low: 'badge-green' };
    return `
      <div class="exam-card ${urgency}" onclick="Exams.preview('${e.id}')">
        <div class="exam-card-left-bar"></div>
        <div class="exam-countdown-badge">
          <div class="exam-days-num">${isPast ? '✓' : days}</div>
          <div class="exam-days-label">${isPast ? 'done' : days === 0 ? 'today' : 'days'}</div>
        </div>
        <div class="exam-card-info">
          <div class="exam-card-subject">${e.subject}</div>
          <div class="exam-card-date">📅 ${formatDate(e.date)}${e.time?' · 🕐 '+formatTime12(e.time):''}</div>
          ${e.syllabus?`<div class="exam-card-syllabus">${e.syllabus}</div>`:''}
        </div>
        <div class="exam-card-right">
          ${e.importance?`<span class="badge ${importanceBadge[e.importance]||'badge-gray'}">${e.importance}</span>`:''}
          <div class="exam-card-actions" onclick="event.stopPropagation()">
            <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="Exams.openEdit('${e.id}')">✏️</button>
            <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="Exams.delete_('${e.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `;
  },

  setFilter(f) {
    this.currentFilter = f;
    this.render();
  },

  openAdd(editId = null) {
    const exams = Store.get('exams', []);
    const e = editId ? exams.find(x => x.id === editId) : null;
    openModal(`
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Subject / Exam Name</label>
          <input class="form-control" id="ex-subject" value="${e?.subject||''}" placeholder="e.g. Physics Board Exam" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-control" id="ex-date" value="${e?.date||''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Time (optional)</label>
            <input type="time" class="form-control" id="ex-time" value="${e?.time||''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Importance</label>
            <select class="form-control" id="ex-importance">
              <option value="High" ${e?.importance==='High'?'selected':''}>🔴 High</option>
              <option value="Medium" ${e?.importance==='Medium'?'selected':''}>🟡 Medium</option>
              <option value="Low" ${e?.importance==='Low'?'selected':''}>🟢 Low</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Board/School Exam?</label>
            <select class="form-control" id="ex-type">
              <option value="Board" ${e?.examType==='Board'?'selected':''}>Board Exam</option>
              <option value="School" ${e?.examType==='School'?'selected':''}>School Exam</option>
              <option value="Test" ${e?.examType==='Test'?'selected':''}>Class Test</option>
              <option value="Other" ${e?.examType==='Other'?'selected':''}>Other</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Syllabus / Topics</label>
          <textarea class="form-control" id="ex-syllabus" placeholder="List the chapters or topics covered...">${e?.syllabus||''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-control" id="ex-notes" placeholder="Preparation tips, important formulas, etc.">${e?.notes||''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Exams.save('${editId||''}')">
          ${editId ? 'Save Changes' : 'Add Exam'}
        </button>
      </div>
    `, editId ? '✏️ Edit Exam' : '📝 Add Exam');
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  openEdit(id) { this.openAdd(id); },

  save(editId) {
    const subject = document.getElementById('ex-subject').value.trim();
    const date = document.getElementById('ex-date').value;
    if (!subject || !date) { showToast('Please fill subject and date', 'error'); return; }
    const time = document.getElementById('ex-time').value;
    const importance = document.getElementById('ex-importance').value;
    const examType = document.getElementById('ex-type').value;
    const syllabus = document.getElementById('ex-syllabus').value.trim();
    const notes = document.getElementById('ex-notes').value.trim();
    const exams = Store.get('exams', []);
    if (editId) {
      const idx = exams.findIndex(e => e.id === editId);
      if (idx > -1) exams[idx] = { ...exams[idx], subject, date, time, importance, examType, syllabus, notes };
    } else {
      exams.push({ id: uid(), subject, date, time, importance, examType, syllabus, notes, createdAt: new Date().toISOString() });
      // Also add to calendar
      const events = Store.get('calendarEvents', []);
      events.push({ id: uid(), title: subject + ' Exam', date, time, type: 'exam', notes: syllabus || notes });
      Store.set('calendarEvents', events);
    }
    Store.set('exams', exams);
    closeModal();
    this.renderList();
    showToast(editId ? 'Exam updated!' : 'Exam added!', 'success');
    if (document.getElementById('page-dashboard').classList.contains('active')) Dashboard.render();
  },

  preview(id) {
    const e = Store.get('exams', []).find(x => x.id === id);
    if (!e) return;
    const days = daysUntil(e.date);
    const isPast = days < 0;
    const urgencyColors = { urgent:'#FEE2E2,#991B1B', warning:'#FEF3C7,#92400E', safe:'#D1FAE5,#065F46', past:'#F3F4F6,#6B7280' };
    const urgency = isPast ? 'past' : days <= 2 ? 'urgent' : days <= 7 ? 'warning' : 'safe';
    const [bg, fg] = urgencyColors[urgency].split(',');
    const importanceBadge = { High: 'badge-red', Medium: 'badge-amber', Low: 'badge-green' };
    openModal(`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <div style="background:${bg};color:${fg};border-radius:12px;padding:12px 16px;text-align:center;font-family:var(--font-display);font-weight:800">
          <div style="font-size:1.8rem;line-height:1">${isPast?'✓':days}</div>
          <div style="font-size:0.65rem;text-transform:uppercase;font-weight:700">${isPast?'Done':days===0?'Today':'Days Left'}</div>
        </div>
        <div>
          <div style="font-family:var(--font-display);font-size:1.3rem;font-weight:800">${e.subject}</div>
          <div style="font-size:0.85rem;color:var(--text-secondary)">📅 ${formatDate(e.date)}${e.time?' · 🕐 '+formatTime12(e.time):''}</div>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
            ${e.importance?`<span class="badge ${importanceBadge[e.importance]||'badge-gray'}">${e.importance}</span>`:''}
            ${e.examType?`<span class="badge badge-accent">${e.examType}</span>`:''}
          </div>
        </div>
      </div>
      ${e.syllabus?`<div style="margin-bottom:12px"><strong style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em">Syllabus</strong><div style="background:var(--bg);border-radius:8px;padding:12px;margin-top:6px;font-size:0.88rem;line-height:1.6;border:1.5px solid var(--border)">${e.syllabus}</div></div>`:''}
      ${e.notes?`<div><strong style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em">Notes</strong><div style="background:var(--bg);border-radius:8px;padding:12px;margin-top:6px;font-size:0.88rem;line-height:1.6;border:1.5px solid var(--border)">${e.notes}</div></div>`:''}
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Close</button>
        <button class="btn btn-danger btn-sm" onclick="Exams.delete_('${id}')">🗑️ Delete</button>
        <button class="btn btn-secondary btn-sm" onclick="closeModal();setTimeout(()=>Exams.openEdit('${id}'),100)">✏️ Edit</button>
      </div>
    `, '📝 Exam Details');
  },

  delete_(id) {
    if (!confirm('Delete this exam?')) return;
    let exams = Store.get('exams', []);
    exams = exams.filter(e => e.id !== id);
    Store.set('exams', exams);
    closeModal();
    this.renderList();
    showToast('Exam deleted', 'info');
    if (document.getElementById('page-dashboard').classList.contains('active')) Dashboard.render();
  }
};
