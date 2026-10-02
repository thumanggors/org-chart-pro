/* ===== OrgChart Pro — Utilities ===== */

const Utils = {
  generateId() {
    return 'N' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },

  debounce(fn, ms) {
    let t;
    return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  formatDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString(I18n.lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  getNodeColor(node) {
    if (node.color && node.color !== '#2563eb') return node.color;
    const dept = (node.department || '').toLowerCase();
    if (dept.includes('finance') || dept.includes('accounting')) return '#2563eb';
    if (dept.includes('human') || dept.includes('hr')) return '#7c3aed';
    if (dept.includes('information') || dept.includes('it') || dept.includes('tech')) return '#0891b2';
    if (dept.includes('operation') || dept.includes('produc')) return '#ea580c';
    if (dept.includes('sales')) return '#16a34a';
    if (dept.includes('marketing')) return '#db2777';
    if (dept.includes('legal') || dept.includes('compliance')) return '#475569';
    const typeColors = {
      company: '#1e3a5f', board: '#374151', director: '#1e40af',
      department: '#2563eb', division: '#3b82f6',
    };
    return typeColors[node.type] || '#2563eb';
  },

  getTypeLabel(type) {
    const labels = {
      company: 'Company', board: 'Board', director: 'Director',
      department: 'Department', division: 'Division', subdivision: 'Sub Division',
      manager: 'Manager', supervisor: 'Supervisor', employee: 'Employee',
    };
    return labels[type] ? t(labels[type]) : type;
  },

  buildTree(nodes, virtualRoot) {
    const map = {};
    const roots = [];
    nodes.forEach(n => { map[n.id] = { ...n, children: [] }; });
    nodes.forEach(n => {
      if (n.parentId && map[n.parentId]) {
        map[n.parentId].children.push(map[n.id]);
      } else {
        // no parent, or parent missing (e.g. bad import): show as root instead of dropping it
        roots.push(map[n.id]);
      }
    });
    return roots.length === 1 ? roots[0] : { id: '__root__', name: t('Root'), type: 'company', ...virtualRoot, children: roots };
  },

  flattenTree(node, arr = []) {
    arr.push(node);
    if (node.children) node.children.forEach(c => Utils.flattenTree(c, arr));
    return arr;
  },

  countDescendants(node, nodes) {
    let count = 0;
    const children = nodes.filter(n => n.parentId === node.id);
    children.forEach(c => { count += 1 + Utils.countDescendants(c, nodes); });
    return count;
  },

  countByType(nodes, type) {
    return nodes.filter(n => n.type === type).length;
  },

  detectCircular(nodes) {
    const errors = [];
    const map = {};
    nodes.forEach(n => { map[n.id] = n; });
    nodes.forEach(n => {
      const visited = new Set();
      let current = n;
      while (current && current.parentId) {
        if (visited.has(current.id)) {
          errors.push(t('Circular reference detected: {a} → {b}', { a: n.id, b: current.id }));
          break;
        }
        visited.add(current.id);
        current = map[current.parentId];
      }
    });
    return errors;
  },

  validateNodes(nodes) {
    const errors = [];
    const warnings = [];
    const ids = new Set();

    nodes.forEach((n, i) => {
      if (!n.id) errors.push(t('Row {n}: Missing ID', { n: i + 1 }));
      else if (ids.has(n.id)) errors.push(t('Duplicate ID: {id}', { id: n.id }));
      else ids.add(n.id);
      if (!n.name) errors.push(t('Row {n} ({id}): Missing name', { n: i + 1, id: n.id || '?' }));
    });

    nodes.forEach(n => {
      if (n.parentId && !ids.has(n.parentId)) {
        warnings.push(t('{id}: Parent "{p}" not found', { id: n.id, p: n.parentId }));
      }
    });

    const circular = Utils.detectCircular(nodes);
    errors.push(...circular);

    return { errors, warnings, valid: errors.length === 0 };
  },

  getDepartments(nodes) {
    const depts = new Set();
    nodes.forEach(n => { if (n.department) depts.add(n.department); });
    return [...depts].sort();
  },

  getDivisions(nodes) {
    const divs = new Set();
    nodes.forEach(n => { if (n.division) divs.add(n.division); });
    return [...divs].sort();
  },
};
