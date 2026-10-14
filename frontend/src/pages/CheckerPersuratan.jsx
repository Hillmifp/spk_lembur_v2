
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../components/layout/Layout";
import api from "../services/api";

const STATUSES = [
  "Menunggu Pemeriksaan",
  "Sedang Diperiksa",
  "Perlu Revisi",
  "Siap Diteruskan",
  "Selesai",
];

const CHECKLIST = [
  ["nomor", "Nomor naskah/surat tercantum dan benar"],
  ["tanggal", "Tanggal naskah benar"],
  ["tujuan", "Tujuan/alamat penerima jelas"],
  ["perihal", "Perihal sesuai substansi"],
  ["isi", "Isi, maksud, dan tindak lanjut jelas"],
  ["lampiran", "Lampiran sesuai dan lengkap / dinyatakan nihil"],
  ["penandatangan", "Nama dan jabatan penandatangan benar"],
  ["bahasa", "Bahasa dan ejaan telah diperiksa"],
  ["format", "Format sesuai tata naskah dinas yang berlaku"],
  ["dasar", "Dasar hukum/rujukan diverifikasi bila diperlukan"],
];

const blank = {
  document_type: "Nota Dinas",
  title: "",
  document_number: "",
  document_date: "",
  sender: "",
  recipient: "",
  subject: "",
};

const STATUS_CLASS = {
  "Menunggu Pemeriksaan": "waiting",
  "Sedang Diperiksa": "progress",
  "Perlu Revisi": "revision",
  "Siap Diteruskan": "ready",
  Selesai: "done",
};

