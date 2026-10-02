/* ===== OrgChart Pro — UI Manager ===== */

const UI = {
  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    };
    toast.innerHTML = (icons[type] || icons.info) + `<span>${Utils.escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 3000);
  },

  confirm(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const btn = document.getElementById('confirmAction');
    btn.onclick = () => { this.closeModal('confirmDialog'); onConfirm(); };
    this.openModal('confirmDialog');
  },

  openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
  },

  openNodeDrawer(node) {
    const drawer = document.getElementById('detailDrawer');
    const body = document.getElementById('drawerBody');
    const parent = DataService.getParent(node.id);
    const children = DataService.getChildren(node.id);
    const initials = Utils.getInitials(node.name);
    const color = Utils.getNodeColor(node);

    body.innerHTML = `
      <div class="drawer-avatar" style="background:${color}20;color:${color}">${initials}</div>
      <div class="drawer-name">${Utils.escapeHtml(node.name)}</div>
      <div class="drawer-position">${Utils.escapeHtml(node.title || '')}</div>
      <div class="drawer-dept">${Utils.escapeHtml(node.department || '')}${node.division ? ' · ' + Utils.escapeHtml(node.division) : ''}</div>

      <div class="drawer-section">
        <div class="drawer-section-title">${t('Details')}</div>
        ${node.employeeCode ? `<div class="drawer-field"><div class="drawer-field-label">${t('Employee ID')}</div><div class="drawer-field-value">${Utils.escapeHtml(node.employeeCode)}</div></div>` : ''}
        ${node.email ? `<div class="drawer-field"><div class="drawer-field-label">${t('Email')}</div><div class="drawer-field-value">${Utils.escapeHtml(node.email)}</div></div>` : ''}
        ${node.phone ? `<div class="drawer-field"><div class="drawer-field-label">${t('Phone')}</div><div class="drawer-field-value">${Utils.escapeHtml(node.phone)}</div></div>` : ''}
        <div class="drawer-field">
          <div class="drawer-field-label">${t('Type')}</div>
          <div class="drawer-field-value">${Utils.getTypeLabel(node.type)}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">${t('Status')}</div>
          <div class="drawer-field-value"><span class="status-badge status-${node.status || 'active'}">${UI.statusLabel(node.status)}</span></div>
        </div>
        ${node.description ? `<div class="drawer-field"><div class="drawer-field-label">${t('Description')}</div><div class="drawer-field-value">${Utils.escapeHtml(node.description)}</div></div>` : ''}
      </div>

      ${parent ? `
      <div class="drawer-section">
        <div class="drawer-section-title">${t('Reports To')}</div>
        <div class="drawer-reports">
          <div class="drawer-report-item" onclick="OrgChart.selectNode('${parent.id}')">
            <div class="drawer-report-avatar">${Utils.getInitials(parent.name)}</div>
            <div>
              <div class="drawer-report-name">${Utils.escapeHtml(parent.name)}</div>
              <div class="drawer-report-title">${Utils.escapeHtml(parent.title || Utils.getTypeLabel(parent.type))}</div>
            </div>
          </div>
        </div>
      </div>` : ''}

      ${children.length > 0 ? `
      <div class="drawer-section">
        <div class="drawer-section-title">${t('Direct Reports ({n})', { n: children.length })}</div>
        <div class="drawer-reports">
          ${children.map(c => `
            <div class="drawer-report-item" onclick="OrgChart.selectNode('${c.id}')">
              <div class="drawer-report-avatar">${Utils.getInitials(c.name)}</div>
              <div>
                <div class="drawer-report-name">${Utils.escapeHtml(c.name)}</div>
                <div class="drawer-report-title">${Utils.escapeHtml(c.title || Utils.getTypeLabel(c.type))}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <div class="drawer-actions">
        <button class="drawer-action-btn" onclick="App.editNode('${node.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          ${t('Edit')}
        </button>
        <button class="drawer-action-btn" onclick="App.addNode(null, '${node.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          ${t('Add Child')}
        </button>
        <button class="drawer-action-btn" onclick="App.duplicateNode('${node.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          ${t('Duplicate')}
        </button>
        <button class="drawer-action-btn" onclick="App.addNode(null, '${node.parentId || ''}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20 21 3"/></svg>
          ${t('Add Sibling')}
        </button>
        <button class="drawer-action-btn danger" onclick="App.deleteNode('${node.id}')" style="grid-column: span 2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          ${t('Delete')}
        </button>
      </div>
    `;

    drawer.classList.add('open');
  },

  closeDrawer() {
    document.getElementById('detailDrawer').classList.remove('open');
  },

  renderDashboard() {
    const stats = DataService.getStats();
    const empty = `<div class="empty-state-sm">${t('No data yet')}</div>`;

    // KPI cards
    const kpiData = [
      { label: t('Total Nodes'), value: stats.total, icon: '📊', color: 'var(--accent)' },
      { label: t('Employees'), value: stats.employees, icon: '👥', color: 'var(--color-hr)' },
      { label: t('Departments'), value: stats.departments, icon: '🏢', color: 'var(--color-finance)' },
      { label: t('Divisions'), value: stats.divisions, icon: '📁', color: 'var(--color-it)' },
      { label: t('Active'), value: stats.active, icon: '✅', color: 'var(--success)' },
    ];

    document.getElementById('kpiGrid').innerHTML = kpiData.map(k => `
      <div class="kpi-card">
        <div class="kpi-icon" style="background:${k.color}15;color:${k.color};font-size:20px">${k.icon}</div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value">${k.value}</div>
      </div>
    `).join('');

    // Headcount chart
    const headcount = DataService.getHeadcountByDept();
    const maxCount = Math.max(...headcount.map(h => h[1]), 1);
    document.getElementById('chartHeadcount').innerHTML = `<div class="bar-chart">${headcount.slice(0, 8).map(([dept, count]) => {
      const pct = (count / maxCount * 100).toFixed(0);
      const color = Utils.getNodeColor({ department: dept, type: 'department' });
      return `<div class="bar-row">
        <div class="bar-label">${Utils.escapeHtml(dept)}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
          <div class="bar-value">${count}</div>
        </div>
      </div>`;
    }).join('') || empty}</div>`;

    // Department distribution (same data, different visual)
    document.getElementById('chartDeptDistribution').innerHTML = `<div class="bar-chart">${headcount.map(([dept, count]) => {
      const pct = (count / stats.total * 100).toFixed(1);
      const color = Utils.getNodeColor({ department: dept, type: 'department' });
      return `<div class="bar-row">
        <div class="bar-label">${Utils.escapeHtml(dept)}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
          <div class="bar-value">${pct}%</div>
        </div>
      </div>`;
    }).join('') || empty}</div>`;

    // Management layers
    const layers = DataService.getManagementLayers();
    document.getElementById('chartManagement').innerHTML = `<div class="layer-list">${layers.map(l => `
      <div class="layer-item">
        <span class="layer-name">${l.label}</span>
        <span class="layer-count">${l.count}</span>
      </div>
    `).join('') || empty}</div>`;

    // Recent changes
    const changes = DataService.getChangeLog();
    const el = document.getElementById('recentChanges');
    if (changes.length === 0) {
      el.innerHTML = `<div class="empty-state-sm">${t('No recent changes')}</div>`;
    } else {
      el.innerHTML = '<div class="layer-list">' + changes.slice(-5).reverse().map(c => `
        <div class="layer-item">
          <span class="layer-name" style="font-size:12px">${t(c.action)}: ${Utils.escapeHtml(c.data.name || c.data.id)}</span>
          <span style="font-size:11px;color:var(--text-tertiary)">${Utils.formatDate(c.time)}</span>
        </div>
      `).join('') + '</div>';
    }
  },

  renderEmployeeTable() {
    const nodes = DataService.getNodes();
    const empTypes = ['employee', 'manager', 'supervisor'];
    let employees = nodes.filter(n => empTypes.includes(n.type));

    const deptFilter = document.getElementById('empFilterDept')?.value;
    const statusFilter = document.getElementById('empFilterStatus')?.value;
    if (deptFilter) employees = employees.filter(e => e.department === deptFilter);
    if (statusFilter) employees = employees.filter(e => e.status === statusFilter);

    document.getElementById('employeeCount').textContent = t('{n} employees', { n: employees.length });

    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = employees.map(e => `
      <tr>
        <td>
          <div class="emp-name">${Utils.escapeHtml(e.name)}</div>
          <div class="emp-id">${Utils.escapeHtml(e.employeeCode || e.id)}</div>
        </td>
        <td>${Utils.escapeHtml(e.title || '')}</td>
        <td>${Utils.escapeHtml(e.department || '')}</td>
        <td>${Utils.escapeHtml(e.division || '')}</td>
        <td><span class="status-badge status-${e.status || 'active'}">${UI.statusLabel(e.status)}</span></td>
        <td>
          <button class="btn-ghost" onclick="App.editNode('${e.id}')">${t('Edit')}</button>
          <button class="btn-ghost" onclick="OrgChart.showDepartment(''); requestAnimationFrame(()=>setTimeout(()=>OrgChart.selectNode('${e.id}'),250))">${t('View')}</button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="6"><div class="empty-state-sm">${t('No employees yet')}</div></td></tr>`;
  },

  statusLabel(status) {
    return t(status === 'inactive' ? 'Inactive' : 'Active');
  },

  // One card per department; clicking opens that department's structure chart
  renderDepartments() {
    const nodes = DataService.getNodes();
    const grid = document.getElementById('deptGrid');
    const cards = Utils.getDepartments(nodes).map(dept => {
      const members = nodes.filter(n => n.department === dept);
      const ids = new Set(members.map(n => n.id));
      const heads = members.filter(n => !ids.has(n.parentId)); // top of the department
      const color = Utils.getNodeColor({ department: dept, type: 'department' });
      return `<button class="kpi-card dept-card" style="border-top-color:${color}" data-dept="${Utils.escapeHtml(dept)}" onclick="OrgChart.showDepartment(this.dataset.dept)">
        <div class="dept-name">${Utils.escapeHtml(dept)}</div>
        <div class="kpi-value">${t('{n} people', { n: members.length })}</div>
        ${heads.length === 1 ? `<div class="kpi-sub">${Utils.escapeHtml(t('Head: {name}', { name: heads[0].name }))}</div>` : ''}
      </button>`;
    });
    grid.innerHTML = cards.join('') ||
      `<div class="empty-state-sm">${t('No departments yet. Fill in the Department field on nodes.')}</div>`;
  },

  filterEmployees() {
    this.renderEmployeeTable();
  },

  populateNodeForm(node, parentId) {
    document.getElementById('nodeModalTitle').textContent = t(node ? 'Edit Node' : 'Add Organization Node');
    document.getElementById('nodeId').value = node ? node.id : '';
    document.getElementById('nodeType').value = node ? node.type : 'employee';
    document.getElementById('nodeName').value = node ? node.name : '';
    document.getElementById('nodeTitle').value = node ? (node.title || '') : '';
    document.getElementById('nodeDepartment').value = node ? (node.department || '') : '';
    document.getElementById('nodeDivision').value = node ? (node.division || '') : '';
    document.getElementById('nodeEmpCode').value = node ? (node.employeeCode || '') : '';
    document.getElementById('nodeEmail').value = node ? (node.email || '') : '';
    document.getElementById('nodePhone').value = node ? (node.phone || '') : '';
    document.getElementById('nodeDescription').value = node ? (node.description || '') : '';
    document.getElementById('nodeStatus').value = node ? (node.status || 'active') : 'active';
    document.getElementById('nodeColor').value = node ? (node.color || '#2563eb') : '#2563eb';

    // Populate parent select
    const parentSelect = document.getElementById('nodeParent');
    const nodes = DataService.getNodes();
    parentSelect.innerHTML = `<option value="">${t('— No Parent (Root) —')}</option>` +
      nodes.filter(n => !node || n.id !== node.id).map(n =>
        `<option value="${n.id}" ${(node ? node.parentId : parentId) === n.id ? 'selected' : ''}>${Utils.escapeHtml(n.name)} (${Utils.getTypeLabel(n.type)})</option>`
      ).join('');
  },
};
