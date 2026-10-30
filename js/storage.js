/* ===== OrgChart Pro — Storage Service ===== */

const StorageService = {
  KEY_PREFIX: 'orgchart_',
  CURRENT_KEY: 'orgchart_current',
  HISTORY_KEY: 'orgchart_history',
  SETTINGS_KEY: 'orgchart_settings',
  MAX_UNDO: 30,

  _undoStack: [],
  _redoStack: [],

  save(name) {
    const data = DataService.getData();
    const key = this.KEY_PREFIX + (name || 'default');
    const entry = {
      name: name || data.organization.name,
      data: data,
      savedAt: new Date().toISOString(),
      nodeCount: data.nodes.length,
    };
    try {
      localStorage.setItem(key, JSON.stringify(entry));
      this._updateSavedList(key, entry.name, entry.savedAt, entry.nodeCount);
      UI.toast(t('Organization saved'), 'success');
    } catch (e) {
      UI.toast(t('Save failed: storage full'), 'error');
    }
  },

  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) { UI.toast(t('Save not found'), 'error'); return; }
      const entry = JSON.parse(raw);
      DataService.setData(entry.data);
      OrgChart.resetView();
      this._undoStack = [];
      this._redoStack = [];
      App.refresh();
      UI.toast(t('Organization loaded'), 'success');
    } catch (e) {
      UI.toast(t('Load failed: corrupted data'), 'error');
    }
  },

  deleteSave(key) {
    localStorage.removeItem(key);
    const list = this._getSavedList();
    delete list[key];
    localStorage.setItem(this.KEY_PREFIX + 'list', JSON.stringify(list));
  },

  getSavedList() {
    return this._getSavedList();
  },

  _getSavedList() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY_PREFIX + 'list') || '{}');
    } catch { return {}; }
  },

  _updateSavedList(key, name, savedAt, nodeCount) {
    const list = this._getSavedList();
    list[key] = { name, savedAt, nodeCount };
    localStorage.setItem(this.KEY_PREFIX + 'list', JSON.stringify(list));
  },

  autoSave() {
    try {
      localStorage.setItem(this.CURRENT_KEY, JSON.stringify(DataService.getData()));
    } catch { /* storage full, ignore */ }
  },

  autoLoad() {
    try {
      const raw = localStorage.getItem(this.CURRENT_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        // ORG001 = the removed built-in demo; drop it if a browser still has it autosaved
        if (data && data.nodes && data.nodes.length > 0 && data.organization?.id !== 'ORG001') {
          DataService.setData(data);
          return true;
        }
      }
    } catch { /* corrupted, ignore */ }
    return false;
  },

  pushUndo() {
    const snapshot = JSON.stringify(DataService.getData());
    this._undoStack.push(snapshot);
    if (this._undoStack.length > this.MAX_UNDO) this._undoStack.shift();
    this._redoStack = [];
    this._updateUndoButtons();
    this.autoSave();
  },

  undo() {
    if (this._undoStack.length === 0) return;
    this._redoStack.push(JSON.stringify(DataService.getData()));
    const snapshot = this._undoStack.pop();
    DataService.setData(JSON.parse(snapshot));
    App.refresh();
    this._updateUndoButtons();
    this.autoSave();
  },

  redo() {
    if (this._redoStack.length === 0) return;
    this._undoStack.push(JSON.stringify(DataService.getData()));
    const snapshot = this._redoStack.pop();
    DataService.setData(JSON.parse(snapshot));
    App.refresh();
    this._updateUndoButtons();
    this.autoSave();
  },

  _updateUndoButtons() {
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    if (btnUndo) btnUndo.disabled = this._undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = this._redoStack.length === 0;
  },

  saveSettings(settings) {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  },

  loadSettings() {
    try { return JSON.parse(localStorage.getItem(this.SETTINGS_KEY) || '{}'); }
    catch { return {}; }
  },

  showSaveModal() {
    const body = document.getElementById('storageModalBody');
    const footer = document.getElementById('storageModalFooter');
    document.getElementById('storageModalTitle').textContent = t('Save Organization');

    body.innerHTML = `
      <div class="form-group">
        <label>${t('Save Name')}</label>
        <input type="text" class="save-name-input" id="saveName" value="${Utils.escapeHtml(DataService.getData().organization.name)}" placeholder="${t('Organization name')}">
      </div>
    `;
    footer.innerHTML = `
      <button class="btn-secondary" onclick="UI.closeModal('storageModal')">${t('Cancel')}</button>
      <button class="btn-secondary" onclick="ExportService.exportJSON(); UI.closeModal('storageModal')">${t('Download to computer')}</button>
      <button class="btn-primary" onclick="StorageService.save(document.getElementById('saveName').value); UI.closeModal('storageModal')">${t('Save')}</button>
    `;
    UI.openModal('storageModal');
  },

  showLoadModal() {
    const body = document.getElementById('storageModalBody');
    const footer = document.getElementById('storageModalFooter');
    document.getElementById('storageModalTitle').textContent = t('Load Organization');

    const list = this._getSavedList();
    const keys = Object.keys(list);
    const footerHtml = `
      <label class="btn-secondary">${t('Open from computer')}
        <input type="file" accept=".json,application/json" hidden onchange="StorageService.loadFile(this.files[0])">
      </label>
      <button class="btn-secondary" onclick="UI.closeModal('storageModal')">${t('Close')}</button>`;

    if (keys.length === 0) {
      body.innerHTML = `<div class="empty-state-sm">${t('No saved organizations')}</div>`;
      footer.innerHTML = footerHtml;
    } else {
      body.innerHTML = '<div class="storage-list">' + keys.map(k => {
        const item = list[k];
        return `<div class="storage-item" onclick="StorageService.load('${k}'); UI.closeModal('storageModal')">
          <div class="storage-item-info">
            <div class="storage-item-name">${Utils.escapeHtml(item.name)}</div>
            <div class="storage-item-meta">${t('{n} nodes', { n: item.nodeCount || '?' })} · ${Utils.formatDate(item.savedAt)}</div>
          </div>
          <div class="storage-item-actions">
            <button class="btn-icon" onclick="event.stopPropagation(); StorageService.deleteSave('${k}'); StorageService.showLoadModal()" title="${t('Delete')}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`;
      }).join('') + '</div>';
      footer.innerHTML = footerHtml;
    }
    UI.openModal('storageModal');
  },

  // Open a project file previously downloaded from this app (Export JSON / Download to computer)
  loadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => UI.toast(t('Failed to parse file: {e}', { e: file.name }), 'error');
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.nodes)) throw new Error(t('Not an OrgChart Pro file'));
        const check = Utils.validateNodes(data.nodes);
        if (!check.valid) { UI.toast(check.errors[0], 'error'); return; }
        this.pushUndo();
        DataService.setData({
          organization: data.organization && typeof data.organization === 'object' ? data.organization : {},
          nodes: data.nodes,
          ...(data.layout && typeof data.layout === 'object' ? { layout: data.layout } : {}),
        });
        OrgChart.resetView();
        UI.closeDrawer();
        UI.closeModal('storageModal');
        this.autoSave();
        App.refresh();
        UI.toast(t('Organization loaded'), 'success');
      } catch (e) {
        UI.toast(t('Failed to parse file: {e}', { e: e.message }), 'error');
      }
    };
    reader.readAsText(file);
  },
};
