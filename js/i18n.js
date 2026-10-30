/* ===== OrgChart Pro — Translations (EN / ID) =====
   The English text is the key: t('Save') -> 'Simpan' when lang is 'id'.
   A missing entry falls back to the English text. {name} placeholders are filled from params. */

const I18n = {
  lang: 'id',

  dict: {
    id: {
      // Navbar / menu
      'Toggle Sidebar': 'Buka/Tutup Sidebar',
      'Search employees, departments...': 'Cari karyawan, departemen...',
      'Undo (Ctrl+Z)': 'Urungkan (Ctrl+Z)',
      'Redo (Ctrl+Y)': 'Ulangi (Ctrl+Y)',
      'Toggle Theme': 'Ganti Tema',
      'Language': 'Bahasa',
      'Export': 'Ekspor',
      'Export PNG': 'Ekspor PNG',
      'Export SVG': 'Ekspor SVG',
      'Export PDF': 'Ekspor PDF',
      'Export Excel': 'Ekspor Excel',
      'Export JSON': 'Ekspor JSON',
      'Dashboard': 'Dasbor',
      'Organization': 'Organisasi',
      'Employees': 'Karyawan',
      'Departments': 'Departemen',
      'Tools': 'Alat',
      'Import': 'Impor',
      'Data': 'Data',
      'Save': 'Simpan',
      'Load': 'Buka',
      'Clear All': 'Hapus Semua',
      'Untitled': 'Tanpa Nama',

      // Dashboard
      'Organization overview and analytics': 'Ringkasan dan analitik organisasi',
      'View Org Chart': 'Lihat Bagan',
      'Department Distribution': 'Distribusi Departemen',
      'Headcount by Department': 'Jumlah Personel per Departemen',
      'Management Layers': 'Lapisan Manajemen',
      'Recent Changes': 'Perubahan Terbaru',
      'No recent changes': 'Belum ada perubahan',
      'No data yet': 'Belum ada data',
      'Total Nodes': 'Total Node',
      'Divisions': 'Divisi',
      'Active': 'Aktif',
      'Inactive': 'Nonaktif',
      'add': 'tambah',
      'update': 'ubah',
      'delete': 'hapus',
      'move': 'pindah',
      'duplicate': 'duplikat',

      // Org chart
      'All Departments': 'Semua Departemen',
      'All Levels': 'Semua Level',
      'Directors': 'Direktur',
      'Managers': 'Manajer',
      'Toggle Layout': 'Ubah Tata Letak',
      'Add Node': 'Tambah Node',
      'No organization data yet.': 'Belum ada data organisasi.',
      'Add First Node': 'Tambah Node Pertama',
      'Import Excel/CSV': 'Impor Excel/CSV',
      'Zoom In': 'Perbesar',
      'Zoom Out': 'Perkecil',
      'Fit to Screen': 'Sesuaikan Layar',
      'Expand All': 'Buka Semua',
      'Collapse All': 'Tutup Semua',
      'Fullscreen': 'Layar Penuh',
      'No results match the selected filters': 'Tidak ada data untuk filter ini',
      '{n} reports': '{n} bawahan',
      'Root': 'Induk',
      'Move Organization Unit?': 'Pindahkan Unit Organisasi?',
      'Move "{a}" under "{b}"?': 'Pindahkan "{a}" ke bawah "{b}"?',
      'Node moved successfully': 'Node berhasil dipindahkan',
      'Reset layout (drag cards and lines to arrange · long-press to select several · Shift+drag onto a card to change its parent)': 'Reset tata letak (seret kartu dan garis untuk menata · tekan lama untuk memilih beberapa · Shift+seret ke kartu lain untuk mengganti atasan)',
      'Layout reset': 'Tata letak dikembalikan',

      // Departments
      'Structure chart per department': 'Bagan struktur per departemen',
      '{n} people': '{n} orang',
      'Head: {name}': 'Pimpinan: {name}',
      'No departments yet. Fill in the Department field on nodes.': 'Belum ada departemen. Isi kolom Departemen pada node.',
      'Back to Departments': 'Kembali ke Departemen',

      // Node types
      'Company': 'Perusahaan',
      'Board': 'Dewan',
      'Director': 'Direktur',
      'Department': 'Departemen',
      'Division': 'Divisi',
      'Sub Division': 'Sub Divisi',
      'Manager': 'Manajer',
      'Supervisor': 'Supervisor',
      'Employee': 'Karyawan',

      // Employees
      'Add Employee': 'Tambah Karyawan',
      'All Status': 'Semua Status',
      'Position': 'Jabatan',
      'Status': 'Status',
      'Actions': 'Aksi',
      '{n} employees': '{n} karyawan',
      'No employees yet': 'Belum ada karyawan',
      'Edit': 'Ubah',
      'View': 'Lihat',

      // Drawer
      'Node Details': 'Detail Node',
      'Details': 'Detail',
      'Employee ID': 'ID Karyawan',
      'Email': 'Email',
      'Phone': 'Telepon',
      'Type': 'Tipe',
      'Description': 'Deskripsi',
      'Reports To': 'Atasan',
      'Direct Reports ({n})': 'Bawahan Langsung ({n})',
      'Add Child': 'Tambah Bawahan',
      'Duplicate': 'Duplikat',
      'Add Sibling': 'Tambah Setara',
      'Delete': 'Hapus',

      // Node form
      'Add Organization Node': 'Tambah Node Organisasi',
      'Edit Node': 'Ubah Node',
      'Node Type': 'Tipe Node',
      'Name': 'Nama',
      'Full name or unit name': 'Nama lengkap atau nama unit',
      'Position / Title': 'Jabatan',
      'e.g. Finance Manager': 'mis. Manajer Keuangan',
      'Department name': 'Nama departemen',
      'Division name': 'Nama divisi',
      'Reports To (Parent)': 'Atasan Langsung',
      '— Select Parent —': '— Pilih Atasan —',
      '— No Parent (Root) —': '— Tanpa Atasan (Puncak) —',
      'Additional notes': 'Catatan tambahan',
      'name@company.com': 'nama@perusahaan.com',
      'Accent Color': 'Warna Aksen',
      'Cancel': 'Batal',
      'Save Node': 'Simpan Node',
      'Name is required': 'Nama wajib diisi',
      'Node updated': 'Node diperbarui',
      'Failed to add node': 'Gagal menambah node',
      'Node added': 'Node ditambahkan',
      'Delete Node': 'Hapus Node',
      'Delete "{name}" and all {n} children?': 'Hapus "{name}" beserta {n} bawahannya?',
      'Delete "{name}"?': 'Hapus "{name}"?',
      'Node deleted': 'Node dihapus',
      'Node duplicated': 'Node diduplikasi',
      'Copy': 'Salinan',
      'Clear all data?': 'Hapus semua data?',
      'This removes every node in the current organization. Undo with Ctrl+Z.': 'Semua node di organisasi ini akan dihapus. Bisa dibatalkan dengan Ctrl+Z.',
      'All data cleared': 'Semua data dihapus',

      // Import
      'Import Organization Data': 'Impor Data Organisasi',
      'Drop your file here or': 'Letakkan file di sini atau',
      'browse': 'telusuri',
      'Supports .xlsx, .xls, .csv': 'Mendukung .xlsx, .xls, .csv',
      'Confirm Import': 'Konfirmasi Impor',
      'Unsupported file format. Use .xlsx, .xls, or .csv': 'Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv',
      'File is empty': 'File kosong',
      'Failed to parse file: {e}': 'Gagal membaca file: {e}',
      '{n} rows found · Mapped columns: {cols}': '{n} baris ditemukan · Kolom terpetakan: {cols}',
      'Validation passed — {n} nodes ready to import': 'Validasi lolos — {n} node siap diimpor',
      'Fix errors above before importing': 'Perbaiki kesalahan di atas sebelum mengimpor',
      'Imported Organization': 'Organisasi Impor',
      'Excel imported successfully': 'Excel berhasil diimpor',
      'Row {n}: Missing ID': 'Baris {n}: ID kosong',
      'Duplicate ID: {id}': 'ID ganda: {id}',
      'Row {n} ({id}): Missing name': 'Baris {n} ({id}): Nama kosong',
      '{id}: Parent "{p}" not found': '{id}: Atasan "{p}" tidak ditemukan',
      'Circular reference detected: {a} → {b}': 'Referensi melingkar terdeteksi: {a} → {b}',

      // Export
      'Generating {f}...': 'Membuat {f}...',
      '{f} exported': '{f} berhasil diekspor',
      '{f} export failed: {e}': 'Ekspor {f} gagal: {e}',

      // Save / load
      'Save Organization': 'Simpan Organisasi',
      'Load Organization': 'Buka Organisasi',
      'Save Name': 'Nama Simpanan',
      'Organization name': 'Nama organisasi',
      'No saved organizations': 'Belum ada organisasi tersimpan',
      'Close': 'Tutup',
      '{n} nodes': '{n} node',
      'Organization saved': 'Organisasi disimpan',
      'Save failed: storage full': 'Gagal menyimpan: penyimpanan penuh',
      'Save not found': 'Simpanan tidak ditemukan',
      'Organization loaded': 'Organisasi dimuat',
      'Load failed: corrupted data': 'Gagal memuat: data rusak',
      'Download to computer': 'Unduh ke komputer',
      'Open from computer': 'Buka dari komputer',
      'Not an OrgChart Pro file': 'Bukan file OrgChart Pro',

      // Confirm dialog
      'Confirm': 'Konfirmasi',
      'Are you sure?': 'Anda yakin?',
    },
  },

  t(en, params) {
    let s = (this.dict[this.lang] && this.dict[this.lang][en]) || en;
    if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
    return s;
  },

  // Static HTML is translated in place. Its English originals are captured once, before any
  // dynamic rendering, so user data in tables/charts is never run through the dictionary.
  _staticText: null,
  _staticAttrs: null,

  _collect() {
    this._staticText = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const en = node.textContent.trim();
      if (en && this.dict.id[en]) this._staticText.push({ node, en });
    }
    this._staticAttrs = [];
    document.body.querySelectorAll('[placeholder],[title]').forEach(el => {
      ['placeholder', 'title'].forEach(attr => {
        const en = el.getAttribute(attr);
        if (en && this.dict.id[en]) this._staticAttrs.push({ el, attr, en });
      });
    });
  },

  setLang(lang) {
    this.lang = lang === 'en' ? 'en' : 'id';
    document.documentElement.lang = this.lang;
    if (!this._staticText) this._collect();
    this._staticText.forEach(({ node, en }) => {
      node.textContent = node.textContent.replace(node.textContent.trim(), this.t(en));
    });
    this._staticAttrs.forEach(({ el, attr, en }) => el.setAttribute(attr, this.t(en)));
    const btn = document.getElementById('btnLang');
    if (btn) btn.textContent = this.lang.toUpperCase();
  },
};

const t = (en, params) => I18n.t(en, params);
