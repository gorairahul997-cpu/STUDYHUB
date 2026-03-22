/* ============================================
   CALENDAR.JS — Full calendar + Tuition Schedule tab
   ============================================ */

const Calendar = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  activeTab: 'events', // 'events' | 'tuitions'

  days7: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayColors: { Monday: '#6C63FF', Tuesday: '#10B981', Wednesday: '#F59E0B', Thursday: '#3B82F6', Friday: '#EF4444', Saturday: '#8B5CF6', Sunday: '#EC4899' },
  daysOrdered: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],

  init() { this.render(); },

  render() {
    const el = document.getElementById('page-calendar');
    el.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-eyebrow">Calendar</div>
            <div class="page-title">📅 My Calendar</div>
            <div class="page-subtitle">Track homework, exams, and your tuition schedule</div>
          </div>
          <button class="btn btn-primary" id="calAddEventBtn" style="${this.activeTab === 'tuitions' ? 'display:none' : ''}">＋ Add Event</button>
        </div>
        <!-- Tab Switcher -->
        <div class="cal-tabs" style="margin-top:16px">
          <button class="cal-tab ${this.activeTab === 'events' ? 'active' : ''}" onclick="Calendar._switchTab('events')">📅 Events Calendar</button>
          <button class="cal-tab ${this.activeTab === 'tuitions' ? 'active' : ''}" onclick="Calendar._switchTab('tuitions')">🎓 Tuition Schedule</button>
        </div>
      </div>
      <div id="calTabContent"></div>
    `;
    document.getElementById('calAddEventBtn')?.addEventListener('click', () => this.openAddEvent());
    this._renderTab();
  },

  _switchTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  _renderTab() {
    if (this.activeTab === 'events') this._renderEventsTab();
    else this._renderTuitionTab();
  },

  /* ============================================================
     EVENTS TAB (existing monthly calendar)
     ============================================================ */
  _renderEventsTab() {
    const el = document.getElementById('calTabContent');
    el.innerHTML = `
      <div class="calendar-layout">
        <div>
          <div class="calendar-nav">
            <div class="calendar-nav-btns">
              <button class="cal-nav-btn" id="calPrev">‹</button>
              <button class="cal-today-btn" id="calToday">Today</button>
              <button class="cal-nav-btn" id="calNext">›</button>
            </div>
            <div class="calendar-month-year" id="calMonthYear"></div>
          </div>
          <div class="event-legend" style="margin-bottom:12px">
            <div class="legend-item"><div class="legend-dot" style="background:#F59E0B"></div>Homework</div>
            <div class="legend-item"><div class="legend-dot" style="background:#EF4444"></div>Exam</div>
            <div class="legend-item"><div class="legend-dot" style="background:#8B5CF6"></div>Other</div>
          </div>
          <div class="calendar-grid-wrap">
            <div class="calendar-weekdays">
              ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
            </div>
            <div class="calendar-days" id="calDays"></div>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-title">📋 Upcoming Events</div>
            <div id="calUpcomingList"></div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('calPrev').onclick = () => { this.currentMonth--; if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; } this.renderGrid(); };
    document.getElementById('calNext').onclick = () => { this.currentMonth++; if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; } this.renderGrid(); };
    document.getElementById('calToday').onclick = () => { this.currentYear = new Date().getFullYear(); this.currentMonth = new Date().getMonth(); this.renderGrid(); };
    this.renderGrid();
    this.renderUpcoming();
  },

  renderGrid() {
    // Only show hw, exam, other — NOT tuition (tuitions have their own tab)
    const allEvents = Store.get('calendarEvents', []);
    const events = allEvents.filter(e => e.type !== 'tuition');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const el = document.getElementById('calMonthYear');
    if (el) el.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const daysInPrev = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const todayStr_ = todayStr();
    const grid = document.getElementById('calDays');
    if (!grid) return;
    grid.innerHTML = '';

    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: new Date(this.currentYear, this.currentMonth - 1, daysInPrev - i), current: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(this.currentYear, this.currentMonth, d), current: true });
    let extra = 42 - cells.length;
    for (let d = 1; d <= extra; d++) cells.push({ date: new Date(this.currentYear, this.currentMonth + 1, d), current: false });

    cells.forEach(({ date, current }) => {
      const ds = date.toISOString().split('T')[0];
      const dayEvents = events.filter(e => e.date === ds);
      const isToday = ds === todayStr_;
      const div = document.createElement('div');
      div.className = `calendar-day${!current ? ' other-month' : ''}${isToday ? ' today' : ''}`;
      div.onclick = () => this.handleDayClick(ds, date);
      const typeChips = { hw: 'hw', tuition: 'tuition', exam: 'exam', other: 'other' };
      const typeLabels = { hw: '📋', tuition: '🎓', exam: '📝', other: '📌' };
      div.innerHTML = `
        <div class="day-num">${date.getDate()}</div>
        <div class="day-events">
          ${dayEvents.slice(0, 3).map(e => `
            <div class="event-chip ${typeChips[e.type] || 'other'}" onclick="event.stopPropagation();Calendar.previewEvent('${e.id}')" title="${e.title}">
              ${typeLabels[e.type] || '📌'} ${e.title}
            </div>
          `).join('')}
          ${dayEvents.length > 3 ? `<div class="event-chip-more">+${dayEvents.length - 3} more</div>` : ''}
        </div>
      `;
      grid.appendChild(div);
    });
  },

  renderUpcoming() {
    const allEvents = Store.get('calendarEvents', []);
    // Only non-tuition events in the upcoming sidebar
    const events = allEvents.filter(e => e.type !== 'tuition');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = events
      .filter(e => new Date(e.date + 'T00:00:00') >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);
    const colorMap = { hw: '#F59E0B', exam: '#EF4444', other: '#8B5CF6' };
    const list = document.getElementById('calUpcomingList');
    if (!list) return;
    if (!upcoming.length) {
      list.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🎉</span><div class="empty-state-title">All clear!</div><p class="empty-state-desc">No homework or exams coming up.</p></div>`;
      return;
    }
    list.innerHTML = `<div class="upcoming-events">${upcoming.map(e => `
      <div class="upcoming-event-item" onclick="Calendar.previewEvent('${e.id}')">
        <div class="upcoming-event-dot" style="background:${colorMap[e.type] || '#8B5CF6'}"></div>
        <div class="upcoming-event-info">
          <div class="upcoming-event-title">${e.title}</div>
          <div class="upcoming-event-date">${formatDate(e.date)}${e.time ? ' · ' + formatTime12(e.time) : ''}</div>
        </div>
      </div>`).join('')}</div>`;
  },

  handleDayClick(ds, dateObj) {
    const allEvents = Store.get('calendarEvents', []);
    const events = allEvents.filter(e => e.date === ds && e.type !== 'tuition');
    const dateFormatted = dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    if (events.length === 0) {
      this.openAddEvent(ds);
    } else {
      const colorMap = { hw: '#F59E0B', exam: '#EF4444', tuition: '#10B981', other: '#8B5CF6' };
      const typeLabel = { hw: 'Homework', exam: 'Exam', tuition: 'Tuition', other: 'Other' };
      openModal(`
        <div style="margin-bottom:16px;font-size:0.85rem;color:var(--text-muted)">${dateFormatted}</div>
        ${events.map(e => `
          <div style="padding:12px;background:var(--bg);border-radius:8px;border:1.5px solid var(--border);margin-bottom:8px;cursor:pointer" onclick="Calendar.previewEvent('${e.id}')">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <div style="width:10px;height:10px;border-radius:50%;background:${colorMap[e.type] || '#8B5CF6'}"></div>
              <strong style="font-size:0.9rem">${e.title}</strong>
              <span class="badge badge-accent" style="margin-left:auto;font-size:0.65rem">${typeLabel[e.type] || 'Other'}</span>
            </div>
            ${e.time ? `<div style="font-size:0.78rem;color:var(--text-muted)">🕐 ${formatTime12(e.time)}</div>` : ''}
            ${e.notes ? `<div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px">${e.notes}</div>` : ''}
          </div>
        `).join('')}
        <div class="modal-footer" style="margin-top:12px;padding-top:12px;border-top:1.5px solid var(--border);justify-content:space-between">
          <button class="btn btn-ghost" onclick="closeModal()">Close</button>
          <button class="btn btn-primary btn-sm" onclick="closeModal();setTimeout(()=>Calendar.openAddEvent('${ds}'),100)">＋ Add Event</button>
        </div>
      `, `📅 ${dateFormatted}`);
    }
  },

  previewEvent(id) {
    const e = Store.get('calendarEvents', []).find(ev => ev.id === id);
    if (!e) return;
    const colorMap = { hw: '#F59E0B', exam: '#EF4444', tuition: '#10B981', other: '#8B5CF6' };
    const typeLabel = { hw: 'Homework', exam: 'Exam', tuition: 'Tuition', other: 'Other' };
    openModal(`
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <div style="width:14px;height:14px;border-radius:50%;background:${colorMap[e.type]}"></div>
        <span class="badge badge-accent">${typeLabel[e.type] || 'Other'}</span>
      </div>
      <div style="font-size:1.4rem;font-family:var(--font-display);font-weight:800;margin-bottom:8px">${e.title}</div>
      <div style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:16px">📅 ${formatDate(e.date)}${e.time ? ' &nbsp; 🕐 ' + formatTime12(e.time) : ''}</div>
      ${e.notes ? `<div style="background:var(--bg);border-radius:8px;padding:14px;font-size:0.88rem;line-height:1.6;border:1.5px solid var(--border)">${e.notes}</div>` : ''}
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Close</button>
        <button class="btn btn-danger btn-sm" onclick="Calendar.deleteEvent('${e.id}')">🗑️ Delete</button>
        <button class="btn btn-secondary btn-sm" onclick="closeModal();setTimeout(()=>Calendar.openAddEvent(null,'${e.id}'),100)">✏️ Edit</button>
      </div>
    `, '🗓️ Event Details');
  },

  openAddEvent(prefillDate = null, editId = null) {
    const events = Store.get('calendarEvents', []);
    const existing = editId ? events.find(e => e.id === editId) : null;
    const dateVal = existing?.date || prefillDate || todayStr();
    openModal(`
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Event Type</label>
          <div class="event-type-picker">
            ${[{ v: 'hw', l: 'Homework', e: '📋' }, { v: 'exam', l: 'Exam', e: '📝' }, { v: 'other', l: 'Other', e: '📌' }].map(t => `
              <label class="event-type-opt${(existing?.type === t.v || (!existing && t.v === 'hw')) ? ' selected' : ''}">
                <input type="radio" name="evtype" value="${t.v}" ${(existing?.type === t.v || (!existing && t.v === 'hw')) ? 'checked' : ''} onchange="document.querySelectorAll('.event-type-opt').forEach(e=>e.classList.remove('selected'));this.closest('.event-type-opt').classList.add('selected')">
                <span class="event-type-emoji">${t.e}</span>
                <span class="event-type-label">${t.l}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Title</label>
          <input class="form-control" id="ev-title" value="${existing?.title || ''}" placeholder="e.g. Physics Chapter 5 HW" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-control" id="ev-date" value="${dateVal}" />
          </div>
          <div class="form-group">
            <label class="form-label">Time (optional)</label>
            <input type="time" class="form-control" id="ev-time" value="${existing?.time || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <textarea class="form-control" id="ev-notes" placeholder="Any additional details...">${existing?.notes || ''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Calendar.saveEvent('${editId || ''}')">
          ${editId ? 'Save Changes' : 'Add Event'}
        </button>
      </div>
    `, editId ? '✏️ Edit Event' : '＋ Add Event');
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  saveEvent(editId) {
    const title = document.getElementById('ev-title').value.trim();
    const date = document.getElementById('ev-date').value;
    const time = document.getElementById('ev-time').value;
    const notes = document.getElementById('ev-notes').value.trim();
    const type = document.querySelector('input[name="evtype"]:checked')?.value || 'other';
    if (!title || !date) { showToast('Please fill title and date', 'error'); return; }
    const events = Store.get('calendarEvents', []);
    if (editId) {
      const idx = events.findIndex(e => e.id === editId);
      if (idx > -1) events[idx] = { ...events[idx], title, date, time, notes, type };
    } else {
      events.push({ id: uid(), title, date, time, notes, type, createdAt: new Date().toISOString() });
    }
    Store.set('calendarEvents', events);
    closeModal();
    this.renderGrid();
    this.renderUpcoming();
    showToast(editId ? 'Event updated!' : 'Event added!', 'success');
    if (document.getElementById('page-dashboard').classList.contains('active')) Dashboard.render();
  },

  deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    let events = Store.get('calendarEvents', []);
    events = events.filter(e => e.id !== id);
    Store.set('calendarEvents', events);
    closeModal();
    this.renderGrid();
    this.renderUpcoming();
    showToast('Event deleted', 'info');
    if (document.getElementById('page-dashboard').classList.contains('active')) Dashboard.render();
  },

  /* ============================================================
     TUITION SCHEDULE TAB — weekly recurring view from tuitions_v2
     ============================================================ */
  _renderTuitionTab() {
    const el = document.getElementById('calTabContent');
    const subs = Store.get('tuitions_v2', []);
    const todayName = new Date().toLocaleString('en-IN', { weekday: 'long' });

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:800">🎓 Weekly Tuition Schedule</div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-top:2px">Your recurring tuition classes — straight from the Tuitions page</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="App.navigate('tuitions')">Manage Tuitions →</button>
      </div>

      ${!subs.length ? `
        <div class="empty-state">
          <span class="empty-state-icon">🎓</span>
          <div class="empty-state-title">No tuition subjects added</div>
          <p class="empty-state-desc">Go to the Tuitions page to add your subjects and sessions.</p>
          <button class="btn btn-primary" onclick="App.navigate('tuitions')">Go to Tuitions</button>
        </div>
      ` : `
        <!-- Summary chips -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px">
          ${subs.map(sub => `
            <div style="display:flex;align-items:center;gap:6px;background:${sub.color || 'var(--accent)'}18;border:1.5px solid ${sub.color || 'var(--accent)'}44;border-radius:var(--radius-full);padding:5px 12px;font-size:0.8rem;font-weight:700">
              <span>${sub.emoji || '🎓'}</span>
              <span>${sub.name}</span>
              <span style="font-weight:400;color:var(--text-muted)">${(sub.sessions || []).length} session${(sub.sessions || []).length !== 1 ? 's' : ''}/wk</span>
            </div>
          `).join('')}
        </div>

        <!-- 7-day columns -->
        <div class="tuition-week-grid" style="margin-bottom:24px">
          ${this.daysOrdered.map(day => {
      const sessions = [];
      subs.forEach(sub => {
        (sub.sessions || []).forEach(sess => {
          if (sess.day === day) sessions.push({ sub, sess });
        });
      });
      sessions.sort((a, b) => (a.sess.time || '').localeCompare(b.sess.time || ''));
      const isToday = day === todayName;
      return `
              <div class="tuition-day-col ${isToday ? 'tuition-day-today' : ''}">
                <div class="tuition-day-header" style="border-top:3px solid ${this.dayColors[day] || 'var(--accent)'}">
                  <div class="tuition-day-name">${day.slice(0, 3)}</div>
                  ${isToday ? '<div class="tuition-today-badge">Today</div>' : ''}
                </div>
                <div class="tuition-day-sessions">
                  ${sessions.length === 0
          ? `<div class="tuition-no-session">Free</div>`
          : sessions.map(({ sub, sess }) => `
                        <div class="tuition-session-chip" style="border-left:3px solid ${sub.color || 'var(--accent)'}">
                          <div class="tuition-session-emoji">${sub.emoji || '🎓'}</div>
                          <div>
                            <div class="tuition-session-subject">${sub.name}</div>
                            <div class="tuition-session-time">${formatTime12(sess.time)}${sess.location ? ' · ' + sess.location : ''}</div>
                            ${sub.teacher ? `<div class="tuition-session-teacher">👤 ${sub.teacher}</div>` : ''}
                          </div>
                        </div>
                      `).join('')
        }
                </div>
              </div>
            `;
    }).join('')}
        </div>

        <!-- Detail cards per subject -->
        <div style="margin-bottom:12px;font-family:var(--font-display);font-size:1rem;font-weight:800">📋 All Sessions by Subject</div>
        <div class="subjects-grid">
          ${subs.map(sub => {
      const sessOrdered = (sub.sessions || []).slice().sort((a, b) => this.daysOrdered.indexOf(a.day) - this.daysOrdered.indexOf(b.day));
      return `
              <div class="tuition-subject-card" style="border-top:3px solid ${sub.color || 'var(--accent)'}">
                <div class="tuition-subject-card-header">
                  <div style="display:flex;align-items:center;gap:10px">
                    <span style="font-size:1.6rem">${sub.emoji || '🎓'}</span>
                    <div>
                      <div style="font-family:var(--font-display);font-size:1rem;font-weight:700">${sub.name}</div>
                      <div style="font-size:0.78rem;color:var(--text-muted)">${sub.teacher || 'No teacher'} · ${sessOrdered.length} session/wk</div>
                    </div>
                  </div>
                </div>
                <div class="tuition-subject-sessions">
                  ${sessOrdered.length === 0
          ? `<div style="font-size:0.82rem;color:var(--text-muted);text-align:center;padding:8px">No sessions — go to Tuitions to add</div>`
          : sessOrdered.map(sess => `
                        <div class="tuition-session-row">
                          <span class="day-pill" style="background:${this.dayColors[sess.day] || 'var(--accent)'}22;color:${this.dayColors[sess.day] || 'var(--accent)'}">${sess.day}</span>
                          <span style="font-size:0.82rem;font-weight:600">${formatTime12(sess.time)}</span>
                          ${sess.location ? `<span style="font-size:0.75rem;color:var(--text-muted)">📍 ${sess.location}</span>` : ''}
                          ${sess.notes ? `<span style="font-size:0.75rem;color:var(--text-muted);font-style:italic">${sess.notes}</span>` : ''}
                        </div>
                      `).join('')
        }
                </div>
              </div>
            `;
    }).join('')}
        </div>
      `}
    `;
  }
};
