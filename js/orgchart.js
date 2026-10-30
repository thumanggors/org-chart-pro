/* ===== OrgChart Pro — Chart Engine (D3.js) ===== */

const OrgChart = {
  svg: null,
  g: null,
  zoom: null,
  tree: null,
  root: null,
  selectedId: null,
  collapsedIds: new Set(),
  layout: 'vertical', // vertical | horizontal
  _nodeWidth: 200,
  _nodeHeight: 90,
  _dragStartId: null,
  _justSelected: false,
  _filterDept: '',
  _filterType: '',

  init() {
    const container = document.getElementById('chartContainer');
    const svgEl = document.getElementById('orgchartSvg');
    this.svg = d3.select(svgEl);
    this.svg.selectAll('*').remove();

    this.g = this.svg.append('g').attr('class', 'chart-root');

    this.zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
        document.getElementById('zoomLevel').textContent = Math.round(event.transform.k * 100) + '%';
      });

    this.svg.call(this.zoom);
    this.svg.on('dblclick.zoom', null);

    // Auto-collapse below company+board+president on first render
    if (this.collapsedIds.size === 0 && DataService.getNodes().length > 20) {
      DataService.getNodes().forEach(n => {
        if (n.type !== 'company' && n.type !== 'board' && DataService.getChildren(n.id).length > 0) {
          this.collapsedIds.add(n.id);
        }
      });
    }

    this.render();
  },

  render() {
    if (!this.g) return;
    this.g.selectAll('*').remove();

    const nodes = DataService.getNodes();
    document.getElementById('chartEmpty').classList.toggle('hidden', nodes.length > 0);
    if (nodes.length === 0) return;

    // Department filter = that department's own structure only (its top nodes become roots)
    let filteredNodes = this._filterDept ? nodes.filter(n => n.department === this._filterDept) : [...nodes];
    document.getElementById('btnBackDept').classList.toggle('hidden', !this._filterDept);
    // Level filter: keep matching nodes plus their ancestors (within the department, if one is set)
    if (this._filterType) {
      const matchIds = new Set(filteredNodes.filter(n => n.type === this._filterType).map(n => n.id));
      const ancestorIds = new Set(matchIds);
      const nodeMap = {};
      filteredNodes.forEach(n => { nodeMap[n.id] = n; });
      matchIds.forEach(id => {
        let cur = nodeMap[id];
        while (cur && cur.parentId) {
          ancestorIds.add(cur.parentId);
          cur = nodeMap[cur.parentId];
        }
      });
      filteredNodes = filteredNodes.filter(n => ancestorIds.has(n.id));
    }
    if (filteredNodes.length === 0) {
      this.g.append('text')
        .attr('x', 200).attr('y', 100)
        .attr('class', 'node-title-text')
        .attr('text-anchor', 'middle')
        .text(t('No results match the selected filters'));
      return;
    }

    // Several top nodes in a department hang under one card named after the department
    const treeData = Utils.buildTree(filteredNodes, this._filterDept
      ? { name: this._filterDept, type: 'department', department: this._filterDept }
      : undefined);
    this.root = d3.hierarchy(treeData, d => {
      if (this.collapsedIds.has(d.id)) return null;
      return d.children && d.children.length > 0 ? d.children : null;
    });

    const isHorizontal = this.layout === 'horizontal';
    const nw = this._nodeWidth;
    const nh = this._nodeHeight;
    const sepX = isHorizontal ? nh + 40 : nw + 30;
    const sepY = isHorizontal ? nw + 60 : nh + 50;

    this.tree = d3.tree()
      .nodeSize([sepX, sepY])
      .separation((a, b) => a.parent === b.parent ? 1 : 1.2);

    this.tree(this.root);
    this.root.each(d => { d._base = this._pos(d); }); // auto position, before manual shifts
    this._applyShifts();

    // Draw links: right-angle (elbow) connectors, edge of parent card → edge of child card.
    // Siblings share the same bus line, so the hierarchy reads like a classic org chart.
    // Paths are filled in by _updateLinks(), which also runs while a card or line is dragged.
    this.g.append('g').attr('class', 'org-links')
      .selectAll('.org-link')
      .data(this.root.links())
      .join('path')
      .attr('class', 'org-link');

    // Wide invisible hit area over each bus line so it can be dragged
    this.g.append('g').attr('class', 'org-bus')
      .selectAll('.bus-handle')
      .data(this.root.descendants().filter(d => d.children))
      .join('path')
      .attr('class', 'bus-handle')
      .style('cursor', isHorizontal ? 'ew-resize' : 'ns-resize')
      .on('click', event => event.stopPropagation())
      .call(this._setupBusDrag());

    this._updateLinks();
    if (this.selectedId) this._highlightPath(this.selectedId);

    // Draw nodes
    const nodeGroups = this.g.selectAll('.org-node')
      .data(this.root.descendants())
      .join('g')
      .attr('class', d => {
        let cls = 'org-node';
        if (d.data.id === this.selectedId) cls += ' selected';
        return cls;
      })
      .attr('transform', d => this._xform(d))
      .call(this._setupDrag());

    // Node accent bar (top)
    nodeGroups.append('rect')
      .attr('class', 'node-accent-bar')
      .attr('width', nw)
      .attr('height', 6)
      .attr('fill', d => Utils.getNodeColor(d.data));

    // Node background
    nodeGroups.append('rect')
      .attr('class', 'node-bg')
      .attr('width', nw)
      .attr('height', nh)
      .attr('y', 0);

    // Clip the accent bar to match rounded top
    nodeGroups.select('.node-accent-bar').attr('rx', 10).attr('ry', 10);
    // Overlay a rect to mask bottom corners of accent bar
    nodeGroups.append('rect')
      .attr('width', nw)
      .attr('height', 4)
      .attr('y', 4)
      .attr('fill', d => Utils.getNodeColor(d.data));

    // Type badge
    nodeGroups.append('rect')
      .attr('x', 8)
      .attr('y', 12)
      .attr('width', d => Utils.getTypeLabel(d.data.type).length * 6 + 12)
      .attr('height', 16)
      .attr('rx', 4)
      .attr('fill', d => Utils.getNodeColor(d.data))
      .attr('opacity', 0.15);

    nodeGroups.append('text')
      .attr('class', 'node-type-badge')
      .attr('x', 14)
      .attr('y', 23)
      .attr('fill', d => Utils.getNodeColor(d.data))
      .style('font-size', '9px')
      .style('font-weight', '600')
      .text(d => Utils.getTypeLabel(d.data.type));

    // Name
    nodeGroups.append('text')
      .attr('class', 'node-name')
      .attr('x', nw / 2)
      .attr('y', 44)
      .attr('text-anchor', 'middle')
      .text(d => {
        const name = d.data.name || '';
        return name.length > 22 ? name.slice(0, 20) + '…' : name;
      });

    // Title
    nodeGroups.append('text')
      .attr('class', 'node-title-text')
      .attr('x', nw / 2)
      .attr('y', 58)
      .attr('text-anchor', 'middle')
      .text(d => {
        const title = d.data.title || '';
        return title.length > 26 ? title.slice(0, 24) + '…' : title;
      });

    // Department / meta
    nodeGroups.append('text')
      .attr('class', 'node-dept-text')
      .attr('x', nw / 2)
      .attr('y', 72)
      .attr('text-anchor', 'middle')
      .text(d => {
        const childCount = DataService.getChildren(d.data.id).length;
        const dept = d.data.department || '';
        if (childCount > 0) {
          return (dept ? dept.slice(0, 15) + ' · ' : '') + t('{n} reports', { n: childCount });
        }
        return dept.length > 28 ? dept.slice(0, 26) + '…' : dept;
      });

    // Status indicator dot
    nodeGroups.append('circle')
      .attr('cx', nw - 14)
      .attr('cy', 14)
      .attr('r', 4)
      .attr('fill', d => d.data.status === 'active' ? 'var(--success)' : 'var(--text-tertiary)');

    // Expand/Collapse toggle
    nodeGroups.each((d, i, nodes) => {
      const allChildren = DataService.getChildren(d.data.id);
      if (allChildren.length === 0) return;
      const hasCollapsed = this.collapsedIds.has(d.data.id);
      const toggle = d3.select(nodes[i]).append('g')
        .attr('class', 'node-toggle')
        .attr('transform', isHorizontal
          ? `translate(${nw}, ${nh/2})`
          : `translate(${nw/2}, ${nh})`)
        .on('click', (event) => {
          event.stopPropagation();
          this._justSelected = true;
          this.toggleCollapse(d.data.id);
        });

      toggle.append('circle')
        .attr('r', 12)
        .attr('fill', 'var(--bg-primary)')
        .attr('stroke', 'var(--border)');

      toggle.append('text')
        .text(hasCollapsed ? `+${allChildren.length}` : '−')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .style('font-size', hasCollapsed ? '9px' : '14px');
    });

    // Click background to deselect
    this.svg.on('click', () => {
      if (this._justSelected) { this._justSelected = false; return; }
      this.selectedId = null;
      UI.closeDrawer();
      this.render();
    });
  },

  selectNode(id) {
    this.selectedId = id;
    const node = DataService.getNode(id);
    if (node) UI.openNodeDrawer(node);
    this.render(); // render() re-applies the path highlight for selectedId
  },

  _highlightPath(id) {
    // Highlight links from root to selected node
    const ancestors = new Set();
    let cur = DataService.getNode(id);
    while (cur) {
      ancestors.add(cur.id);
      cur = cur.parentId ? DataService.getNode(cur.parentId) : null;
    }
    this.g.selectAll('.org-link')
      .classed('highlighted', d => ancestors.has(d.source.data.id) && ancestors.has(d.target.data.id))
      .filter('.highlighted').raise(); // keep it above sibling links sharing the same bus
  },

  toggleCollapse(id) {
    if (this.collapsedIds.has(id)) {
      this.collapsedIds.delete(id);
    } else {
      this.collapsedIds.add(id);
    }
    this.render();
  },

  expandAll() {
    this.collapsedIds.clear();
    this.render();
  },

  collapseAll() {
    const nodes = DataService.getNodes();
    nodes.forEach(n => {
      if (DataService.getChildren(n.id).length > 0) {
        if (n.type !== 'company') this.collapsedIds.add(n.id);
      }
    });
    this.render();
  },

  zoomIn() {
    this.svg.transition().duration(300).call(this.zoom.scaleBy, 1.3);
  },

  zoomOut() {
    this.svg.transition().duration(300).call(this.zoom.scaleBy, 0.7);
  },

  fitToScreen() {
    const container = document.getElementById('chartContainer');
    const bounds = this.g.node().getBBox();
    if (bounds.width === 0) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return; // chart view hidden (user switched view before a delayed fit ran)
    const scale = Math.min(w / (bounds.width + 100), h / (bounds.height + 100), 1.5);
    const tx = w / 2 - (bounds.x + bounds.width / 2) * scale;
    const ty = h / 2 - (bounds.y + bounds.height / 2) * scale;

    this.svg.transition().duration(500)
      .call(this.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  },

  centerOnNode(id) {
    const container = document.getElementById('chartContainer');
    const nodeEl = this.root?.descendants().find(d => d.data.id === id);
    if (!nodeEl) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const isH = this.layout === 'horizontal';
    const nx = isH ? nodeEl.y : nodeEl.x;
    const ny = isH ? nodeEl.x : nodeEl.y;
    const scale = 1;
    const tx = w / 2 - nx * scale;
    const ty = h / 2 - ny * scale;

    this.svg.transition().duration(500)
      .call(this.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  },

  toggleLayout() {
    this.layout = this.layout === 'vertical' ? 'horizontal' : 'vertical';
    this.render();
    setTimeout(() => this.fitToScreen(), 100);
  },

  toggleFullscreen() {
    const container = document.getElementById('chartContainer');
    container.classList.toggle('fullscreen');
  },

  // Open the chart showing only one department's structure, fully expanded ('' = whole organization)
  showDepartment(dept) {
    this._filterDept = dept;
    this._filterType = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterDepartment').value = dept;
    App.switchView('orgchart'); // init() may auto-collapse large charts, so expand afterwards
    if (dept) DataService.getNodes().forEach(n => { if (n.department === dept) this.collapsedIds.delete(n.id); });
    this.render();
  },

  applyFilters() {
    this._filterDept = document.getElementById('filterDepartment').value;
    this._filterType = document.getElementById('filterType').value;
    this.render();
    setTimeout(() => this.fitToScreen(), 100);
  },

  // ----- Manual layout -----
  // Cards and connector lines can be dragged. The shifts are kept in the data (so undo, Save and
  // JSON export carry them), separately for the vertical and horizontal layout:
  //   data.layout[v|h].nodes[id] = [dx, dy]  card shift from its auto position (children follow)
  //   data.layout[v|h].bus[id]   = n         shift of the shared connector line under node `id`
  _lay(write) {
    const data = DataService.getData();
    const k = this.layout === 'horizontal' ? 'h' : 'v';
    if (write) {
      data.layout = data.layout || {};
      data.layout[k] = data.layout[k] || {};
      data.layout[k].nodes = data.layout[k].nodes || {};
      data.layout[k].bus = data.layout[k].bus || {};
    }
    return (data.layout && data.layout[k]) || {};
  },

  // Card centre in screen space (d3.tree's x/y swap in the horizontal layout)
  _pos(d) {
    return this.layout === 'horizontal' ? { x: d.y, y: d.x } : { x: d.x, y: d.y };
  },

  _place(d, x, y) {
    if (this.layout === 'horizontal') { d.y = x; d.x = y; } else { d.x = x; d.y = y; }
  },

  _xform(d) {
    const p = this._pos(d);
    return `translate(${p.x - this._nodeWidth / 2},${p.y - this._nodeHeight / 2})`;
  },

  // auto position + own shift + the shifts of all ancestors, so moving a card moves its branch
  _applyShifts() {
    const shifts = this._lay().nodes || {};
    this.root.eachBefore(d => {
      const o = shifts[d.data.id] || [];
      const up = d.parent ? d.parent._shift : [0, 0];
      d._own = [+o[0] || 0, +o[1] || 0];
      d._shift = [up[0] + d._own[0], up[1] + d._own[1]];
      this._place(d, d._base.x + d._shift[0], d._base.y + d._shift[1]);
    });
  },

  // (Re)compute every connector path and bus hit area from the current card positions
  _updateLinks() {
    const isH = this.layout === 'horizontal';
    const nw = this._nodeWidth, nh = this._nodeHeight;
    const shifts = this._lay().bus || {};
    const bus = new Map();
    this.root.each(p => {
      if (!p.children) return;
      const s = this._pos(p), ks = p.children.map(c => this._pos(c));
      const shift = +shifts[p.data.id] || 0;
      // the line sits halfway between the parent and its nearest child, plus the manual shift
      bus.set(p.data.id, isH
        ? { m: (s.x + nw / 2 + Math.min(...ks.map(k => k.x)) - nw / 2) / 2 + shift,
            lo: Math.min(s.y, ...ks.map(k => k.y)), hi: Math.max(s.y, ...ks.map(k => k.y)) }
        : { m: (s.y + nh / 2 + Math.min(...ks.map(k => k.y)) - nh / 2) / 2 + shift,
            lo: Math.min(s.x, ...ks.map(k => k.x)), hi: Math.max(s.x, ...ks.map(k => k.x)) });
    });
    this.g.selectAll('.org-link').attr('d', l => {
      const s = this._pos(l.source), tg = this._pos(l.target), b = bus.get(l.source.data.id);
      return isH
        ? `M${s.x + nw / 2},${s.y}H${b.m}V${tg.y}H${tg.x - nw / 2}`
        : `M${s.x},${s.y + nh / 2}V${b.m}H${tg.x}V${tg.y - nh / 2}`;
    });
    this.g.selectAll('.bus-handle').attr('d', p => {
      const b = bus.get(p.data.id);
      return isH ? `M${b.m},${b.lo}V${b.hi}` : `M${b.lo},${b.m}H${b.hi}`;
    });
  },

  _setupBusDrag() {
    const self = this;
    let moved = false;
    return d3.drag()
      .on('start', () => { moved = false; })
      .on('drag', function(event, p) {
        if (!moved) { moved = true; StorageService.pushUndo(); }
        const bus = self._lay(true).bus;
        bus[p.data.id] = (+bus[p.data.id] || 0) + (self.layout === 'horizontal' ? event.dx : event.dy);
        self._updateLinks();
      })
      .on('end', () => { if (moved) StorageService.autoSave(); });
  },

  // Back to the automatic layout for the current orientation (undoable)
  resetLayout() {
    const data = DataService.getData();
    const k = this.layout === 'horizontal' ? 'h' : 'v';
    if (!data.layout || !data.layout[k]) return;
    StorageService.pushUndo();
    delete data.layout[k];
    StorageService.autoSave();
    this.render();
    setTimeout(() => this.fitToScreen(), 100);
    UI.toast(t('Layout reset'), 'success');
  },

  // Drag a card to move it (its branch and lines follow). Shift+drag onto another card changes its parent.
  _setupDrag() {
    const self = this;
    let dragMoved = false;
    let reparent = false;
    let startX, startY;
    return d3.drag()
      .filter((event, d) => d.data.id !== '__root__') // the grouping card is not a real node
      .subject((event, d) => self._pos(d)) // event.x/y = card centre in screen space
      .on('start', function(event, d) {
        dragMoved = false;
        reparent = !!event.sourceEvent.shiftKey;
        startX = event.x;
        startY = event.y;
        self._dragStartId = d.data.id;
      })
      .on('drag', function(event, d) {
        if (!dragMoved && Math.abs(event.x - startX) <= 5 && Math.abs(event.y - startY) <= 5) return;
        if (reparent) {
          dragMoved = true;
          d3.select(this).classed('dragging', true);
          d3.select(this).attr('transform',
            `translate(${event.x - self._nodeWidth/2}, ${event.y - self._nodeHeight/2})`);
          return;
        }
        if (!dragMoved) { dragMoved = true; StorageService.pushUndo(); }
        const up = d.parent ? d.parent._shift : [0, 0];
        self._lay(true).nodes[d.data.id] = [event.x - d._base.x - up[0], event.y - d._base.y - up[1]];
        self._applyShifts();
        self.g.selectAll('.org-node').attr('transform', n => self._xform(n));
        self._updateLinks();
      })
      .on('end', function(event, d) {
        d3.select(this).classed('dragging', false);
        if (!dragMoved) {
          // Click — select node
          self._justSelected = true;
          self.selectNode(d.data.id);
          return;
        }
        if (!reparent) {
          const o = self._lay(true).nodes[d.data.id];
          if (Math.abs(o[0]) < 1 && Math.abs(o[1]) < 1) delete self._lay(true).nodes[d.data.id];
          StorageService.autoSave();
          return;
        }
        // Shift+drag — find drop target
        const dropTarget = self._findDropTarget(event.x, event.y, d.data.id);
        if (dropTarget && dropTarget !== d.data.id) {
          const srcNode = DataService.getNode(d.data.id);
          const tgtNode = DataService.getNode(dropTarget);
          UI.confirm(
            t('Move Organization Unit?'),
            t('Move "{a}" under "{b}"?', { a: srcNode.name, b: tgtNode.name }),
            () => {
              StorageService.pushUndo();
              DataService.moveNode(d.data.id, dropTarget);
              // its old shift was relative to the old parent
              ['v', 'h'].forEach(k => {
                const l = DataService.getData().layout;
                if (l && l[k] && l[k].nodes) delete l[k].nodes[d.data.id];
              });
              self.render();
              UI.toast(t('Node moved successfully'), 'success');
            }
          );
        }
        self.render();
      });
  },

  _findDropTarget(x, y, excludeId) {
    let closest = null;
    let minDist = Infinity;
    if (!this.root) return null;

    this.root.descendants().forEach(d => {
      if (d.data.id === excludeId || d.data.id === '__root__') return;
      const isH = this.layout === 'horizontal';
      const nx = isH ? d.y : d.x;
      const ny = isH ? d.x : d.y;
      const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
      if (dist < minDist && dist < 100) {
        minDist = dist;
        closest = d.data.id;
      }
    });
    return closest;
  },

  populateFilters() {
    const depts = Utils.getDepartments(DataService.getNodes());
    const sel = document.getElementById('filterDepartment');
    const empSel = document.getElementById('empFilterDept');
    sel.innerHTML = `<option value="">${t('All Departments')}</option>` +
      depts.map(d => `<option value="${Utils.escapeHtml(d)}">${Utils.escapeHtml(d)}</option>`).join('');
    // rebuilding the options resets the selection; keep it in sync with the active filter
    if (!depts.includes(this._filterDept)) this._filterDept = '';
    sel.value = this._filterDept;
    if (empSel) {
      empSel.innerHTML = sel.innerHTML;
    }
  },
};
