/* ============================================
   SUBJECTS.JS — Subject & Topic Tracker
   ============================================ */

const SubjectsModule = {
  init() { this.render(); },

  subjectColors: ['#6C63FF','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6','#F97316','#84CC16'],
  subjectEmojis: ['📘','📗','📙','📕','🔬','🧮','🌍','✏️','🎨','🎵','🧪','📐','💻','🏛️','🧬'],

  render() {
    const el = document.getElementById('page-subjects');
    const subjects = Store.get('subjects', []);
    el.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-eyebrow">Subjects</div>
            <div class="page-title">📚 Subject Tracker</div>
            <div class="page-subtitle">Track your syllabus, topics, and progress</div>
          </div>
          <button class="btn btn-primary" onclick="SubjectsModule.openAdd()">＋ Add Subject</button>
        </div>
      </div>
      <div class="subjects-controls">
        <div class="subjects-search">
          <span class="subjects-search-icon">🔍</span>
          <input id="subjectSearch" placeholder="Search subjects..." oninput="SubjectsModule.filter(this.value)" />
        </div>
        <div style="font-size:0.85rem;color:var(--text-muted);font-weight:600">${subjects.length} subject${subjects.length!==1?'s':''}</div>
      </div>
      <div class="subjects-grid" id="subjectsGrid"></div>
    `;
    this.renderGrid(subjects);
  },

  renderGrid(subjects) {
    const grid = document.getElementById('subjectsGrid');
    if (!subjects.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">📚</span><div class="empty-state-title">No subjects yet</div><p class="empty-state-desc">Add your Class 12 subjects to start tracking your syllabus.</p><button class="btn btn-primary" onclick="SubjectsModule.openAdd()">＋ Add Subject</button></div>`;
      return;
    }
    grid.innerHTML = subjects.map((s, i) => {
      const total = (s.topics||[]).length;
      const done = (s.topics||[]).filter(t => t.status==='done').length;
      const inProg = (s.topics||[]).filter(t => t.status==='progress').length;
      const pct = total > 0 ? Math.round((done/total)*100) : 0;
      const topicPreview = (s.topics||[]).slice(0,3);
      return `
        <div class="subject-card" onclick="SubjectsModule.openDetail('${s.id}')">
          <div class="subject-card-header">
            <div class="subject-card-left">
              <div class="subject-emoji-badge" style="background:${s.color||'#EAE8FF'}22;border:2px solid ${s.color||'var(--accent)'}33">
                <span style="font-size:1.4rem">${s.emoji||'📘'}</span>
              </div>
              <div class="subject-card-meta">
                <div class="subject-card-name">${s.name}</div>
                <div class="subject-card-teacher">${s.teacher||'No teacher set'}</div>
              </div>
            </div>
            <div class="subject-card-actions" onclick="event.stopPropagation()">
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="SubjectsModule.openEdit('${s.id}')">✏️</button>
              <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="SubjectsModule.deleteSubject('${s.id}')">🗑️</button>
            </div>
          </div>
          <div class="subject-card-body">
            <div class="subject-progress-row">
              <div class="subject-progress-info">
                <span class="subject-progress-text">${done}/${total} topics done</span>
                <span class="subject-progress-num">${pct}%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${s.color||'var(--accent)'}"></div></div>
            </div>
            ${topicPreview.length ? `
              <div class="topic-preview-list">
                ${topicPreview.map(t=>`
                  <div class="topic-preview-item">
                    <div class="topic-status-dot status-${t.status}"></div>
                    <div class="topic-name ${t.status==='done'?'done':''}">${t.name}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="subject-card-footer">
            <span class="topic-count-text">${total} topic${total!==1?'s':''} · ${inProg} in progress</span>
            <span class="badge badge-accent" style="cursor:pointer">View All →</span>
          </div>
        </div>
      `;
    }).join('');
  },

  filter(query) {
    const subjects = Store.get('subjects', []);
    const filtered = query ? subjects.filter(s => s.name.toLowerCase().includes(query.toLowerCase())) : subjects;
    this.renderGrid(filtered);
  },

  openAdd() {
    openModal(`
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Subject Name</label>
          <input class="form-control" id="sub-name" placeholder="e.g. Physics" />
        </div>
        <div class="form-group">
          <label class="form-label">Teacher Name (optional)</label>
          <input class="form-control" id="sub-teacher" placeholder="e.g. Mr. Sharma" />
        </div>
        <div class="form-group">
          <label class="form-label">Choose Icon</label>
          <div class="emoji-options" id="sub-emoji-picker">
            ${this.subjectEmojis.map(e=>`<div class="emoji-opt" data-emoji="${e}" onclick="SubjectsModule.selectEmoji(this,'${e}')">${e}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <div class="color-swatch-grid" id="sub-color-picker">
            ${this.subjectColors.map(c=>`<div class="color-swatch" style="background:${c}" data-color="${c}" onclick="SubjectsModule.selectColor(this,'${c}')"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="SubjectsModule.saveAdd()">Add Subject</button>
      </div>
    `, '📚 Add Subject');
    this._emoji = this.subjectEmojis[0];
    this._color = this.subjectColors[0];
    setTimeout(() => {
      document.querySelector('#sub-emoji-picker .emoji-opt')?.classList.add('selected');
      document.querySelector('#sub-color-picker .color-swatch')?.classList.add('selected');
      bindEnterToSubmit('.modal', '.modal-footer .btn-primary');
    }, 50);
  },

  selectEmoji(el, e) { document.querySelectorAll('#sub-emoji-picker .emoji-opt').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); this._emoji = e; },
  selectColor(el, c) { document.querySelectorAll('#sub-color-picker .color-swatch').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); this._color = c; },

  saveAdd() {
    const name = document.getElementById('sub-name').value.trim();
    if (!name) { showToast('Please enter a subject name', 'error'); return; }
    const teacher = document.getElementById('sub-teacher').value.trim();
    const subjects = Store.get('subjects', []);
    subjects.push({ id: uid(), name, teacher, emoji: this._emoji, color: this._color, topics: [], createdAt: new Date().toISOString() });
    Store.set('subjects', subjects);
    closeModal();
    this.render();
    showToast('Subject added!', 'success');
    if (document.getElementById('page-dashboard').classList.contains('active')) Dashboard.render();
  },

  openEdit(id) {
    const subjects = Store.get('subjects', []);
    const s = subjects.find(x => x.id === id);
    if (!s) return;
    openModal(`
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Subject Name</label>
          <input class="form-control" id="sub-edit-name" value="${s.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Teacher Name</label>
          <input class="form-control" id="sub-edit-teacher" value="${s.teacher||''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Icon</label>
          <div class="emoji-options" id="sub-edit-emoji">
            ${this.subjectEmojis.map(e=>`<div class="emoji-opt${s.emoji===e?' selected':''}" onclick="SubjectsModule.selectEmoji2(this,'${e}')">${e}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <div class="color-swatch-grid" id="sub-edit-color">
            ${this.subjectColors.map(c=>`<div class="color-swatch${s.color===c?' selected':''}" style="background:${c}" onclick="SubjectsModule.selectColor2(this,'${c}')"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="SubjectsModule.saveEdit('${id}')">Save Changes</button>
      </div>
    `, '✏️ Edit Subject');
    this._emoji2 = s.emoji; this._color2 = s.color;
    setTimeout(() => bindEnterToSubmit('.modal', '.modal-footer .btn-primary'), 50);
  },

  selectEmoji2(el, e) { document.querySelectorAll('#sub-edit-emoji .emoji-opt').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); this._emoji2 = e; },
  selectColor2(el, c) { document.querySelectorAll('#sub-edit-color .color-swatch').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); this._color2 = c; },

  saveEdit(id) {
    const name = document.getElementById('sub-edit-name').value.trim();
    if (!name) { showToast('Please enter a subject name', 'error'); return; }
    const teacher = document.getElementById('sub-edit-teacher').value.trim();
    const subjects = Store.get('subjects', []);
    const idx = subjects.findIndex(x => x.id === id);
    if (idx > -1) { subjects[idx] = { ...subjects[idx], name, teacher, emoji: this._emoji2, color: this._color2 }; }
    Store.set('subjects', subjects);
    closeModal();
    this.render();
    showToast('Subject updated!', 'success');
  },

  deleteSubject(id) {
    if (!confirm('Delete this subject and all its topics?')) return;
    let subjects = Store.get('subjects', []);
    subjects = subjects.filter(s => s.id !== id);
    Store.set('subjects', subjects);
    this.render();
    showToast('Subject deleted', 'info');
    if (document.getElementById('page-dashboard').classList.contains('active')) Dashboard.render();
  },

  openDetail(id) {
    const subjects = Store.get('subjects', []);
    const s = subjects.find(x => x.id === id);
    if (!s) return;
    const total = (s.topics||[]).length;
    const done = (s.topics||[]).filter(t=>t.status==='done').length;
    const pct = total > 0 ? Math.round((done/total)*100) : 0;
    const statusOptions = [{v:'not',l:'Not Started'},{v:'progress',l:'In Progress'},{v:'done',l:'Done'}];
    openModal(`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div style="width:48px;height:48px;border-radius:12px;background:${s.color}22;display:flex;align-items:center;justify-content:center;font-size:1.4rem;border:2px solid ${s.color}44">${s.emoji||'📘'}</div>
        <div>
          <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700">${s.name}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${s.teacher||''} · ${pct}% complete</div>
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:20px"><div class="progress-fill" style="width:${pct}%;background:${s.color}"></div></div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <strong style="font-size:0.85rem">Topics (${total})</strong>
        <button class="btn btn-secondary btn-sm" onclick="SubjectsModule.addTopic('${id}')">＋ Add Topic</button>
      </div>
      <div class="topics-full-list" id="topicsList-${id}">
        ${this.renderTopicList(s)}
      </div>
    `, '📖 Subject Detail');
  },

  renderTopicList(s) {
    if (!s.topics?.length) return `<div class="empty-state"><span class="empty-state-icon">📄</span><div class="empty-state-title">No topics yet</div><p class="empty-state-desc">Add topics to track your syllabus.</p></div>`;
    return s.topics.map((t, ti) => `
      <div class="topic-full-item">
        <select class="topic-status-select" onchange="SubjectsModule.updateTopicStatus('${s.id}',${ti},this.value)">
          <option value="not" ${t.status==='not'?'selected':''}>Not Started</option>
          <option value="progress" ${t.status==='progress'?'selected':''}>In Progress</option>
          <option value="done" ${t.status==='done'?'selected':''}>Done ✓</option>
        </select>
        <div class="topic-status-dot status-${t.status}" style="flex-shrink:0"></div>
        <div class="topic-full-name ${t.status==='done'?'done':''}">${t.name}</div>
        <button class="btn btn-danger btn-sm btn-icon" onclick="SubjectsModule.deleteTopic('${s.id}',${ti})" title="Delete">✕</button>
      </div>
    `).join('');
  },

  addTopic(subjectId) {
    const name = prompt('Enter topic name:');
    if (!name?.trim()) return;
    const subjects = Store.get('subjects', []);
    const idx = subjects.findIndex(s => s.id === subjectId);
    if (idx === -1) return;
    subjects[idx].topics = subjects[idx].topics || [];
    subjects[idx].topics.push({ name: name.trim(), status: 'not' });
    Store.set('subjects', subjects);
    closeModal();
    this.openDetail(subjectId);
    this.renderGrid(Store.get('subjects', []));
    showToast('Topic added!', 'success');
  },

  updateTopicStatus(subjectId, topicIndex, status) {
    const subjects = Store.get('subjects', []);
    const idx = subjects.findIndex(s => s.id === subjectId);
    if (idx === -1) return;
    subjects[idx].topics[topicIndex].status = status;
    Store.set('subjects', subjects);
    this.renderGrid(Store.get('subjects', []));
  },

  deleteTopic(subjectId, topicIndex) {
    const subjects = Store.get('subjects', []);
    const idx = subjects.findIndex(s => s.id === subjectId);
    if (idx === -1) return;
    subjects[idx].topics.splice(topicIndex, 1);
    Store.set('subjects', subjects);
    closeModal();
    this.openDetail(subjectId);
    this.renderGrid(Store.get('subjects', []));
    showToast('Topic deleted', 'info');
  }
};
