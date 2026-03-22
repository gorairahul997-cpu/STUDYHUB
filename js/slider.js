/* ============================================
   SLIDER.JS — Premium My Board
   - Top: Mac Dock (glass morphism, magnification hover)
   - Bottom: Kanban Board (columns + cards, drag to reorder)
   ============================================ */

const SliderModule = {
  init() { this.render(); },

  render() {
    const el = document.getElementById('page-sliders');
    el.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-eyebrow">My Board</div>
            <div class="page-title">📌 My Board</div>
            <div class="page-subtitle">Your personal quick-launcher dock and note board</div>
          </div>
        </div>
      </d      <!-- SECTION 2: KANBAN BOARD -->
      <div class="slider-section">
        <div class="slider-section-header">
          <div>
            <div class="slider-section-title">🗂️ My Note Board</div>
            <div class="slider-section-desc">Organize notes, goals, and reminders into columns</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="SliderModule.openAddColumn()">＋ Add Column</button>
        </div>
        <div class="board-columns" id="boardColumns"></div>
      </div>
    `;
    this.renderBoard();
  },

  /* ============================================================
     KANBAN BOARD
     ============================================================ */
  defaultColumns() {
    return [
      {
        id: uid(), title: '🎯 Goals', color: '#6C63FF',
        cards: [
          { id: uid(), icon: '🏆', title: 'Score 90%+ in Boards', body: 'Focus on Maths, Physics, and Chemistry. Daily 3-hour self-study.', tag: 'Priority' },
          { id: uid(), icon: '📖', title: 'Complete all chapters', body: 'Finish NCERT textbooks before Feb end and revise thereafter.', tag: 'Academic' },
        ]
      },
      {
        id: uid(), title: '📋 Reminders', color: '#F59E0B',
        cards: [
          { id: uid(), icon: '⏰', title: 'Daily Routine', body: 'Wake 6AM → School → 3hrs Self Study → Revise → Sleep 10PM', tag: 'Routine' },
          { id: uid(), icon: '💡', title: 'Exam Tip', body: 'Practice last 10 years papers — 2 months before boards!', tag: 'Tip' },
        ]
      },
      {
        id: uid(), title: '✅ Done', color: '#10B981',
        cards: []
      }
    ];
  },

  renderBoard() {
    const cols = Store.get('boardColumns', null) || this._initDefaultColumns();
    const container = document.getElementById('boardColumns');
    if (!container) return;
    container.innerHTML = '';

    cols.forEach((col, ci) => {
      const colEl = document.createElement('div');
      colEl.className = 'board-column';
      colEl.dataset.colIndex = ci;

      colEl.innerHTML = `
        <div class="board-column-header" style="border-top: 3px solid ${col.color||'var(--accent)'}">
          <div class="board-column-title" style="color:${col.color||'var(--accent)'}">
            ${col.title}
            <span class="board-column-count">${(col.cards||[]).length}</span>
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-sm btn-icon" title="Rename" onclick="SliderModule.editColumn(${ci})">✏️</button>
            <button class="btn btn-danger btn-sm btn-icon" title="Delete column" onclick="SliderModule.deleteColumn(${ci})">🗑️</button>
          </div>
        </div>
        <div class="board-column-body" id="board-col-${ci}">
          ${(col.cards||[]).map((card, cardi) => this._renderCard(card, ci, cardi)).join('')}
        </div>
        <div style="padding: var(--space-3)">
          <button class="board-add-card-btn" onclick="SliderModule.openAddCard(${ci})">＋ Add card</button>
        </div>
      `;

      // Drop zone for drag-between-columns
      const body = colEl.querySelector('.board-column-body');
      body.addEventListener('dragover', e => { e.preventDefault(); body.style.background = 'var(--accent-light)'; });
      body.addEventListener('dragleave', () => { body.style.background = ''; });
      body.addEventListener('drop', e => {
        e.preventDefault();
        body.style.background = '';
        const fromCol = parseInt(e.dataTransfer.getData('fromCol'));
        const fromCard = parseInt(e.dataTransfer.getData('fromCard'));
        if (isNaN(fromCol) || isNaN(fromCard)) return;
        const allCols = Store.get('boardColumns', []);
        const [card] = allCols[fromCol].cards.splice(fromCard, 1);
        allCols[ci].cards.push(card);
        Store.set('boardColumns', allCols);
        this.renderBoard();
        showToast('Card moved!', 'info');
      });

      container.appendChild(colEl);
    });

    // Add column button
    const addColBtn = document.createElement('button');
    addColBtn.className = 'board-add-col-btn';
    addColBtn.innerHTML = '<span style="font-size:1.4rem">＋</span><span>Add Column</span>';
    addColBtn.addEventListener('click', () => this.openAddColumn());
    container.appendChild(addColBtn);
  },

  _initDefaultColumns() {
    const cols = this.defaultColumns();
    Store.set('boardColumns', cols);
    return cols;
  },

  _renderCard(card, ci, cardi) {
    return `
      <div class="board-card" draggable="true"
        ondragstart="event.dataTransfer.setData('fromCol','${ci}');event.dataTransfer.setData('fromCard','${cardi}');this.classList.add('dragging')"
        ondragend="this.classList.remove('dragging')"
        ondragover="event.preventDefault();this.classList.add('drag-target')"
        ondragleave="this.classList.remove('drag-target')"
        ondrop="event.preventDefault();this.classList.remove('drag-target');SliderModule._dropOnCard(event,${ci},${cardi})">
        <span class="board-card-icon">${card.icon||'📌'}</span>
        <div class="board-card-title">${card.title}</div>
        ${card.body ? `<div class="board-card-body">${card.body}</div>` : ''}
        <div class="board-card-footer">
          <span class="badge badge-accent" style="font-size:0.65rem">${card.tag||'Note'}</span>
          <div class="board-card-actions">
            <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="event.stopPropagation();SliderModule.openEditCard(${ci},${cardi})">✏️</button>
            <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="event.stopPropagation();SliderModule.deleteCard(${ci},${cardi})">🗑️</button>
          </div>
        </div>
      </div>`;
  },

  _dropOnCard(e, toCol, toCard) {
    const fromCol = parseInt(e.dataTransfer.getData('fromCol'));
    const fromCard = parseInt(e.dataTransfer.getData('fromCard'));
    if (isNaN(fromCol) || isNaN(fromCard)) return;
    if (fromCol === toCol && fromCard === toCard) return;
    const cols = Store.get('boardColumns', []);
    const [card] = cols[fromCol].cards.splice(fromCard, 1);
    cols[toCol].cards.splice(toCard, 0, card);
    Store.set('boardColumns', cols);
    this.renderBoard();
  },

  openAddColumn() {
    const colors = ['#6C63FF','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];
    const icons = ['🎯','📋','✅','💡','⭐','🔥','📌','📚','🧠','🚀'];
    this._colColor = colors[0]; this._colIcon = icons[0];
    openModal(`
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Column Title</label>
          <div style="display:flex;gap:8px;align-items:center">
            <span id="col-icon-preview" style="font-size:1.4rem">${icons[0]}</span>
            <input class="form-control" id="col-title" placeholder="e.g. 📋 To-Do" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Icon</label>
          <div class="emoji-options" id="col-icon-picker">
            ${icons.map(ic=>`<div class="emoji-opt ${ic===icons[0]?'selected':''}" onclick="SliderModule._colSelectIcon(this,'${ic}')">${ic}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Column Color</label>
          <div class="color-swatch-grid" id="col-color-picker">
            ${colors.map(c=>`<div class="color-swatch ${c===colors[0]?'selected':''}" style="background:${c}" onclick="SliderModule._colSelectColor(this,'${c}')"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="SliderModule.saveColumn()">Add Column</button>
      </div>
    `, '➕ Add Column');
  },

  _colSelectIcon(el, icon) { document.querySelectorAll('#col-icon-picker .emoji-opt').forEach(e=>e.classList.remove('selected')); el.classList.add('selected'); this._colIcon=icon; const prev = document.getElementById('col-icon-preview'); if(prev) prev.textContent=icon; },
  _colSelectColor(el, c) { document.querySelectorAll('#col-color-picker .color-swatch').forEach(e=>e.classList.remove('selected')); el.classList.add('selected'); this._colColor=c; },

  saveColumn(editIndex = null) {
    let title = document.getElementById('col-title')?.value.trim();
    if (!title) { showToast('Enter column title', 'error'); return; }
    // Prepend icon if not already in title
    if (!title.match(/^\p{Emoji}/u)) title = `${this._colIcon} ${title}`;
    const cols = Store.get('boardColumns', []);
    if (editIndex !== null) { cols[editIndex].title = title; cols[editIndex].color = this._colColor; }
    else { cols.push({ id: uid(), title, color: this._colColor||'#6C63FF', cards: [] }); }
    Store.set('boardColumns', cols);
    closeModal(); this.renderBoard();
    showToast(editIndex !== null ? 'Column updated!' : 'Column added!', 'success');
  },

  editColumn(ci) {
    const cols = Store.get('boardColumns', []);
    const col = cols[ci];
    const colors = ['#6C63FF','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];
    this._colColor = col.color || '#6C63FF'; this._colIcon = '📋';
    openModal(`
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Column Title</label>
          <input class="form-control" id="col-title" value="${col.title}" />
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <div class="color-swatch-grid" id="col-color-picker">
            ${colors.map(c=>`<div class="color-swatch ${c===col.color?'selected':''}" style="background:${c}" onclick="SliderModule._colSelectColor(this,'${c}')"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="SliderModule.saveColumn(${ci})">Save</button>
      </div>
    `, '✏️ Edit Column');
  },

  deleteColumn(ci) {
    const cols = Store.get('boardColumns', []);
    if ((cols[ci].cards||[]).length > 0) {
      if (!confirm(`Delete "${cols[ci].title}" and all its cards?`)) return;
    }
    cols.splice(ci, 1);
    Store.set('boardColumns', cols);
    this.renderBoard();
    showToast('Column deleted', 'info');
  },

  openAddCard(ci, editCardIndex = null) {
    const cols = Store.get('boardColumns', []);
    const col = cols[ci];
    const existing = editCardIndex !== null ? col.cards[editCardIndex] : null;
    const icons = ['📌','🎯','💡','⏰','📖','🔬','🧮','🌍','🎵','💻','📊','🏆','⚡','🔭','🎨','📐','🧪','📝','🎓','✍️','🚀','☕','🌟','🧘'];
    this._cardIcon = existing?.icon || icons[0];
    openModal(`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:0.85rem;color:var(--text-muted)">
        Adding to: <strong style="color:var(--accent)">${col.title}</strong>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Icon</label>
          <div class="emoji-options" id="card-icon-picker">
            ${icons.map(ic=>`<div class="emoji-opt ${ic===(existing?.icon||icons[0])?'selected':''}" onclick="SliderModule._cardSelectIcon(this,'${ic}')">${ic}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Title</label>
          <input class="form-control" id="card-title" value="${existing?.title||''}" placeholder="Card title" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-control" id="card-body" placeholder="Details, notes, description...">${existing?.body||''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Tag</label>
          <input class="form-control" id="card-tag" value="${existing?.tag||''}" placeholder="e.g. Priority, Reminder, Tip" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="SliderModule.saveCard(${ci}, ${editCardIndex !== null ? editCardIndex : 'null'})">
          ${editCardIndex !== null ? 'Save Changes' : 'Add Card'}
        </button>
      </div>
    `, editCardIndex !== null ? '✏️ Edit Card' : '🗂️ Add Card');
  },

  _cardSelectIcon(el, icon) { document.querySelectorAll('#card-icon-picker .emoji-opt').forEach(e=>e.classList.remove('selected')); el.classList.add('selected'); this._cardIcon=icon; },

  openEditCard(ci, cardi) { this.openAddCard(ci, cardi); },

  saveCard(ci, editCardIndex) {
    const title = document.getElementById('card-title').value.trim();
    if (!title) { showToast('Enter a title', 'error'); return; }
    const body = document.getElementById('card-body').value.trim();
    const tag = document.getElementById('card-tag').value.trim() || 'Note';
    const cols = Store.get('boardColumns', []);
    const card = { id: uid(), icon: this._cardIcon||'📌', title, body, tag };
    if (editCardIndex !== null) { cols[ci].cards[editCardIndex] = card; }
    else { cols[ci].cards.push(card); }
    Store.set('boardColumns', cols);
    closeModal(); this.renderBoard();
    showToast(editCardIndex !== null ? 'Card updated!' : 'Card added!', 'success');
  },

  deleteCard(ci, cardi) {
    if (!confirm('Delete this card?')) return;
    const cols = Store.get('boardColumns', []);
    cols[ci].cards.splice(cardi, 1);
    Store.set('boardColumns', cols);
    this.renderBoard();
    showToast('Card deleted', 'info');
  }
};
