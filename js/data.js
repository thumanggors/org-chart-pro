/* ===== OrgChart Pro — Data Service ===== */

const DataService = {
  _data: { organization: {}, nodes: [] },
  _changeLog: [],

  getData() { return this._data; },
  getNodes() { return this._data.nodes; },
  getOrganization() { return this._data.organization; },

  setData(data) {
    this._data = data;
  },

  getNode(id) {
    return this._data.nodes.find(n => n.id === id);
  },

  getChildren(id) {
    return this._data.nodes.filter(n => n.parentId === id);
  },

  getParent(id) {
    const node = this.getNode(id);
    return node && node.parentId ? this.getNode(node.parentId) : null;
  },

  addNode(node) {
    if (!node.id) node.id = Utils.generateId();
    if (this._data.nodes.find(n => n.id === node.id)) return false;
    this._data.nodes.push(node);
    this._log('add', node);
    return true;
  },

  updateNode(id, updates) {
    const idx = this._data.nodes.findIndex(n => n.id === id);
    if (idx === -1) return false;
    Object.assign(this._data.nodes[idx], updates);
    this._log('update', this._data.nodes[idx]);
    return true;
  },

  deleteNode(id) {
    const descendants = this._getDescendantIds(id);
    const allIds = [id, ...descendants];
    this._data.nodes = this._data.nodes.filter(n => !allIds.includes(n.id));
    this._log('delete', { id });
    return true;
  },

  moveNode(id, newParentId) {
    if (id === newParentId) return false;
    const descendants = this._getDescendantIds(id);
    if (descendants.includes(newParentId)) return false;
    const node = this.getNode(id);
    if (!node) return false;
    node.parentId = newParentId;
    this._log('move', node);
    return true;
  },

  duplicateNode(id) {
    const node = this.getNode(id);
    if (!node) return null;
    const newNode = { ...node, id: Utils.generateId(), name: node.name + ' (' + t('Copy') + ')' };
    this._data.nodes.push(newNode);
    this._log('duplicate', newNode);
    return newNode;
  },

  _getDescendantIds(id) {
    const result = [];
    const children = this.getChildren(id);
    children.forEach(c => {
      result.push(c.id);
      result.push(...this._getDescendantIds(c.id));
    });
    return result;
  },

  _log(action, data) {
    this._changeLog.push({ action, data: { id: data.id, name: data.name }, time: new Date().toISOString() });
    if (this._changeLog.length > 50) this._changeLog.shift();
  },

  getChangeLog() { return this._changeLog; },

  getStats() {
    const nodes = this._data.nodes;
    return {
      total: nodes.length,
      employees: nodes.filter(n => ['employee','manager','supervisor'].includes(n.type)).length,
      departments: nodes.filter(n => n.type === 'department').length,
      divisions: nodes.filter(n => n.type === 'division' || n.type === 'subdivision').length,
      directors: nodes.filter(n => n.type === 'director').length,
      active: nodes.filter(n => n.status === 'active').length,
      inactive: nodes.filter(n => n.status === 'inactive').length,
    };
  },

  getHeadcountByDept() {
    const map = {};
    this._data.nodes.forEach(n => {
      if (n.department) {
        map[n.department] = (map[n.department] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  },

  getManagementLayers() {
    const types = ['director', 'department', 'division', 'manager', 'supervisor', 'employee'];
    return types.map(t => ({
      type: t,
      label: Utils.getTypeLabel(t),
      count: this._data.nodes.filter(n => n.type === t).length,
    })).filter(l => l.count > 0);
  },

  search(query) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return this._data.nodes.filter(n =>
      (n.name && n.name.toLowerCase().includes(q)) ||
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.department && n.department.toLowerCase().includes(q)) ||
      (n.division && n.division.toLowerCase().includes(q)) ||
      (n.employeeCode && n.employeeCode.toLowerCase().includes(q)) ||
      (n.email && n.email.toLowerCase().includes(q))
    ).slice(0, 20);
  },

  clearAll() {
    UI.confirm(t('Clear all data?'), t('This removes every node in the current organization. Undo with Ctrl+Z.'), () => {
      StorageService.pushUndo();
      this._data = { organization: {}, nodes: [] };
      this._changeLog = [];
      OrgChart.collapsedIds.clear();
      OrgChart.selectedId = null;
      UI.closeDrawer();
      StorageService.autoSave();
      App.refresh();
      UI.toast(t('All data cleared'), 'success');
    });
  },
};
