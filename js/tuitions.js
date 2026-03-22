/* ============================================
   TUITIONS.JS — Premium Redesign v2
   Beautiful weekly grid + rich subject cards
   ============================================ */

const Tuitions = {
  days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
  dayColors: {
    Monday:    '#6C63FF', Tuesday:  '#10B981', Wednesday: '#F59E0B',
    Thursday:  '#3B82F6', Friday:   '#EF4444', Saturday:  '#8B5CF6',
    Sunday:    '#EC4899'
  },

  init() { this.render(); },

  /* ── RENDER ── */
  render() {
    const el = document.getElementById('page-tuitions');
    const subjects = Store.get('tuitions_v2', []);
    const todayName = new Date().toLocaleString('en-IN', { weekday: 'long' });

    // Flatten sessions by day
    const byDay = {};
    this.days.forEach(d => byDay[d] = []);
    subjects.forEach(sub => {
      (sub.sessions || []).forEach(sess => {
        if (sess.day) byDay[sess.day].push({
          subject: sub.name, emoji: sub.emoji || '🎓',
          color: sub.color || 'var(--accent)',
          teacher: sub.teacher || '', time: sess.time || '', location: sess.location || ''
        });
      });
    });

    // Today's sessions
    const todaySessions = (byDay[todayName] || []).sort((a,b) => (a.time||'').localeCompare(b.time||''));

    el.innerHTML = `
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-eyebrow">Schedule</div>
            <div class="page-title">🎓 Tuition Schedule</div>
            <div class="page-subtitle">Your full weekly tuition timetable at a glance</div>
          </div>
          <div class="tuitions-header-actions">
            <button class="btn btn-ghost btn-sm" onclick="Tuitions.exportCSV()">⬇️ Export CSV</button>
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('csvImportV2').click()">⬆️ Import CSV</button>
            <input type="file" id="csvImportV2" accept=".csv" style="display:none" onchange="Tuitions.importCSV(this)" />
            <button class="btn btn-primary" onclick="Tuitions.openAddSubject()">＋ Add Subject</button>
          </div>
        </div>
      </div>

      <!-- Today's Class Banner -->
      ${this._renderTodayBanner(todayName, todaySessions)}

      <!-- Weekly Grid -->
      <div class="tuition-week-section">
        <div class="tuition-section-header">
          <div class="tuition-section-title">📅 This Week</div>
          <div class="tuition-section-badge">${subjects.length} subject${subjects.length !== 1 ? 's' : ''}</div>
        </div>
        <div class="tuition-week-grid">
          ${this.days.map(day => this._renderDayCol(day, byDay[day] || [], day === todayName)).join('')}
        </div>
      </div>

      <!-- Subject Cards -->
      <div class="tuition-section-header">
        <div class="tuition-section-title">📚 All Subjects</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted)">Click the <strong>✕</strong> on a session to remove it</div>
      </div>
      <div class="subjects-grid" id="tuitionSubjectList"></div>
    `;

    this._renderSubjectCards(subjects);
  },

  /* ── TODAY BANNER ── */
  _renderTodayBanner(todayName, sessions) {
    if (sessions.length === 0) {
      return `
        <div class="tuition-today-banner" style="margin-bottom:var(--space-8)">
          <div class="today-banner-day">${todayName.slice(0,3)}</div>
          <div class="today-banner-empty">🎉 No classes today — enjoy your break!</div>
        </div>`;
    }
    return `
      <div class="tuition-today-banner" style="margin-bottom:var(--space-8)">
        <div class="today-banner-day">${todayName.slice(0,3)}</div>
        <div class="today-banner-sessions">
          ${sessions.map(s => `
            <div class="today-session-chip">
              <span style="font-size:1.1rem">${s.emoji}</span>
              <div>
                <div class="tsc-name">${s.subject}</div>
                <div class="tsc-time">${s.time ? formatTime12(s.time) : 'Time TBD'}${s.location ? ' · ' + s.location : ''}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── DAY COLUMN (week grid) ── */
  _renderDayCol(day, sessions, isToday) {
    const sorted = sessions.slice().sort((a,b) => (a.time||'').localeCompare(b.time||''));
    const col = this.dayColors[day];
    return `
      <div class="tuition-day-col ${isToday ? 'tuition-day-today' : ''}">
        <div class="tuition-day-header" style="${isToday ? '' : `border-top: 3px solid ${col}`}">
          <div class="tuition-day-name">${day.slice(0,3)}</div>
          ${isToday ? `<div class="tuition-today-badge">Today</div>` : ''}
        </div>
        <div class="tuition-day-sessions">
          ${sorted.length === 0
            ? `<div class="tuition-no-session">—</div>`
            : sorted.map(s => `
                <div class="tuition-session-chip" style="border-left-color:${s.color}">
                  <div class="tuition-session-emoji">${s.emoji}</div>
                  <div style="min-width:0">
                    <div class="tuition-session-subject">${s.subject}</div>
                    <div class="tuition-session-time">${s.time ? formatTime12(s.time) : '—'}${s.location ? ' · '+s.location : ''}</div>
                    ${s.teacher ? `<div class="tuition-session-teacher">👤 ${s.teacher}</div>` : ''}
                  </div>
                </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── SUBJECT CARDS ── */
  _renderSubjectCards(subjects) {
    const list = document.getElementById('tuitionSubjectList');
    if (!list) return;
    if (!subjects.length) {
      list.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">🎓</span>
          <div class="empty-state-title">No tuition subjects yet</div>
          <p class="empty-state-desc">Add a subject like "Mathematics" and then set which days and times you have class.</p>
          <button class="btn btn-primary" onclick="Tuitions.openAddSubject()">＋ Add Subject</button>
        </div>`;
      return;
    }
    list.innerHTML = subjects.map((sub, si) => {
      const sessions = (sub.sessions || []).slice().sort((a,b) => this.days.indexOf(a.day) - this.days.indexOf(b.day));
      const daysSet = [...new Set(sessions.map(s => s.day))];
      const avatarBg = (sub.color || '#6C63FF') + '22';

      return `
        <div class="tuition-subject-card">
          <div class="tuition-card-stripe" style="background:linear-gradient(90deg,${sub.color||'var(--accent)'},${sub.color||'var(--accent)'}88)"></div>
          <div class="tuition-subject-card-header">
            <div style="display:flex;align-items:center;gap:var(--space-3);flex:1;min-width:0">
              <div class="tuition-card-avatar" style="background:${avatarBg}">${sub.emoji||'🎓'}</div>
              <div class="tuition-card-name-block">
                <div class="tuition-card-name">${sub.name}</div>
                <div class="tuition-card-teacher">
                  ${sub.teacher ? `👤 ${sub.teacher}` : '<span style="opacity:0.5">No teacher set</span>'}
                </div>
              </div>
            </div>
            <div class="tuition-card-actions">
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="event.stopPropagation();Tuitions.openEditSubject(${si})">✏️</button>
              <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="event.stopPropagation();Tuitions.deleteSubject(${si})">🗑️</button>
            </div>
          </div>

          <!-- Quick Stats Strip -->
          <div class="tuition-card-stat-strip">
            <div class="tuition-stat-item">
              <div class="tuition-stat-num" style="color:${sub.color||'var(--accent)'}">${sessions.length}</div>
              <div class="tuition-stat-lbl">Sessions/wk</div>
            </div>
            <div class="tuition-stat-item">
              <div class="tuition-stat-num" style="color:${sub.color||'var(--accent)'}">${daysSet.length}</div>
              <div class="tuition-stat-lbl">Days</div>
            </div>
            <div class="tuition-stat-item">
              <div class="tuition-stat-num" style="color:${sub.color||'var(--accent)'}">
                ${sessions.length > 0 ? formatTime12(sessions[0].time) : '—'}
              </div>
              <div class="tuition-stat-lbl">Next time</div>
            </div>
          </div>

          <!-- Session rows -->
          <div class="tuition-subject-sessions">
            ${sessions.length === 0
              ? `<div style="text-align:center;padding:var(--space-4);color:var(--text-muted);font-size:var(--text-xs)">No sessions yet — add one below</div>`
              : sessions.map((sess, sessi) => `
                  <div class="tuition-session-row">
                    <span class="day-pill" style="background:${(this.dayColors[sess.day]||'var(--accent)')}22;color:${this.dayColors[sess.day]||'var(--accent)'}">
                      ${sess.day}
                    </span>
                    <span style="font-size:0.82rem;font-weight:700;color:var(--text-primary)">
                      ${sess.time ? formatTime12(sess.time) : '—'}
                    </span>
                    ${sess.location ? `<span style="font-size:0.75rem;color:var(--text-muted)">📍 ${sess.location}</span>` : ''}
                    ${sess.notes ? `<span style="font-size:0.72rem;color:var(--text-muted)">${sess.notes}</span>` : ''}
                    <button class="btn btn-danger btn-sm" style="margin-left:auto;padding:3px 9px;font-size:0.7rem;border-radius:8px"
                      onclick="event.stopPropagation();Tuitions.deleteSession(${si},${sessi})">✕</button>
                  </div>`).join('')
            }
            <button class="tuition-add-session-btn" onclick="Tuitions.openAddSession(${si})">
              ＋ Add session for ${sub.name}
            </button>
          </div>
        </div>`;
    }).join('');
  },

  /* ══════════════════════════════════════════
     MODALS — ADD / EDIT SUBJECT
  ══════════════════════════════════════════ */
  _subColor: '#6C63FF',
  _subEmoji: '📐',

  openAddSubject() {
    const colors = ['#6C63FF','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];
    const emojis = ['📐','🔬','📖','✏️','🌍','🧮','🎨','🎵','💻','🏛️','🧪','📊'];
    this._subColor = colors[0]; this._subEmoji = emojis[0];
    openModal(`
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Subject Name *</label>
            <input class="form-control" id="ts-name" placeholder="e.g. Mathematics, Physics" />
          </div>
          <div class="form-group">
            <label class="form-label">Teacher Name</label>
            <input class="form-control" id="ts-teacher" placeholder="e.g. Mr. Sharma" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Icon</label>
          <div class="emoji-options" id="ts-emoji-picker">
            ${emojis.map(e => `<div class="emoji-opt ${e===emojis[0]?'selected':''}" onclick="Tuitions._pickEmoji(this,'${e}')">${e}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Colour</label>
          <div class="color-swatch-grid" id="ts-color-picker">
            ${colors.map(c => `<div class="color-swatch ${c===colors[0]?'selected':''}" style="background:${c}" onclick="Tuitions._pickColor(this,'${c}')"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Tuitions.saveNewSubject()">Add Subject</button>
      </div>
    `, '🎓 Add Tuition Subject');
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  _pickEmoji(el, e) { document.querySelectorAll('#ts-emoji-picker .emoji-opt').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); this._subEmoji=e; },
  _pickColor(el, c) { document.querySelectorAll('#ts-color-picker .color-swatch').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); this._subColor=c; },

  saveNewSubject() {
    const name = document.getElementById('ts-name').value.trim();
    if (!name) { showToast('Enter subject name', 'error'); return; }
    const teacher = document.getElementById('ts-teacher').value.trim();
    const subs = Store.get('tuitions_v2', []);
    subs.push({ id: uid(), name, teacher, emoji: this._subEmoji||'🎓', color: this._subColor||'#6C63FF', sessions: [] });
    Store.set('tuitions_v2', subs);
    closeModal(); this.render();
    showToast(`${name} added! 🎉`, 'success');
    setTimeout(() => this.openAddSession(subs.length - 1), 400);
  },

  openEditSubject(si) {
    const subs = Store.get('tuitions_v2', []);
    const sub = subs[si];
    const colors = ['#6C63FF','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];
    const emojis = ['📐','🔬','📖','✏️','🌍','🧮','🎨','🎵','💻','🏛️','🧪','📊'];
    this._subColor = sub.color; this._subEmoji = sub.emoji;
    openModal(`
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Subject Name</label>
            <input class="form-control" id="ts-edit-name" value="${sub.name}" />
          </div>
          <div class="form-group">
            <label class="form-label">Teacher Name</label>
            <input class="form-control" id="ts-edit-teacher" value="${sub.teacher||''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Icon</label>
          <div class="emoji-options" id="ts-edit-emoji">
            ${emojis.map(e => `<div class="emoji-opt ${e===sub.emoji?'selected':''}" onclick="Tuitions._pickEmojiEdit(this,'${e}')">${e}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Colour</label>
          <div class="color-swatch-grid" id="ts-edit-color">
            ${colors.map(c => `<div class="color-swatch ${c===sub.color?'selected':''}" style="background:${c}" onclick="Tuitions._pickColorEdit(this,'${c}')"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Tuitions.saveEditSubject(${si})">Save Changes</button>
      </div>
    `, '✏️ Edit Subject');
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  _pickEmojiEdit(el,e){ document.querySelectorAll('#ts-edit-emoji .emoji-opt').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');this._subEmoji=e; },
  _pickColorEdit(el,c){ document.querySelectorAll('#ts-edit-color .color-swatch').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');this._subColor=c; },

  saveEditSubject(si) {
    const name = document.getElementById('ts-edit-name').value.trim();
    if (!name) { showToast('Enter subject name', 'error'); return; }
    const teacher = document.getElementById('ts-edit-teacher').value.trim();
    const subs = Store.get('tuitions_v2', []);
    subs[si] = { ...subs[si], name, teacher, emoji: this._subEmoji, color: this._subColor };
    Store.set('tuitions_v2', subs);
    closeModal(); this.render();
    showToast('Subject updated!', 'success');
  },

  /* ── ADD SESSION (day + time for a subject) ── */
  openAddSession(si) {
    const subs = Store.get('tuitions_v2', []);
    const sub = subs[si];
    openModal(`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:12px;border-bottom:1.5px solid var(--border)">
        <div style="width:40px;height:40px;border-radius:10px;background:${(sub.color||'#6C63FF')}22;display:flex;align-items:center;justify-content:center;font-size:1.3rem">${sub.emoji||'🎓'}</div>
        <div>
          <div style="font-weight:700;font-size:1rem;color:var(--text-primary)">${sub.name}</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">Add a class session</div>
        </div>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Day of the Week</label>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px" id="day-picker">
            ${this.days.map(d => `
              <label style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border-radius:10px;border:1.5px solid var(--border);cursor:pointer;transition:all 0.15s;background:var(--bg)" class="day-pick-opt">
                <input type="radio" name="sess-day" value="${d}" style="display:none"
                  onchange="document.querySelectorAll('.day-pick-opt').forEach(e=>Object.assign(e.style,{background:'var(--bg)',borderColor:'var(--border)'}));Object.assign(this.closest('.day-pick-opt').style,{background:'${this.dayColors[d]}22',borderColor:'${this.dayColors[d]}'})">
                <span style="font-weight:800;font-size:0.8rem;color:var(--text-primary)">${d.slice(0,3)}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Time</label>
            <input type="time" class="form-control" id="sess-time" />
          </div>
          <div class="form-group">
            <label class="form-label">Location (optional)</label>
            <input class="form-control" id="sess-location" placeholder="e.g. Home, Coaching Center" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <input class="form-control" id="sess-notes" placeholder="e.g. Bring textbook" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Tuitions.saveSession(${si})">Add Session</button>
      </div>
    `, `📅 Add Session — ${sub.name}`);
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  saveSession(si) {
    const day      = document.querySelector('input[name="sess-day"]:checked')?.value;
    const time     = document.getElementById('sess-time').value;
    const location = document.getElementById('sess-location').value.trim();
    const notes    = document.getElementById('sess-notes').value.trim();
    if (!day) { showToast('Please select a day', 'error'); return; }
    const subs = Store.get('tuitions_v2', []);
    subs[si].sessions = subs[si].sessions || [];
    subs[si].sessions.push({ day, time, location, notes });
    Store.set('tuitions_v2', subs);
    this._syncToCalendar(subs[si], day, time, notes || location);
    closeModal(); this.render();
    showToast(`Session added for ${day}! ✅`, 'success');
    if (document.getElementById('page-dashboard').classList.contains('active')) Dashboard.render();
  },

  /* ── CALENDAR SYNC ── */
  _syncToCalendar(sub, day, time, note) {
    const dayIndex   = this.days.indexOf(day);
    const jsDayIndex = [1,2,3,4,5,6,0][dayIndex];
    const events     = Store.get('calendarEvents', []);
    const today      = new Date();
    let added = 0; let checkDate = new Date(today);
    while (added < 4) {
      if (checkDate.getDay() === jsDayIndex) {
        const ds = checkDate.toISOString().split('T')[0];
        if (!events.some(e => e.type === 'tuition' && e.title === `${sub.name} Tuition` && e.date === ds)) {
          events.push({ id: uid(), title: `${sub.name} Tuition`, date: ds, time, type: 'tuition', notes: note || '' });
          added++;
        }
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    Store.set('calendarEvents', events);
  },

  deleteSession(si, sessi) {
    if (!confirm('Remove this session?')) return;
    const subs = Store.get('tuitions_v2', []);
    subs[si].sessions.splice(sessi, 1);
    Store.set('tuitions_v2', subs);
    this.render();
    showToast('Session removed', 'info');
    if (document.getElementById('page-dashboard').classList.contains('active')) Dashboard.render();
  },

  deleteSubject(si) {
    const subs = Store.get('tuitions_v2', []);
    if (!confirm(`Delete "${subs[si].name}" and all its sessions?`)) return;
    subs.splice(si, 1);
    Store.set('tuitions_v2', subs);
    this.render(); showToast('Subject deleted', 'info');
    if (document.getElementById('page-dashboard').classList.contains('active')) Dashboard.render();
  },

  /* ── EXPORT / IMPORT CSV ── */
  exportCSV() {
    const subs = Store.get('tuitions_v2', []);
    if (!subs.length) { showToast('No data to export', 'error'); return; }
    const rows = [];
    subs.forEach(sub => { (sub.sessions||[]).forEach(sess => {
      rows.push([sub.name, sub.teacher||'', sess.day, sess.time||'', sess.location||'', sess.notes||'']);
    }); });
    if (!rows.length) { showToast('No sessions to export', 'error'); return; }
    const csv = [['Subject','Teacher','Day','Time','Location','Notes'], ...rows]
      .map(r => r.map(v => `"${(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'tuitions.csv' });
    a.click(); URL.revokeObjectURL(url);
    showToast('Exported as tuitions.csv!', 'success');
  },

  importCSV(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const lines = e.target.result.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,'').toLowerCase());
        const parsed = lines.slice(1).map(line => {
          const vals = line.match(/(\"([^\"]|\"\")*\"|[^,]*)(,|$)/g)?.map(v => v.replace(/,$/, '').replace(/^\"|\"$/g,'').replace(/""/g,'"')) || [];
          const obj = {}; headers.forEach((h,i) => obj[h] = vals[i]||''); return obj;
        }).filter(r => r.subject || r.day);
        const subMap = {};
        parsed.forEach(row => {
          const key = (row.subject||'').trim(); if (!key) return;
          if (!subMap[key]) subMap[key] = { id: uid(), name: key, teacher: row.teacher||'', emoji: '🎓', color: '#6C63FF', sessions: [] };
          if (row.day) subMap[key].sessions.push({ day: row.day, time: row.time||'', location: row.location||'', notes: row.notes||'' });
        });
        const subs = Store.get('tuitions_v2', []);
        Store.set('tuitions_v2', [...subs, ...Object.values(subMap)]);
        this.render(); showToast(`Imported ${Object.keys(subMap).length} subjects!`, 'success');
      } catch(err) { showToast('Import failed — check CSV format', 'error'); }
    };
    reader.readAsText(file); input.value = '';
  },

  migrateOldData() {
    const old = Store.get('tuitions', []);
    if (!old.length) return;
    const existing = Store.get('tuitions_v2', []);
    if (existing.length) return;
    const subMap = {};
    old.forEach(row => {
      const key = (row.subject||'').trim(); if (!key) return;
      if (!subMap[key]) subMap[key] = { id: uid(), name: key, teacher: row.teacher||'', emoji: '🎓', color: '#6C63FF', sessions: [] };
      if (row.day) subMap[key].sessions.push({ day: row.day, time: row.time||'', location: row.location||'', notes: row.notes||'' });
    });
    Store.set('tuitions_v2', Object.values(subMap));
  }
};
