/* ===== OrgChart Pro — Export Service ===== */

const ExportService = {
  async exportPNG() {
    App.hideExportMenu();
    UI.toast(t('Generating {f}...', { f: 'PNG' }), 'info');
    try {
      // Expand all for full export
      const prevCollapsed = new Set(OrgChart.collapsedIds);
      OrgChart.collapsedIds.clear();
      OrgChart.render();
      OrgChart.fitToScreen();
      await new Promise(r => setTimeout(r, 500));

      const container = document.getElementById('chartContainer');
      const svg = document.getElementById('orgchartSvg');
      const bbox = OrgChart.g.node().getBBox();

      // Create a clone SVG for export
      const clone = svg.cloneNode(true);
      clone.setAttribute('width', bbox.width + 200);
      clone.setAttribute('height', bbox.height + 200);
      const gClone = clone.querySelector('.chart-root');
      gClone.setAttribute('transform', `translate(${-bbox.x + 100}, ${-bbox.y + 100})`);

      // Inline computed styles
      this._inlineStyles(clone);

      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob(blob => {
          this._download(blob, 'orgchart-pro.png');
          UI.toast(t('{f} exported', { f: 'PNG' }), 'success');
        });

        // Restore collapsed state after image captured
        OrgChart.collapsedIds = prevCollapsed;
        OrgChart.render();
      };
      img.src = url;
    } catch (e) {
      UI.toast(t('{f} export failed: {e}', { f: 'PNG', e: e.message }), 'error');
    }
  },

  exportSVG() {
    App.hideExportMenu();
    try {
      const svg = document.getElementById('orgchartSvg');
      const bbox = OrgChart.g.node().getBBox();
      const clone = svg.cloneNode(true);
      clone.setAttribute('width', bbox.width + 200);
      clone.setAttribute('height', bbox.height + 200);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const gClone = clone.querySelector('.chart-root');
      gClone.setAttribute('transform', `translate(${-bbox.x + 100}, ${-bbox.y + 100})`);

      this._inlineStyles(clone);

      const data = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([data], { type: 'image/svg+xml' });
      this._download(blob, 'orgchart-pro.svg');
      UI.toast(t('{f} exported', { f: 'SVG' }), 'success');
    } catch (e) {
      UI.toast(t('{f} export failed: {e}', { f: 'SVG', e: e.message }), 'error');
    }
  },

  async exportPDF() {
    App.hideExportMenu();
    UI.toast(t('Generating {f}...', { f: 'PDF' }), 'info');
    try {
      const prevCollapsed = new Set(OrgChart.collapsedIds);
      OrgChart.collapsedIds.clear();
      OrgChart.render();
      OrgChart.fitToScreen();
      await new Promise(r => setTimeout(r, 500));

      const svg = document.getElementById('orgchartSvg');
      const bbox = OrgChart.g.node().getBBox();
      const clone = svg.cloneNode(true);
      const w = bbox.width + 200;
      const h = bbox.height + 200;
      clone.setAttribute('width', w);
      clone.setAttribute('height', h);
      const gClone = clone.querySelector('.chart-root');
      gClone.setAttribute('transform', `translate(${-bbox.x + 100}, ${-bbox.y + 100})`);
      this._inlineStyles(clone);

      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w * 2;
        canvas.height = h * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const imgData = canvas.toDataURL('image/png');
        const orientation = w > h ? 'l' : 'p';
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF(orientation, 'pt', [w, h]);
        pdf.addImage(imgData, 'PNG', 0, 0, w, h);
        pdf.save('orgchart-pro.pdf');
        UI.toast(t('{f} exported', { f: 'PDF' }), 'success');

        // Restore collapsed state after image captured
        OrgChart.collapsedIds = prevCollapsed;
        OrgChart.render();
      };
      img.src = url;
    } catch (e) {
      UI.toast(t('{f} export failed: {e}', { f: 'PDF', e: e.message }), 'error');
    }
  },

  exportExcel() {
    App.hideExportMenu();
    try {
      const nodes = DataService.getNodes();
      const rows = nodes.map(n => ({
        ID: n.id,
        PARENT_ID: n.parentId || '',
        TYPE: n.type,
        NAME: n.name,
        TITLE: n.title || '',
        DEPARTMENT: n.department || '',
        DIVISION: n.division || '',
        EMPLOYEE_CODE: n.employeeCode || '',
        EMAIL: n.email || '',
        PHONE: n.phone || '',
        STATUS: n.status || 'active',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Organization');

      // Auto column widths
      const colWidths = Object.keys(rows[0] || {}).map(k => ({
        wch: Math.max(k.length, ...rows.map(r => String(r[k] || '').length)) + 2
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, 'orgchart-pro.xlsx');
      UI.toast(t('{f} exported', { f: 'Excel' }), 'success');
    } catch (e) {
      UI.toast(t('{f} export failed: {e}', { f: 'Excel', e: e.message }), 'error');
    }
  },

  exportJSON() {
    App.hideExportMenu();
    try {
      const data = DataService.getData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      this._download(blob, 'orgchart-pro.json');
      UI.toast(t('{f} exported', { f: 'JSON' }), 'success');
    } catch (e) {
      UI.toast(t('{f} export failed: {e}', { f: 'JSON', e: e.message }), 'error');
    }
  },

  _download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  _inlineStyles(svgEl) {
    // Inline key styles for export fidelity
    const theme = document.documentElement.getAttribute('data-theme');
    const isDark = theme === 'dark';

    svgEl.querySelectorAll('.node-bg').forEach(el => {
      el.style.fill = isDark ? '#1a2332' : '#ffffff';
      el.style.stroke = isDark ? '#293548' : '#e2e8f0';
    });
    svgEl.querySelectorAll('.node-name').forEach(el => {
      el.style.fill = isDark ? '#e2e8f0' : '#0f172a';
      el.style.fontFamily = 'Inter, sans-serif';
    });
    svgEl.querySelectorAll('.node-title-text').forEach(el => {
      el.style.fill = isDark ? '#94a3b8' : '#475569';
      el.style.fontFamily = 'Inter, sans-serif';
    });
    svgEl.querySelectorAll('.node-dept-text, .node-meta-text').forEach(el => {
      el.style.fill = isDark ? '#64748b' : '#94a3b8';
      el.style.fontFamily = 'Inter, sans-serif';
    });
    svgEl.querySelectorAll('.node-type-badge').forEach(el => {
      el.style.fontFamily = 'Inter, sans-serif';
    });
    const css = getComputedStyle(document.documentElement);
    const linkColor = css.getPropertyValue('--link').trim();
    const accent = css.getPropertyValue('--accent').trim();
    svgEl.querySelectorAll('.org-link').forEach(el => {
      const hl = el.classList.contains('highlighted');
      el.style.fill = 'none';
      el.style.stroke = hl ? accent : linkColor;
      el.style.strokeWidth = hl ? '3' : '2';
      el.style.strokeLinejoin = 'round';
    });
  },
};