export default function CheckerPersuratan() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(true);

  const refresh = async () => {
    try {
      const response = await api.get("/api/checker");
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data. Periksa koneksi backend.");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const keyword = filter.trim().toLowerCase();

    return items.filter((item) =>
      [
        item.title,
        item.document_number,
        item.document_type,
        item.status,
        item.subject,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [items, filter]);

  const updateForm = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.error("Pilih dokumen DOCX, PDF, atau TXT terlebih dahulu.");
      return;
    }

    const body = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      body.append(key, value);
    });

    body.append("file", file);

    setLoading(true);

    try {
      const response = await api.post("/api/checker", body);
      setSelected(response.data.data);
      setForm(blank);
      setFile(null);
      event.target.reset();
      await refresh();
      toast.success("Dokumen berhasil didaftarkan.");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.error || "Dokumen gagal diproses."
      );
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (item) => {
    setDetailLoading(true);

    try {
      const response = await api.get(`/api/checker/${item.id}`);
      setSelected(response.data);
      document
        .getElementById("checker-detail")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuka detail dokumen.");
    } finally {
      setDetailLoading(false);
    }
  };

  const saveReview = async () => {
    if (!selected) return;

    try {
      const response = await api.put(`/api/checker/${selected.id}`, {
        status: selected.status,
        checker_notes: selected.checker_notes,
        checklist: selected.checklist || {},
      });

      setSelected(response.data.data);
      await refresh();
      toast.success("Hasil pemeriksaan berhasil disimpan.");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.error || "Gagal menyimpan pemeriksaan."
      );
    }
  };

  const closeDetail = () => setSelected(null);

  return (
    <Layout title="Checker Persuratan">
      <div className="sc-page">
        <style>{`
          .sc-page {
            width: 100%;
            max-width: 1600px;
            margin: 0 auto;
            padding: 4px 0 32px;
            color: #243047;
            font-size: 14px;
          }

          .sc-page * {
            box-sizing: border-box;
          }

          .sc-page button,
          .sc-page input,
          .sc-page select,
          .sc-page textarea {
            font: inherit;
          }

          .sc-page .sc-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 22px;
          }

          .sc-page .sc-title {
            margin: 0;
            color: #172033;
            font-size: 27px;
            line-height: 1.3;
            font-weight: 750;
            letter-spacing: -.45px;
          }

          .sc-page .sc-subtitle {
            margin: 7px 0 0;
            color: #7b879b;
            font-size: 14px;
            line-height: 1.6;
          }

          .sc-page .sc-count {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            background: #edf4ff;
            border: 1px solid #dce7fb;
            border-radius: 11px;
            color: #285bc5;
            font-size: 13px;
            font-weight: 700;
            white-space: nowrap;
          }

          .sc-page .sc-notice {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 22px;
            padding: 15px 17px;
            border: 1px solid #d9e8ff;
            border-radius: 12px;
            background: #f1f7ff;
            color: #425b7b;
            font-size: 13px;
            line-height: 1.7;
          }

          .sc-page .sc-notice-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 28px;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: #deebff;
            color: #285bc5;
            font-weight: 800;
          }

          .sc-page .sc-card {
            margin-bottom: 23px;
            overflow: hidden;
            border: 1px solid #edf0f5;
            border-radius: 17px;
            background: #fff;
            box-shadow: 0 6px 24px rgba(31,45,72,.045);
          }

          .sc-page .sc-card-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            padding: 21px 24px;
            border-bottom: 1px solid #edf0f5;
          }

          .sc-page .sc-card-title {
            margin: 0;
            color: #202b3e;
            font-size: 16px;
            font-weight: 750;
          }

          .sc-page .sc-card-desc {
            margin: 5px 0 0;
            color: #8792a5;
            font-size: 12px;
            line-height: 1.6;
          }

          .sc-page .sc-card-body {
            padding: 24px;
          }

          .sc-page .sc-form-grid {
            display: grid;
            grid-template-columns: repeat(12, minmax(0, 1fr));
            gap: 19px 18px;
          }

          .sc-page .sc-field {
            grid-column: span 4;
            min-width: 0;
          }

          .sc-page .sc-field.span-6 {
            grid-column: span 6;
          }

          .sc-page .sc-field.span-8 {
            grid-column: span 8;
          }

          .sc-page .sc-field.span-12 {
            grid-column: span 12;
          }

          .sc-page .sc-label {
            display: block;
            margin: 0 0 8px;
            color: #42516a;
            font-size: 13px;
            font-weight: 650;
            line-height: 1.5;
          }

          .sc-page .sc-required {
            color: #dc4c64;
          }

          .sc-page .sc-control {
            display: block;
            width: 100%;
            min-width: 0;
            min-height: 44px;
            padding: 10px 13px;
            border: 1px solid #dfe5ee;
            border-radius: 9px;
            background: #fff;
            color: #29364a;
            font-size: 13px;
            line-height: 1.5;
            outline: none;
            box-shadow: none;
            transition: border-color .18s, box-shadow .18s;
          }

          .sc-page .sc-control:focus {
            border-color: #3979f6;
            box-shadow: 0 0 0 3px rgba(57,121,246,.12);
          }

          .sc-page .sc-control::placeholder {
            color: #a0aabc;
          }

          .sc-page select.sc-control {
            cursor: pointer;
          }

          .sc-page input[type="file"].sc-control {
            padding: 7px 9px;
            color: #64748b;
          }

          .sc-page input[type="file"]::file-selector-button {
            margin-right: 12px;
            padding: 7px 12px;
            border: 0;
            border-radius: 6px;
            background: #edf4ff;
            color: #285bc5;
            font-size: 12px;
            font-weight: 650;
            cursor: pointer;
          }

          .sc-page .sc-help {
            margin: 7px 0 0;
            color: #8a95a8;
            font-size: 12px;
            line-height: 1.6;
          }

          .sc-page .sc-actions {
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            gap: 10px;
          }

          .sc-page .sc-btn {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            min-height: 41px;
            padding: 10px 15px;
            border: 1px solid transparent;
            border-radius: 9px;
            font-size: 13px;
            font-weight: 700;
            line-height: 1.3;
            text-decoration: none;
            cursor: pointer;
            transition: background .18s, border-color .18s, transform .18s;
          }

          .sc-page .sc-btn:disabled {
            opacity: .58;
            cursor: not-allowed;
          }

          .sc-page .sc-btn-primary {
            background: #326df4;
            color: #fff;
          }

          .sc-page .sc-btn-primary:hover:not(:disabled) {
            background: #245bd7;
            transform: translateY(-1px);
          }

          .sc-page .sc-btn-outline {
            border-color: #dbe3ef;
            background: #fff;
            color: #475569;
          }

          .sc-page .sc-btn-outline:hover:not(:disabled) {
            background: #f8fafc;
            border-color: #b8c7dd;
          }

          .sc-page .sc-btn-success {
            background: #159b65;
            color: #fff;
          }

          .sc-page .sc-btn-success:hover:not(:disabled) {
            background: #107e51;
          }

          .sc-page .sc-btn-full {
            width: 100%;
          }

          .sc-page .sc-list-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 14px;
            padding: 22px 24px;
            border-bottom: 1px solid #edf0f5;
          }

          .sc-page .sc-search {
            width: min(100%, 330px);
            min-height: 42px;
            padding: 9px 13px;
            border: 1px solid #dfe5ee;
            border-radius: 9px;
            background: #fff;
            color: #29364a;
            font-size: 13px;
            outline: none;
          }

          .sc-page .sc-search:focus {
            border-color: #3979f6;
            box-shadow: 0 0 0 3px rgba(57,121,246,.1);
          }

          .sc-page .sc-table-wrap {
            width: 100%;
            overflow-x: auto;
          }

          .sc-page .sc-table {
            width: 100%;
            min-width: 820px;
            border-collapse: separate;
            border-spacing: 0;
            text-align: left;
          }

          .sc-page .sc-table th {
            padding: 15px 20px;
            background: #f8fafc;
            color: #748198;
            border-bottom: 1px solid #e9eef5;
            font-size: 11px;
            font-weight: 750;
            letter-spacing: .45px;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .sc-page .sc-table td {
            padding: 17px 20px;
            border-bottom: 1px solid #f0f2f6;
            color: #46546a;
            font-size: 13px;
            line-height: 1.6;
            vertical-align: middle;
          }

          .sc-page .sc-table tbody tr:last-child td {
            border-bottom: 0;
          }

          .sc-page .sc-table tbody tr:hover td {
            background: #f9fbff;
          }

          .sc-page .sc-doc-title {
            display: block;
            margin-bottom: 4px;
            color: #25344c;
            font-size: 13px;
            font-weight: 700;
          }

          .sc-page .sc-muted {
            color: #8a95a8;
            font-size: 12px;
          }

          .sc-page .sc-number {
            color: #405b91;
            overflow-wrap: anywhere;
          }

          .sc-page .sc-status {
            display: inline-flex;
            align-items: center;
            padding: 6px 9px;
            border-radius: 7px;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.4;
            white-space: nowrap;
          }

          .sc-page .sc-status.waiting {
            background: #f1f5f9;
            color: #64748b;
          }

          .sc-page .sc-status.progress {
            background: #e8f1ff;
            color: #285bc5;
          }

          .sc-page .sc-status.revision {
            background: #fff3dc;
            color: #a76509;
          }

          .sc-page .sc-status.ready {
            background: #e9f8ef;
            color: #167847;
          }

          .sc-page .sc-status.done {
            background: #e5f6f0;
            color: #087b62;
          }

          .sc-page .sc-empty {
            padding: 45px 20px !important;
            text-align: center;
          }

          .sc-page .sc-empty-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            margin: 0 auto 12px;
            border-radius: 14px;
            background: #f1f5f9;
            color: #7b8aa1;
            font-size: 22px;
          }

          .sc-page .sc-empty-title {
            margin: 0 0 5px;
            color: #344256;
            font-size: 14px;
            font-weight: 700;
          }

          .sc-page .sc-empty-text {
            margin: 0;
            color: #94a3b8;
            font-size: 12px;
          }

          .sc-page .sc-detail {
            scroll-margin-top: 24px;
          }

          .sc-page .sc-detail-section {
            margin-top: 25px;
          }

          .sc-page .sc-section-title {
            margin: 0 0 13px;
            color: #27354b;
            font-size: 14px;
            font-weight: 750;
          }

          .sc-page .sc-findings {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .sc-page .sc-finding {
            padding: 15px;
            border: 1px solid #e8edf4;
            border-radius: 11px;
            background: #fff;
            color: #4a5870;
            font-size: 13px;
            line-height: 1.7;
          }

          .sc-page .sc-finding-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .sc-page .sc-finding-title {
            margin-bottom: 5px;
            color: #29374d;
            font-weight: 700;
          }

          .sc-page .sc-tag {
            display: inline-flex;
            align-items: center;
            margin-right: 7px;
            padding: 4px 7px;
            border-radius: 6px;
            background: #edf4ff;
            color: #285bc5;
            font-size: 10px;
            font-weight: 750;
            white-space: nowrap;
          }

          .sc-page .sc-tag.warning {
            background: #fff2d9;
            color: #9b650b;
          }

          .sc-page .sc-tag.error {
            background: #ffe8e8;
            color: #b42335;
          }

          .sc-page .sc-tag.success {
            background: #e4f7ec;
            color: #167847;
          }

          .sc-page .sc-source {
            display: block;
            margin-top: 7px;
            color: #8490a4;
            font-size: 11px;
            overflow-wrap: anywhere;
          }

          .sc-page .sc-check-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 11px;
          }

          .sc-page .sc-check {
            display: flex;
            align-items: flex-start;
            gap: 11px;
            padding: 14px;
            border: 1px solid #e5eaf1;
            border-radius: 10px;
            background: #fff;
            color: #4b586d;
            font-size: 12px;
            line-height: 1.6;
            cursor: pointer;
            transition: background .18s, border-color .18s;
          }

          .sc-page .sc-check:has(input:checked) {
            border-color: #b9d3ff;
            background: #f5f9ff;
          }

          .sc-page .sc-check input {
            flex: 0 0 17px;
            width: 17px;
            height: 17px;
            margin: 1px 0 0;
            accent-color: #326df4;
          }

          .sc-page .sc-review-grid {
            display: grid;
            grid-template-columns: minmax(220px, 1fr) minmax(0, 2fr);
            gap: 18px;
          }

          .sc-page .sc-textarea {
            display: block;
            width: 100%;
            min-height: 110px;
            resize: vertical;
            padding: 12px 13px;
            border: 1px solid #dfe5ee;
            border-radius: 9px;
            color: #29364a;
            font-size: 13px;
            line-height: 1.6;
            outline: none;
          }

          .sc-page .sc-textarea:focus {
            border-color: #3979f6;
            box-shadow: 0 0 0 3px rgba(57,121,246,.1);
          }

          .sc-page .sc-extracted {
            margin-top: 22px;
            border: 1px solid #e5eaf1;
            border-radius: 10px;
            overflow: hidden;
          }

          .sc-page .sc-extracted summary {
            padding: 14px 16px;
            background: #f8fafc;
            color: #58677e;
            font-size: 12px;
            font-weight: 650;
            cursor: pointer;
          }

          .sc-page .sc-extracted pre {
            max-height: 360px;
            margin: 0;
            padding: 16px;
            overflow: auto;
            background: #fff;
            color: #475569;
            font: 12px/1.8 ui-monospace, SFMono-Regular, Consolas, monospace;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .sc-page .sc-detail-actions {
            display: flex;
            align-items: center;
            gap: 9px;
            flex-wrap: wrap;
          }

          .sc-page .sc-review-footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 18px;
          }

          @media (max-width: 1050px) {
            .sc-page .sc-field {
              grid-column: span 6;
            }

            .sc-page .sc-field.span-8 {
              grid-column: span 8;
            }
          }

          @media (max-width: 680px) {
            .sc-page .sc-title {
              font-size: 23px;
            }

            .sc-page .sc-card-body {
              padding: 18px;
            }

            .sc-page .sc-card-head,
            .sc-page .sc-list-head {
              padding: 18px;
            }

            .sc-page .sc-field,
            .sc-page .sc-field.span-6,
            .sc-page .sc-field.span-8,
            .sc-page .sc-field.span-12 {
              grid-column: span 12;
            }

            .sc-page .sc-check-grid,
            .sc-page .sc-review-grid {
              grid-template-columns: 1fr;
            }

            .sc-page .sc-search {
              width: 100%;
            }

            .sc-page .sc-list-head > div {
              width: 100%;
            }

            .sc-page .sc-notice {
              padding: 13px;
            }
          }
        `}</style>

        <header className="sc-heading">
          <div>
            <h1 className="sc-title">Checker Persuratan</h1>
            <p className="sc-subtitle">
              Registrasi, pemeriksaan awal, validasi standar, dan tindak lanjut
              dokumen kedinasan.
            </p>
          </div>

          <div className="sc-count">
            <span aria-hidden="true">▤</span>
            {items.length} dokumen
          </div>
        </header>

        <div className="sc-notice">
          <div className="sc-notice-icon">i</div>
          <div>
            <strong>Informasi pemeriksaan.</strong> Skrining otomatis
            merupakan pemeriksaan awal. Kesesuaian substansi, tata naskah
            dinas, nomor, tanda tangan, dan lampiran tetap harus diverifikasi
            oleh petugas yang berwenang.
          </div>
        </div>

        <section className="sc-card">
          <div className="sc-card-head">
            <div>
              <h2 className="sc-card-title">Daftarkan dokumen</h2>
              <p className="sc-card-desc">
                Lengkapi identitas dokumen dan unggah naskah untuk diperiksa.
              </p>
            </div>

            <button
              type="button"
              className="sc-btn sc-btn-outline"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "− Tutup formulir" : "+ Tambah dokumen"}
            </button>
          </div>

          {showForm && (
            <div className="sc-card-body">
              <form onSubmit={submit}>
                <div className="sc-form-grid">
                  <div className="sc-field">
                    <label className="sc-label" htmlFor="sc-type">
                      Jenis dokumen <span className="sc-required">*</span>
                    </label>
                    <select
                      id="sc-type"
                      className="sc-control"
                      name="document_type"
                      value={form.document_type}
                      onChange={updateForm}
                    >
                      <option>Nota Dinas</option>
                      <option>Surat Masuk</option>
                      <option>Surat Keluar</option>
                      <option>Surat Undangan</option>
                      <option>Surat Tugas</option>
                      <option>Berita Acara</option>
                      <option>Memorandum</option>
                      <option>Lainnya</option>
                    </select>
                  </div>

                  <div className="sc-field span-8">
                    <label className="sc-label" htmlFor="sc-title">
                      Judul / nama dokumen{" "}
                      <span className="sc-required">*</span>
                    </label>
                    <input
                      id="sc-title"
                      className="sc-control"
                      name="title"
                      value={form.title}
                      onChange={updateForm}
                      placeholder="Contoh: Nota Dinas permohonan persetujuan"
                      required
                    />
                  </div>

                  <div className="sc-field">
                    <label className="sc-label" htmlFor="sc-number">
                      Nomor naskah
                    </label>
                    <input
                      id="sc-number"
                      className="sc-control"
                      name="document_number"
                      value={form.document_number}
                      onChange={updateForm}
                      placeholder="Nomor surat"
                    />
                  </div>

                  <div className="sc-field">
                    <label className="sc-label" htmlFor="sc-date">
                      Tanggal naskah
                    </label>
                    <input
                      id="sc-date"
                      type="date"
                      className="sc-control"
                      name="document_date"
                      value={form.document_date}
                      onChange={updateForm}
                    />
                  </div>

                  <div className="sc-field">
                    <label className="sc-label" htmlFor="sc-sender">
                      Pengirim / unit kerja
                    </label>
                    <input
                      id="sc-sender"
                      className="sc-control"
                      name="sender"
                      value={form.sender}
                      onChange={updateForm}
                      placeholder="Nama unit pengirim"
                    />
                  </div>

                  <div className="sc-field span-6">
                    <label className="sc-label" htmlFor="sc-recipient">
                      Kepada / penerima
                    </label>
                    <input
                      id="sc-recipient"
                      className="sc-control"
                      name="recipient"
                      value={form.recipient}
                      onChange={updateForm}
                      placeholder="Tujuan dokumen"
                    />
                  </div>

                  <div className="sc-field span-6">
                    <label className="sc-label" htmlFor="sc-subject">
                      Perihal
                    </label>
                    <input
                      id="sc-subject"
                      className="sc-control"
                      name="subject"
                      value={form.subject}
                      onChange={updateForm}
                      placeholder="Ringkasan isi surat"
                    />
                  </div>

                  <div className="sc-field span-8">
                    <label className="sc-label" htmlFor="sc-file">
                      File dokumen <span className="sc-required">*</span>
                    </label>
                    <input
                      id="sc-file"
                      type="file"
                      className="sc-control"
                      accept=".docx,.pdf,.txt"
                      onChange={(event) =>
                        setFile(event.target.files?.[0] || null)
                      }
                      required
                    />
                    <p className="sc-help">
                      Format DOCX, PDF, atau TXT. PDF hasil pemindaian
                      mungkin memerlukan pemeriksaan manual.
                    </p>
                  </div>

                  <div className="sc-field span-4 sc-actions">
                    <button
                      type="submit"
                      className="sc-btn sc-btn-primary sc-btn-full"
                      disabled={loading}
                    >
                      {loading ? "Memproses dokumen..." : "✓ Daftarkan & Skrining"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </section>

        <section className="sc-card">
          <div className="sc-list-head">
            <div>
              <h2 className="sc-card-title">Daftar pemeriksaan</h2>
              <p className="sc-card-desc">
                Cari dokumen berdasarkan judul, nomor, jenis, atau status.
              </p>
            </div>

            <input
              className="sc-search"
              type="search"
              aria-label="Cari dokumen"
              placeholder="⌕  Cari judul, nomor, status..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>

          <div className="sc-table-wrap">
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Dokumen</th>
                  <th>Nomor / tanggal</th>
                  <th>Status</th>
                  <th>Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="sc-doc-title">{item.title}</span>
                      <span className="sc-muted">
                        {item.document_type} · {item.attachment_name}
                      </span>
                    </td>

                    <td>
                      <span className="sc-number">
                        {item.document_number || "Belum bernomor"}
                      </span>
                      <br />
                      <span className="sc-muted">
                        {item.document_date || "Tanggal belum dicatat"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`sc-status ${
                          STATUS_CLASS[item.status] || "waiting"
                        }`}
                      >
                        {item.status || "Menunggu Pemeriksaan"}
                      </span>
                    </td>

                    <td className="sc-muted">
                      {item.created_at?.replace("T", " ") || "—"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="sc-btn sc-btn-outline"
                        disabled={detailLoading}
                        onClick={() => openDetail(item)}
                      >
                        {detailLoading ? "Memuat..." : "Periksa →"}
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="sc-empty">
                      <div className="sc-empty-icon">⌕</div>
                      <p className="sc-empty-title">
                        {items.length === 0
                          ? "Belum ada dokumen terdaftar"
                          : "Dokumen tidak ditemukan"}
                      </p>
                      <p className="sc-empty-text">
                        {items.length === 0
                          ? "Gunakan formulir di atas untuk menambahkan dokumen pertama."
                          : "Coba gunakan kata kunci lain."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <section className="sc-card sc-detail" id="checker-detail">
            <div className="sc-card-head">
              <div>
                <h2 className="sc-card-title">{selected.title}</h2>
                <p className="sc-card-desc">
                  {selected.document_type} · {selected.attachment_name}
                </p>
              </div>

              <button
                type="button"
                className="sc-btn sc-btn-outline"
                onClick={closeDetail}
              >
                Tutup ×
              </button>
            </div>

            <div className="sc-card-body">
              <div className="sc-detail-actions">
                <a
                  className="sc-btn sc-btn-outline"
                  href={`${api.defaults.baseURL || ""}/api/checker/${selected.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                >
                  ↓ Unduh dokumen asli
                </a>

                <span
                  className={`sc-status ${
                    STATUS_CLASS[selected.status] || "waiting"
                  }`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="sc-detail-section">
                <h3 className="sc-section-title">Skrining otomatis</h3>

                <div className="sc-findings">
                  {(selected.automated_findings || []).length ? (
                    selected.automated_findings.map((finding, index) => (
                      <div className="sc-finding" key={index}>
                        <span
                          className={`sc-tag ${
                            finding.severity === "warning" ? "warning" : ""
                          }`}
                        >
                          {finding.severity === "warning"
                            ? "Perlu diperiksa"
                            : "Informasi"}
                        </span>
                        {finding.message}
                      </div>
                    ))
                  ) : (
                    <div className="sc-finding">
                      Belum ada temuan otomatis.
                    </div>
                  )}
                </div>
              </div>

              <div className="sc-detail-section">
                <h3 className="sc-section-title">
                  Perbandingan dengan standar referensi
                </h3>

                <div className="sc-findings">
                  {(selected.source_findings || []).length ? (
                    selected.source_findings.map((finding, index) => (
                      <div
                        className="sc-finding"
                        key={`${finding.rule_id}-${index}`}
                      >
                        <div className="sc-finding-top">
                          <div>
                            <div className="sc-finding-title">
                              <span
                                className={`sc-tag ${
                                  finding.severity === "error"
                                    ? "error"
                                    : finding.severity === "warning"
                                    ? "warning"
                                    : ""
                                }`}
                              >
                                {finding.severity === "error"
                                  ? "Penting"
                                  : finding.severity === "warning"
                                  ? "Verifikasi"
                                  : "Informasi"}
                              </span>
                              {finding.rule_name}
                            </div>

                            <div>{finding.message}</div>

                            {finding.source_title && (
                              <span className="sc-source">
                                Sumber: {finding.source_title}
                                {finding.source_document_number
                                  ? ` · ${finding.source_document_number}`
                                  : ""}
                                {finding.source_paragraph_no
                                  ? ` · Paragraf ${finding.source_paragraph_no}`
                                  : ""}
                                {finding.rule_id
                                  ? ` · Aturan #${finding.rule_id}`
                                  : ""}
                              </span>
                            )}
                          </div>

                          <span
                            className={`sc-tag ${
                              finding.matched ? "success" : "warning"
                            }`}
                          >
                            {finding.matched
                              ? "Terdeteksi"
                              : "Belum terdeteksi"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="sc-finding">
                      Belum ada aturan aktif yang cocok dengan jenis dokumen
                      ini. Tambahkan dokumen final di Pustaka Referensi dan
                      validasi paragraf menjadi standar.
                    </div>
                  )}
                </div>
              </div>

              <div className="sc-detail-section">
                <h3 className="sc-section-title">
                  Checklist pemeriksaan manual
                </h3>

                <div className="sc-check-grid">
                  {CHECKLIST.map(([key, label]) => (
                    <label className="sc-check" key={key}>
                      <input
                        type="checkbox"
                        checked={Boolean(selected.checklist?.[key])}
                        onChange={(event) =>
                          setSelected({
                            ...selected,
                            checklist: {
                              ...(selected.checklist || {}),
                              [key]: event.target.checked,
                            },
                          })
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sc-detail-section">
                <h3 className="sc-section-title">
                  Hasil dan tindak lanjut
                </h3>

                <div className="sc-review-grid">
                  <div>
                    <label className="sc-label" htmlFor="sc-review-status">
                      Status pemeriksaan
                    </label>
                    <select
                      id="sc-review-status"
                      className="sc-control"
                      value={selected.status}
                      onChange={(event) =>
                        setSelected({
                          ...selected,
                          status: event.target.value,
                        })
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="sc-label" htmlFor="sc-review-notes">
                      Catatan koreksi / tindak lanjut
                    </label>
                    <textarea
                      id="sc-review-notes"
                      className="sc-textarea"
                      rows="4"
                      value={selected.checker_notes || ""}
                      onChange={(event) =>
                        setSelected({
                          ...selected,
                          checker_notes: event.target.value,
                        })
                      }
                      placeholder="Tuliskan bagian yang perlu diperbaiki, dasar koreksi, atau tindak lanjut..."
                    />
                  </div>
                </div>

                <div className="sc-review-footer">
                  <button
                    type="button"
                    className="sc-btn sc-btn-primary"
                    onClick={saveReview}
                  >
                    ✓ Simpan hasil pemeriksaan
                  </button>
                </div>
              </div>

              <details className="sc-extracted">
                <summary>
                  Lihat teks hasil ekstraksi dokumen
                </summary>
                <pre>
                  {selected.extracted_text ||
                    "Tidak ada teks yang berhasil diekstrak."}
                </pre>
              </details>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
