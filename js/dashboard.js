/* ============================================
   DASHBOARD.JS
   ============================================ */

const Dashboard = {
  init() {
    this.render();
  },

  render() {
    const el = document.getElementById('page-dashboard');
    const settings = Store.get('settings', {});
    const name = settings.studentName || 'Scholar';
    const now = new Date();
    const dayNum = now.getDate();
    const monthName = now.toLocaleString('en-IN', { month: 'long' });
    const weekday = now.toLocaleString('en-IN', { weekday: 'long' });
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const greetEmoji = hour < 12 ? '☀️' : hour < 17 ? '📖' : '🌙';

    const subjects = Store.get('subjects', []);
    const exams = Store.get('exams', []);
    const events = Store.get('calendarEvents', []);
    // New tuitions_v2: array of subjects each with sessions[]
    const tuitionSubjects = Store.get('tuitions_v2', []);

    // Today's events + tuitions
    const todayStr_ = todayStr();
    const todayEvents = events.filter(e => e.date === todayStr_ && e.type !== 'tuition');
    const todayDayName = now.toLocaleString('en-IN', { weekday: 'long' });
    // Flatten today's tuition sessions
    const todayTuitions = [];
    tuitionSubjects.forEach(sub => {
      (sub.sessions||[]).forEach(sess => {
        if (sess.day === todayDayName) {
          todayTuitions.push({ subject: sub.name, emoji: sub.emoji||'🎓', time: sess.time, location: sess.location, color: sub.color||'var(--color-tuition)' });
        }
      });
    });
    const upcomingExams = exams
      .filter(e => daysUntil(e.date) !== null && daysUntil(e.date) >= 0)
      .sort((a,b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);

    // Total topics done
    let totalTopics = 0, doneTopic = 0;
    subjects.forEach(s => {
      totalTopics += (s.topics||[]).length;
      doneTopic += (s.topics||[]).filter(t => t.status === 'done').length;
    });
    const studyPct = totalTopics > 0 ? Math.round((doneTopic/totalTopics)*100) : 0;

    el.innerHTML = `
      <!-- Greeting Banner with Quick Stats -->
      <div class="dashboard-greeting-wrap">
        <div class="dashboard-greeting">
          <div>
            <div class="greeting-eyebrow">${weekday}, ${monthName} ${dayNum}</div>
            <div class="greeting-title">${greetEmoji} ${greeting}, ${name}!</div>
            <div class="greeting-sub">Ready to ace Class 12? Here's your overview for today.</div>
          </div>
          <div class="greeting-stats">
            <div class="greet-stat" onclick="App.navigate('subjects')" title="${studyPct}% syllabus done">
              <span class="greet-stat-icon">📚</span>
              <div>
                <div class="greet-stat-num">${subjects.length}</div>
                <div class="greet-stat-lbl">Subjects</div>
              </div>
            </div>
            <div class="greet-stat" onclick="App.navigate('exams')" title="Next: ${upcomingExams.length > 0 ? formatDate(upcomingExams[0].date) : 'None soon'}">
              <span class="greet-stat-icon">📝</span>
              <div>
                <div class="greet-stat-num">${upcomingExams.length}</div>
                <div class="greet-stat-lbl">Exams</div>
              </div>
            </div>
            <div class="greet-stat" onclick="App.navigate('calendar')" title="${todayTuitions.length} tuition(s) today">
              <span class="greet-stat-icon">📋</span>
              <div>
                <div class="greet-stat-num">${todayEvents.length + todayTuitions.length}</div>
                <div class="greet-stat-lbl">Events</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="quick-action-btn" onclick="App.navigate('calendar');setTimeout(()=>Calendar.openAddEvent(),200)">➕ Add Event</button>
        <button class="quick-action-btn" onclick="App.navigate('exams');setTimeout(()=>Exams.openAdd(),200)">📝 Add Exam</button>
        <button class="quick-action-btn" onclick="App.navigate('subjects');setTimeout(()=>SubjectsModule.openAdd(),200)">📚 Add Subject</button>
        <button class="quick-action-btn" onclick="App.navigate('tuitions')">🎓 Tuitions</button>
      </div>

      <!-- Main Body -->
      <div class="dashboard-body">
        <div class="dashboard-main">

          <!-- Today's Schedule -->
          <div class="card">
            <div class="card-title">📅 Today's Schedule</div>
            ${this.renderSchedule(todayEvents, todayTuitions)}
          </div>

          <!-- Subject Progress -->
          <div class="card">
            <div class="card-title">📈 Study Progress</div>
            ${this.renderSubjectProgress(subjects)}
          </div>
        </div>

        <div class="dashboard-side">

          <!-- Upcoming Exams Widget -->
          <div class="card">
            <div class="card-title">🔥 Upcoming Exams</div>
            ${this.renderUpcomingExams(upcomingExams)}
          </div>

          <!-- Upcoming Events -->
          <div class="card">
            <div class="card-title">🗓️ Next 7 Days</div>
            ${this.renderNext7Days(events)}
          </div>
        </div>
      </div>
    `;
  },

  renderSchedule(events, tuitions) {
    const items = [];
    tuitions.forEach(t => {
      items.push({ time: t.time || '—', title: `${t.emoji||'🎓'} ${t.subject}`, type: 'Tuition', color: t.color || 'var(--color-tuition)', isTuition: true });
    });
    events.forEach(e => {
      const colorMap = { hw: 'var(--color-hw)', exam: 'var(--color-exam)', tuition: 'var(--color-tuition)', other: 'var(--color-other)' };
      items.push({ id: e.id, time: e.time || '—', title: e.title, type: e.type, color: colorMap[e.type] || 'var(--color-other)', isTuition: false });
    });

    if (items.length === 0) {
      return `<div class="empty-state"><span class="empty-state-icon">🌟</span><div class="empty-state-title">Free Day!</div><p class="empty-state-desc">No events scheduled for today.</p></div>`;
    }

    items.sort((a,b) => (a.time||'').localeCompare(b.time||''));
    return `<div class="schedule-list">${items.map(i => `
      <div class="schedule-item" onclick="${i.isTuition ? "App.navigate('tuitions')" : `Calendar.previewEvent('${i.id}')`}" title="${i.isTuition ? 'View tuitions' : 'Preview event'}">
        <div class="schedule-color" style="background:${i.color}"></div>
        <div class="schedule-time">${i.time === '—' ? '—' : formatTime12(i.time)}</div>
        <div>
          <div class="schedule-title">${i.title}</div>
          <div class="schedule-type">${i.type}</div>
        </div>
      </div>
    `).join('')}</div>`;
  },

  renderSubjectProgress(subjects) {
    if (!subjects.length) {
      return `<div class="empty-state"><span class="empty-state-icon">📚</span><div class="empty-state-title">No subjects yet</div><p class="empty-state-desc">Add your subjects to track progress.</p><button class="btn btn-primary btn-sm" onclick="App.navigate('subjects');setTimeout(()=>SubjectsModule.openAdd(),200)">Add Subject</button></div>`;
    }
    return `<div class="subject-progress-list">${subjects.slice(0,6).map(s => {
      const total = (s.topics||[]).length;
      const done = (s.topics||[]).filter(t=>t.status==='done').length;
      const pct = total > 0 ? Math.round((done/total)*100) : 0;
      return `
        <div class="subject-progress-row">
          <div class="subject-progress-meta">
            <div class="subject-progress-name"><span>${s.emoji||'📘'}</span>${s.name}</div>
            <div class="subject-progress-pct">${pct}%</div>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${s.color||'var(--accent)'}"></div></div>
        </div>`;
    }).join('')}</div>`;
  },

  renderUpcomingExams(exams) {
    if (!exams.length) {
      return `<div class="empty-state"><span class="empty-state-icon">🎉</span><div class="empty-state-title">No upcoming exams</div><p class="empty-state-desc">Enjoy the peace — or add an exam!</p></div>`;
    }
    return exams.map(e => {
      const days = daysUntil(e.date);
      const urgency = days <= 2 ? 'urgent' : days <= 7 ? 'warning' : 'safe';
      const urgencyColors = { urgent: '#FEE2E2,#991B1B', warning: '#FEF3C7,#92400E', safe: '#D1FAE5,#065F46' };
      const [bg, fg] = urgencyColors[urgency].split(',');
      return `
        <div class="exam-mini-item" onclick="Exams.preview('${e.id}')" title="Preview exam">
          <div class="exam-countdown" style="background:${bg};color:${fg}">
            <div class="exam-countdown-num">${days}</div>
            <div class="exam-countdown-unit">days</div>
          </div>
          <div>
            <div class="exam-mini-subject">${e.subject}</div>
            <div class="exam-mini-date">${formatDate(e.date)}</div>
          </div>
        </div>`;
    }).join('');
  },

  renderNext7Days(events) {
    const today = new Date();
    const upcoming = [];
    // Filter out tuition events — they have their own Calendar tab
    const filtered = events.filter(e => e.type !== 'tuition');
    for (let i = 0; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      filtered.filter(e => e.date === ds).forEach(e => upcoming.push({ ...e, dateObj: d }));
    }
    if (!upcoming.length) {
      return `<div class="empty-state"><span class="empty-state-icon">📅</span><div class="empty-state-title">All clear!</div><p class="empty-state-desc">No homework or exams in the next 7 days.</p></div>`;
    }
    const colorMap = { hw: '#F59E0B', exam: '#EF4444', other: '#8B5CF6' };
    return `<div class="upcoming-events">${upcoming.slice(0,8).map(e => `
      <div class="upcoming-event-item" onclick="Calendar.previewEvent('${e.id}')" title="Preview event">
        <div class="upcoming-event-dot" style="background:${colorMap[e.type]||'#8B5CF6'}"></div>
        <div class="upcoming-event-info">
          <div class="upcoming-event-title">${e.title}</div>
          <div class="upcoming-event-date">${e.dateObj.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</div>
        </div>
      </div>`).join('')}</div>`;
  }
};
