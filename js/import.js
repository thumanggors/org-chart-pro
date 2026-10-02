/* ===== OrgChart Pro — Import Service ===== */

const ImportService = {
  _pendingData: null,

  showImportModal() {
    this._pendingData = null;
    document.getElementById('importPreview').classList.add('hidden');
    document.getElementById('btnConfirmImport').classList.add('hidden');
    document.getElementById('importDropzone').style.display = '';
    document.getElementById('importFileInput').value = '';
    UI.openModal('importModal');
  },

  handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      UI.toast(t('Unsupported file format. Use .xlsx, .xls, or .csv'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          UI.toast(t('File is empty'), 'error');
          return;
        }

        this._processImport(rows, file.name);
      } catch (err) {
        UI.toast(t('Failed to parse file: {e}', { e: err.message }), 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  },

  _processImport(rows, filename) {
    // Map columns (case-insensitive, flexible naming)
    const colMap = {
      id: ['id', 'node_id', 'emp_id', 'employee_id', 'code'],
      parentId: ['parent_id', 'parentid', 'parent', 'reports_to', 'manager_id'],
      type: ['type', 'node_type', 'level_type', 'category'],
      name: ['name', 'full_name', 'fullname', 'employee_name'],
      title: ['title', 'position', 'job_title', 'designation'],
      department: ['department', 'dept', 'department_name'],
      division: ['division', 'div', 'division_name', 'unit'],
      email: ['email', 'email_address', 'mail'],
      phone: ['phone', 'telephone', 'mobile', 'contact'],
      status: ['status', 'employee_status', 'active'],
    };

    const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim());
    const mapping = {};
    for (const [field, aliases] of Object.entries(colMap)) {
      const found = headers.find(h => aliases.includes(h.replace(/\s+/g, '_')));
      if (found) mapping[field] = Object.keys(rows[0]).find(k => k.toLowerCase().trim() === found);
    }

    const nodes = rows.map((row, i) => ({
      id: String(row[mapping.id] || `IMP${i + 1}`).trim(),
      parentId: String(row[mapping.parentId] || '').trim() || null,
      type: String(row[mapping.type] || 'employee').trim().toLowerCase(),
      name: String(row[mapping.name] || '').trim(),
      title: String(row[mapping.title] || '').trim(),
      department: String(row[mapping.department] || '').trim(),
      division: String(row[mapping.division] || '').trim(),
      level: 0,
      employeeCode: String(row[mapping.id] || '').trim(),
      email: String(row[mapping.email] || '').trim(),
      phone: String(row[mapping.phone] || '').trim(),
      photo: '', description: '',
      status: String(row[mapping.status] || 'active').trim().toLowerCase(),
      color: '',
    }));

    // Fix null parentIds (string "null" or empty)
    nodes.forEach(n => {
      if (n.parentId === 'null' || n.parentId === 'undefined' || n.parentId === '') {
        n.parentId = null;
      }
    });

    // Validate
    const validation = Utils.validateNodes(nodes);

    // Show preview
    document.getElementById('importDropzone').style.display = 'none';
    document.getElementById('importPreview').classList.remove('hidden');

    const info = document.getElementById('importInfo');
    info.innerHTML = `
      <strong>${Utils.escapeHtml(filename)}</strong><br>
      ${t('{n} rows found · Mapped columns: {cols}', { n: rows.length, cols: Object.keys(mapping).join(', ') })}
    `;

    const valDiv = document.getElementById('importValidation');
    let html = '';
    if (validation.errors.length > 0) {
      html += validation.errors.map(e => `<div class="validation-error">⛔ ${Utils.escapeHtml(e)}</div>`).join('');
    }
    if (validation.warnings.length > 0) {
      html += validation.warnings.map(w => `<div class="validation-warn">⚠️ ${Utils.escapeHtml(w)}</div>`).join('');
    }
    if (validation.valid) {
      html += `<div class="validation-ok">✅ ${t('Validation passed — {n} nodes ready to import', { n: nodes.length })}</div>`;
      this._pendingData = nodes;
      document.getElementById('btnConfirmImport').classList.remove('hidden');
    } else {
      html += `<div class="validation-error">${t('Fix errors above before importing')}</div>`;
      this._pendingData = null;
    }
    valDiv.innerHTML = html;
  },

  confirmImport() {
    if (!this._pendingData) return;
    StorageService.pushUndo();
    DataService.setData({
      organization: {
        id: 'ORG_IMP',
        name: t('Imported Organization'),
        logo: '',
        period: new Date().getFullYear().toString(),
      },
      nodes: this._pendingData,
    });
    this._pendingData = null;
    UI.closeModal('importModal');
    App.refresh();
    UI.toast(t('Excel imported successfully'), 'success');
  },
};

// Drag-and-drop on import dropzone
document.addEventListener('DOMContentLoaded', () => {
  const dz = document.getElementById('importDropzone');
  if (!dz) return;
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) ImportService.handleFile(e.dataTransfer.files[0]);
  });
});
