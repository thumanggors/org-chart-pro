/* ===== OrgChart Pro — Main Application Controller ===== */

const App = {
  currentView: 'dashboard',

  init() {
    // Restore last session from LocalStorage; otherwise start empty
    StorageService.autoLoad();

    // Load theme + language preference
    const settings = StorageService.loadSettings();
    if (settings.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
    I18n.setLang(settings.lang || 'id');

    // Initial render
    this.refresh();
    this.switchView('dashboard');

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this.redo(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); StorageService.save(); }
      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); document.getElementById('searchInput').focus(); }
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        UI.closeDrawer();
        this.hideExportMenu();
        document.getElementById('searchResults').classList.remove('active');
        document.body.style.overflow = '';
      }
      if (e.key === 'Delete' && OrgChart.selectedId) {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) return;
        e.preventDefault();
        this.deleteNode(OrgChart.selectedId);
      }
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    searchInput.addEventListener('input', Utils.debounce(() => {
      const query = searchInput.value.trim();
      const results = DataService.search(query);
      if (results.length === 0 || query.length < 2) {
        searchResults.classList.remove('active');
        return;
      }
      searchResults.innerHTML = results.map(n => `
        <div class="search-result-item" data-id="${n.id}">
          <div>
            <div class="search-result-name">${Utils.escapeHtml(n.name)}</div>
            <div class="search-result-meta">${Utils.escapeHtml(n.title || '')} ${n.department ? '· ' + Utils.escapeHtml(n.department) : ''}</div>
          </div>
          <span class="search-result-badge">${Utils.getTypeLabel(n.type)}</span>
        </div>
      `).join('');
      searchResults.classList.add('active');
    }, 200));

    searchResults.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      const id = item.dataset.id;
      searchResults.classList.remove('active');
      searchInput.value = '';
      OrgChart.showDepartment(''); // the found node may sit outside a department filter
      setTimeout(() => {
        OrgChart.selectNode(id); // also unfolds its ancestors
        OrgChart.centerOnNode(id);
      }, 200);
    });

    // Close search results on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#globalSearch')) {
        searchResults.classList.remove('active');
      }
      if (!e.target.closest('#exportMenu') && !e.target.closest('[onclick*="showExportMenu"]')) {
        this.hideExportMenu();
      }
    });

    // Hide loading
    setTimeout(() => {
      const overlay = document.getElementById('loadingOverlay');
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.style.display = 'none', 500);
    }, 800);
  },

  refresh() {
    document.getElementById('navbarOrgName').textContent = DataService.getOrganization().name || t('Untitled');
    OrgChart.populateFilters();
    UI.renderDashboard();
    UI.renderEmployeeTable();
    if (this.currentView === 'departments') UI.renderDepartments();

    if (this.currentView === 'orgchart') {
      OrgChart.init();
      setTimeout(() => OrgChart.fitToScreen(), 200);
    }

    StorageService._updateUndoButtons();
  },

  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1));
    if (target) {
      target.classList.remove('hidden');
      if (target.id === 'viewOrgchart') target.style.display = 'flex';
    }

    document.querySelectorAll('.sidebar-item[data-view]').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    if (view === 'orgchart') {
      OrgChart.init();
      setTimeout(() => OrgChart.fitToScreen(), 200);
    }
    if (view === 'dashboard') UI.renderDashboard();
    if (view === 'employees') UI.renderEmployeeTable();
    if (view === 'departments') UI.renderDepartments();

    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
      document.getElementById('sidebar').classList.remove('mobile-open');
      document.getElementById('sidebarOverlay').classList.remove('active');
    }
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (window.innerWidth <= 1024) {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('active');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  },

  toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    StorageService.saveSettings({ ...StorageService.loadSettings(), theme: next });

    // Update theme icon
    const btn = document.getElementById('btnTheme');
    btn.innerHTML = next === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';

    if (this.currentView === 'orgchart') {
      OrgChart.render();
    }
  },

  toggleLang() {
    I18n.setLang(I18n.lang === 'id' ? 'en' : 'id');
    StorageService.saveSettings({ ...StorageService.loadSettings(), lang: I18n.lang });
    UI.closeDrawer();
    this.refresh();
  },

  addNode(type, parentId) {
    UI.populateNodeForm(null, parentId || '');
    if (type) document.getElementById('nodeType').value = type;
    UI.openModal('nodeModal');
  },

  editNode(id) {
    const node = DataService.getNode(id);
    if (!node) return;
    UI.populateNodeForm(node);
    UI.openModal('nodeModal');
  },

  saveNode() {
    const id = document.getElementById('nodeId').value;
    const nodeData = {
      type: document.getElementById('nodeType').value,
      name: document.getElementById('nodeName').value.trim(),
      title: document.getElementById('nodeTitle').value.trim(),
      department: document.getElementById('nodeDepartment').value.trim(),
      division: document.getElementById('nodeDivision').value.trim(),
      parentId: document.getElementById('nodeParent').value || null,
      employeeCode: document.getElementById('nodeEmpCode').value.trim(),
      email: document.getElementById('nodeEmail').value.trim(),
      phone: document.getElementById('nodePhone').value.trim(),
      description: document.getElementById('nodeDescription').value.trim(),
      status: document.getElementById('nodeStatus').value,
      color: document.getElementById('nodeColor').value,
    };

    if (!nodeData.name) {
      UI.toast(t('Name is required'), 'error');
      return;
    }

    StorageService.pushUndo();

    if (id) {
      DataService.updateNode(id, nodeData);
      UI.toast(t('Node updated'), 'success');
    } else {
      nodeData.id = Utils.generateId();
      nodeData.level = 0;
      nodeData.photo = '';
      if (!DataService.addNode(nodeData)) {
        UI.toast(t('Failed to add node'), 'error');
        return;
      }
      UI.toast(t('Node added'), 'success');
    }

    UI.closeModal('nodeModal');
    this.refresh();

    const finalId = id || nodeData.id;
    if (this.currentView === 'orgchart' && finalId) {
      OrgChart.selectNode(finalId);
    }
  },

  deleteNode(id) {
    const node = DataService.getNode(id);
    if (!node) return;
    const childCount = DataService.getChildren(id).length;
    const msg = childCount > 0
      ? t('Delete "{name}" and all {n} children?', { name: node.name, n: childCount })
      : t('Delete "{name}"?', { name: node.name });

    UI.confirm(t('Delete Node'), msg, () => {
      StorageService.pushUndo();
      DataService.deleteNode(id);
      OrgChart.selectedId = null;
      UI.closeDrawer();
      this.refresh();
      UI.toast(t('Node deleted'), 'success');
    });
  },

  duplicateNode(id) {
    StorageService.pushUndo();
    const newNode = DataService.duplicateNode(id);
    if (newNode) {
      this.refresh();
      UI.toast(t('Node duplicated'), 'success');
    }
  },

  undo() { StorageService.undo(); },
  redo() { StorageService.redo(); },

  showExportMenu(event) {
    const menu = document.getElementById('exportMenu');
    const rect = event.currentTarget.getBoundingClientRect();
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.style.left = 'auto';
    menu.classList.toggle('active');
  },

  hideExportMenu() {
    document.getElementById('exportMenu').classList.remove('active');
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
