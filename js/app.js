/* ============================================
   APP.JS — Main Router & App Bootstrap
   ============================================ */

const App = {
  currentPage: 'dashboard',
  pages: ['dashboard','sliders','calendar','subjects','exams','tuitions','payments','expense','settings'],

  init() {
    // Init Offline Auto-Sync
    Store.initSync();

    // Apply stored settings (colors, font size)
    Settings.applyStoredSettings();

    // Migrate old tuition data format to new grouped format
    Tuitions.migrateOldData();

    // Init all modules
    Dashboard.init();
    SliderModule.init();
    Calendar.init();
    SubjectsModule.init();
    Exams.init();
    Tuitions.init();
    Payments.init();
    Expense.init();

    Settings.init();

    // Handle hash routing
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());

    // Sidebar toggle (tablet)
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('expanded');
    });

    // Close sidebar when clicking main on mobile
    document.getElementById('mainContent')?.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        document.getElementById('sidebar').classList.remove('expanded');
      }
    });

    // Modal close
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalOverlay')) closeModal();
    });

    // Keyboard: Escape to close modal, Alt+1-7 to navigation, Alt+N for Quick Add
    document.addEventListener('keydown', (e) => {
      // Escape to close modal
      if (e.key === 'Escape') closeModal();

      // Alt + 1-9: Page Navigation
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const pageIdx = parseInt(e.key) - 1;
        if (this.pages[pageIdx]) this.navigate(this.pages[pageIdx]);
      }

      // Alt + N: Quick Add (Context sensitive)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        this.quickAdd();
      }

      // Ctrl + F: Search (on Subjects page)
      if (e.ctrlKey && e.key === 'f' && this.currentPage === 'subjects') {
        e.preventDefault();
        document.getElementById('subjectSearch')?.focus();
      }
    });

    // Nav item click
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const page = item.dataset.page;
        if (page) {
          e.preventDefault();
          this.navigate(page);
        }
      });
    });
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const page = this.pages.includes(hash) ? hash : 'dashboard';
    this.showPage(page);
  },

  navigate(page) {
    window.location.hash = page;
    this.showPage(page);
  },

  showPage(page) {
    // Hide all pages
    this.pages.forEach(p => {
      const el = document.getElementById(`page-${p}`);
      if (el) el.classList.remove('active');
    });

    // Show selected
    const el = document.getElementById(`page-${page}`);
    if (el) el.classList.add('active');

    // Re-render dashboard when switching to it (to refresh data)
    if (page === 'dashboard') Dashboard.render();

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    this.currentPage = page;

    // Scroll main to top
    document.getElementById('mainContent')?.scrollTo(0, 0);
  },

  quickAdd() {
    switch(this.currentPage) {
      case 'dashboard':
        // No specific quick add for dashboard, maybe show a hint or do nothing
        showToast('Use shortcuts on other pages to add items', 'info');
        break;
      case 'sliders':
        // Sliders might not have a quick add
        break;
      case 'calendar':
        Calendar.openAddEvent();
        break;
      case 'subjects':
        SubjectsModule.openAdd();
        break;
      case 'exams':
        Exams.openAdd();
        break;
      case 'tuitions':
        Tuitions.openAddSubject();
        break;
      case 'payments':
        Payments.openAddSir();
        break;
      case 'expense':
        Expense.openAdd();
        break;
    }
  },

  toggleSidebarCompact() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('mainContent');
    const isCompact = sidebar.classList.contains('compact');
    if (isCompact) {
      sidebar.classList.remove('compact');
      sidebar.style.width = '';
      main.style.marginLeft = '';
    } else {
      sidebar.classList.add('compact');
      sidebar.style.width = 'var(--sidebar-collapsed)';
      main.style.marginLeft = 'var(--sidebar-collapsed)';
      // Hide labels
      sidebar.querySelectorAll('.nav-label, .brand-name').forEach(el => {
        el.style.opacity = '0'; el.style.width = '0'; el.style.overflow = 'hidden';
      });
    }
    showToast(isCompact ? 'Sidebar expanded' : 'Sidebar compact mode', 'info');
  }
};

// Bootstrap when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
