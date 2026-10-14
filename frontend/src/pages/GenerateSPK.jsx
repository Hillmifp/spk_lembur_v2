
import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/layout/Layout";
import api from "../services/api";

function GenerateSPK() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [result, setResult] = useState(null);

  // ==========================
  // PREVIEW EXCEL
  // ==========================
  const handlePreview = async () => {
    if (!file) {
      alert("Pilih file Excel terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setPreviewLoading(true);
      setPreviewData([]);
      setResult(null);

      const response = await api.post("/preview", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setPreviewData(response.data.data || []);
    } catch (error) {
      console.error("Preview error:", error);

      alert(
        error.response?.data?.message ||
          "Gagal melakukan preview. Periksa file Excel dan koneksi backend."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // ==========================
  // GENERATE SPK
  // ==========================
  const handleGenerate = async () => {
    if (!file) {
      alert("Pilih file Excel terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setResult(null);

      const response = await api.post("/generate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);

      if (!response.data.success) {
        alert("Proses generate belum berhasil. Periksa hasil respons server.");
      }
    } catch (error) {
      console.error("Generate error:", error);

      alert(
        error.response?.data?.message ||
          "Generate SPK gagal. Silakan periksa koneksi backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // OPEN OUTPUT FOLDER
  // ==========================
  const openFolder = async () => {
    if (!result?.output_folder) {
      alert("Lokasi folder output tidak tersedia.");
      return;
    }

    try {
      await api.post("/api/open-output", {
        folder: result.output_folder,
      });
    } catch (error) {
      console.error("Open folder error:", error);

      alert(
        error.response?.data?.message ||
          "Gagal membuka folder. Pastikan backend berjalan."
      );
    }
  };

  // ==========================
  // HANDLE FILE SELECTION
  // ==========================
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    setFile(selectedFile);
    setPreviewData([]);
    setResult(null);
  };

  return (
    <Layout>
      <div className="spk-page">
        {/* PAGE HEADER */}
        <div className="spk-page-header">
          <div>
            <h2 className="spk-page-title">Generate SPK</h2>
            <p className="spk-page-subtitle">
              Unggah file Excel untuk melihat data dan membuat Surat
              Perintah Kerja Lembur secara otomatis.
            </p>
          </div>

          <div className="spk-page-icon">
            <i className="bi bi-file-earmark-word" aria-hidden="true"></i>
          </div>
        </div>

        {/* UPLOAD CARD */}
        <section className="spk-card">
          <div className="spk-card-header">
            <div className="spk-section-icon">
              <i className="bi bi-file-earmark-excel" aria-hidden="true"></i>
            </div>

            <div>
              <h5>Unggah File Excel</h5>
              <p>Pilih file sumber data lembur yang akan diproses.</p>
            </div>
          </div>

          <div className="spk-card-body">
            <label htmlFor="excel-file" className="spk-upload-label">
              File Excel
            </label>

            <div className="spk-upload-box">
              <div className="spk-upload-icon">
                <i className="bi bi-cloud-arrow-up" aria-hidden="true"></i>
              </div>

              <div className="spk-upload-content">
                <label htmlFor="excel-file" className="spk-upload-trigger">
                  Pilih file Excel
                </label>

                <p className="spk-upload-hint">
                  Format yang didukung: .xlsx dan .xls
                </p>

                <input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  className="spk-file-input"
                  onChange={handleFileChange}
                />

                {file && (
                  <div className="spk-selected-file">
                    <i className="bi bi-file-earmark-check" aria-hidden="true"></i>
                    <span title={file.name}>{file.name}</span>
                    <button
                      type="button"
                      className="spk-remove-file"
                      onClick={() => {
                        setFile(null);
                        setPreviewData([]);
                        setResult(null);

                        const input = document.getElementById("excel-file");
                        if (input) input.value = "";
                      }}
                      aria-label="Hapus file terpilih"
                      title="Hapus file"
                    >
                      <i className="bi bi-x-lg" aria-hidden="true"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="spk-actions">
              <button
                type="button"
                className="spk-btn spk-btn-preview"
                onClick={handlePreview}
                disabled={!file || previewLoading || loading}
              >
                {previewLoading ? (
                  <>
                    <span className="spk-spinner" aria-hidden="true"></span>
                    Memuat Preview...
                  </>
                ) : (
                  <>
                    <i className="bi bi-eye" aria-hidden="true"></i>
                    Preview
                  </>
                )}
              </button>

              <button
                type="button"
                className="spk-btn spk-btn-generate"
                onClick={handleGenerate}
                disabled={!file || loading || previewLoading}
              >
                {loading ? (
                  <>
                    <span className="spk-spinner" aria-hidden="true"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <i
                      className="bi bi-file-earmark-check"
                      aria-hidden="true"
                    ></i>
                    Generate SPK
                  </>
                )}
              </button>
            </div>

            <p className="spk-action-note">
              <i className="bi bi-info-circle" aria-hidden="true"></i>
              Disarankan melakukan preview sebelum membuat dokumen SPK.
            </p>
          </div>
        </section>

        {/* PREVIEW CARD */}
        {previewData.length > 0 && (
          <section className="spk-card spk-result-section">
            <div className="spk-card-header spk-card-header-separated">
              <div className="spk-section-icon spk-icon-blue">
                <i className="bi bi-table" aria-hidden="true"></i>
              </div>

              <div>
                <h5>Preview Data Lembur</h5>
                <p>Periksa pengelompokan data sebelum membuat SPK.</p>
              </div>

              <span className="spk-count-badge">
                {previewData.length} kelompok
              </span>
            </div>

            <div className="spk-table-wrapper">
              <table className="spk-table">
                <thead>
                  <tr>
                    <th className="spk-col-number">No.</th>
                    <th>Tanggal Lembur</th>
                    <th>Bidang</th>
                    <th className="spk-col-count">Jumlah Pegawai</th>
                  </tr>
                </thead>

                <tbody>
                  {previewData.map((item, index) => (
                    <tr key={`${item["Tanggal Lembur"]}-${item["Keterangan"]}-${index}`}>
                      <td className="spk-col-number">{index + 1}</td>
                      <td>{item["Tanggal Lembur"] ?? "-"}</td>
                      <td>
                        <span className="spk-bidang-badge">
                          {item["Keterangan"] ?? "-"}
                        </span>
                      </td>
                      <td className="spk-col-count">
                        {item["Jumlah Pegawai"] ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="spk-card-footer">
              <i className="bi bi-check-circle" aria-hidden="true"></i>
              Data berhasil dimuat. Periksa tanggal dan bidang sebelum
              melanjutkan.
            </div>
          </section>
        )}

        {/* GENERATE RESULT */}
        {result?.success && (
          <section className="spk-card spk-result-section spk-success-card">
            <div className="spk-success-header">
              <div className="spk-success-icon">
                <i className="bi bi-check-lg" aria-hidden="true"></i>
              </div>

              <div>
                <h4>Generate SPK Berhasil</h4>
                <p>Dokumen SPK telah selesai diproses oleh sistem.</p>
              </div>
            </div>

            <div className="spk-summary-grid">
              <div className="spk-summary-item">
                <span>Total SPK Dibuat</span>
                <strong>{result.total_file ?? 0}</strong>
              </div>

              <div className="spk-summary-item spk-summary-folder">
                <span>Folder Output</span>
                <code>{result.output_folder || "-"}</code>
              </div>
            </div>

            <div className="spk-result-actions">
              <button
                type="button"
                className="spk-btn spk-btn-success"
                onClick={openFolder}
              >
                <i className="bi bi-folder2-open" aria-hidden="true"></i>
                Buka Folder Output
              </button>

              <Link to="/history" className="spk-btn spk-btn-outline">
                <i className="bi bi-clock-history" aria-hidden="true"></i>
                Lihat Riwayat SPK
              </Link>
            </div>

            {result.files && result.files.length > 0 && (
              <div className="spk-generated-files">
                <h5>
                  <i className="bi bi-files" aria-hidden="true"></i>
                  File Hasil Generate
                </h5>

                <ul className="spk-file-list">
                  {result.files.map((filePath, index) => {
                    const fileName = String(filePath).split(/[\\/]/).pop();

                    return (
                      <li key={`${fileName}-${index}`}>
                        <i
                          className="bi bi-file-earmark-word"
                          aria-hidden="true"
                        ></i>
                        <span title={fileName}>{fileName}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* FOOTER */}
        <div className="spk-page-footer">
          SPK Lembur Management System
        </div>
      </div>

      {/* PAGE STYLES */}
      <style>{`
        .spk-page {
          --spk-primary: #2864ed;
          --spk-text: #1f2937;
          --spk-muted: #7c8ba1;
          --spk-border: #e5eaf2;
          color: var(--spk-text);
          padding-bottom: 32px;
        }

        .spk-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
        }

        .spk-page-title {
          margin: 0 0 8px;
          font-size: 27px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .spk-page-subtitle {
          margin: 0;
          color: var(--spk-muted);
          font-size: 14px;
          line-height: 1.7;
        }

        .spk-page-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          flex-shrink: 0;
          border-radius: 16px;
          background: #eaf1ff;
          color: var(--spk-primary);
          font-size: 25px;
        }

        .spk-card {
          overflow: hidden;
          background: #fff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 18px;
          box-shadow: 0 8px 30px rgba(31, 45, 61, 0.045);
        }

        .spk-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 24px 28px;
          border-bottom: 1px solid #f0f3f8;
        }

        .spk-section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          border-radius: 13px;
          background: #e9f8ef;
          color: #18864b;
          font-size: 21px;
        }

        .spk-card-header h5 {
          margin: 0 0 5px;
          font-size: 16px;
          font-weight: 700;
        }

        .spk-card-header p {
          margin: 0;
          color: var(--spk-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .spk-card-body {
          padding: 28px;
        }

        .spk-upload-label {
          display: block;
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: 600;
        }

        .spk-upload-box {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          padding: 24px;
          border: 1.5px dashed #cbd6e6;
          border-radius: 14px;
          background: #fafcff;
          transition: border-color 0.2s, background 0.2s;
        }

        .spk-upload-box:focus-within {
          border-color: var(--spk-primary);
          background: #f5f8ff;
        }

        .spk-upload-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          flex-shrink: 0;
          border-radius: 13px;
          background: #eaf1ff;
          color: var(--spk-primary);
          font-size: 25px;
        }

        .spk-upload-content {
          min-width: 0;
          flex: 1;
        }

        .spk-upload-trigger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 10px 17px;
          border-radius: 9px;
          background: var(--spk-primary);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .spk-upload-trigger:hover {
          background: #174fce;
        }

        .spk-file-input {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          clip-path: inset(50%);
        }

        .spk-file-input:focus-visible + .spk-upload-trigger {
          outline: 3px solid #a9c3ff;
        }

        .spk-upload-hint {
          margin: 10px 0 0;
          color: var(--spk-muted);
          font-size: 12px;
        }

        .spk-selected-file {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 100%;
          margin-top: 16px;
          padding: 11px 13px;
          border: 1px solid #dce7ff;
          border-radius: 10px;
          background: #f2f6ff;
          color: #2854a3;
          font-size: 13px;
        }

        .spk-selected-file > i {
          flex-shrink: 0;
          font-size: 18px;
        }

        .spk-selected-file > span {
          min-width: 0;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .spk-remove-file {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .spk-remove-file:hover {
          background: #e0eaff;
          color: #1e40af;
        }

        .spk-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 28px;
        }

        .spk-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 46px;
          padding: 12px 22px;
          border: 1px solid transparent;
          border-radius: 11px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s,
            box-shadow 0.2s, transform 0.2s;
        }

        .spk-btn:not(:disabled):hover {
          transform: translateY(-1px);
        }

        .spk-btn:focus-visible {
          outline: 3px solid #a9c3ff;
          outline-offset: 3px;
        }

        .spk-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .spk-btn-preview {
          min-width: 135px;
          background: #647892;
          color: #fff;
        }

        .spk-btn-preview:not(:disabled):hover {
          background: #52657d;
          box-shadow: 0 4px 12px rgba(82, 101, 125, 0.18);
        }

        .spk-btn-generate {
          min-width: 170px;
          background: var(--spk-primary);
          color: #fff;
        }

        .spk-btn-generate:not(:disabled):hover {
          background: #174fce;
          box-shadow: 0 4px 14px rgba(40, 100, 237, 0.2);
        }

        .spk-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.45);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spk-spin 0.7s linear infinite;
        }

        @keyframes spk-spin {
          to { transform: rotate(360deg); }
        }

        .spk-action-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 17px 0 0;
          color: var(--spk-muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .spk-action-note i {
          margin-top: 2px;
          color: #6c8ac4;
        }

        .spk-result-section {
          margin-top: 28px;
        }

        .spk-card-header-separated {
          flex-wrap: wrap;
        }

        .spk-icon-blue {
          background: #eaf1ff;
          color: var(--spk-primary);
        }

        .spk-count-badge {
          margin-left: auto;
          padding: 7px 12px;
          border-radius: 20px;
          background: #eef4ff;
          color: #2854a3;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .spk-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .spk-table {
          width: 100%;
          margin: 0;
          border-collapse: collapse;
          font-size: 13px;
        }

        .spk-table th,
        .spk-table td {
          padding: 15px 22px;
          border-bottom: 1px solid #edf0f5;
          text-align: left;
          vertical-align: middle;
        }

        .spk-table th {
          background: #f8faff;
          color: #526176;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .spk-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .spk-table tbody tr:hover {
          background: #fafcff;
        }

        .spk-col-number {
          width: 65px;
          color: #7c8ba1;
          text-align: center !important;
        }

        .spk-col-count {
          width: 160px;
          text-align: center !important;
        }

        .spk-bidang-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 7px;
          background: #eef4ff;
          color: #2854a3;
          font-size: 12px;
          font-weight: 600;
        }

        .spk-card-footer {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 15px 22px;
          border-top: 1px solid #edf0f5;
          background: #fbfdfb;
          color: #437b56;
          font-size: 12px;
          line-height: 1.6;
        }

        .spk-success-card {
          border-color: #d7eadc;
        }

        .spk-success-header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 24px 28px;
          border-bottom: 1px solid #e8f2ea;
          background: #fbfefb;
        }

        .spk-success-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
          font-size: 25px;
        }

        .spk-success-header h4 {
          margin: 0 0 5px;
          color: #166534;
          font-size: 18px;
          font-weight: 700;
        }

        .spk-success-header p {
          margin: 0;
          color: #64816b;
          font-size: 13px;
        }

        .spk-summary-grid {
          display: grid;
          grid-template-columns: minmax(150px, 0.7fr) minmax(0, 2fr);
          gap: 16px;
          padding: 24px 28px;
        }

        .spk-summary-item {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
          padding: 18px;
          border: 1px solid #e8edf4;
          border-radius: 12px;
          background: #fff;
        }

        .spk-summary-item > span {
          color: var(--spk-muted);
          font-size: 12px;
        }

        .spk-summary-item > strong {
          color: #166534;
          font-size: 30px;
        }

        .spk-summary-folder code {
          overflow-wrap: anywhere;
          color: #34445b;
          font-size: 12px;
          line-height: 1.8;
        }

        .spk-result-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          padding: 0 28px 24px;
        }

        .spk-btn-success {
          background: #168344;
          color: #fff;
        }

        .spk-btn-success:hover {
          background: #116b36;
        }

        .spk-btn-outline {
          border-color: #d5deeb;
          background: #fff;
          color: #34445b;
        }

        .spk-btn-outline:hover {
          border-color: #aabbd5;
          background: #f8faff;
        }

        .spk-generated-files {
          margin: 0 28px 28px;
          padding-top: 22px;
          border-top: 1px solid #edf0f5;
        }

        .spk-generated-files h5 {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0 0 14px;
          font-size: 14px;
          font-weight: 700;
        }

        .spk-generated-files h5 i {
          color: var(--spk-primary);
        }

        .spk-file-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .spk-file-list li {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
          padding: 12px 14px;
          border: 1px solid #e8edf4;
          border-radius: 9px;
          background: #fbfcfe;
          font-size: 12px;
        }

        .spk-file-list li > i {
          flex-shrink: 0;
          color: #2864ed;
          font-size: 18px;
        }

        .spk-file-list li > span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .spk-page-footer {
          padding-top: 28px;
          color: #94a3b8;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .spk-page-title {
            font-size: 23px;
          }

          .spk-card-header,
          .spk-card-body {
            padding: 20px;
          }

          .spk-success-header {
            padding: 20px;
          }

          .spk-summary-grid {
            grid-template-columns: 1fr;
            padding: 20px;
          }

          .spk-result-actions {
            padding: 0 20px 20px;
          }

          .spk-generated-files {
            margin-right: 20px;
            margin-left: 20px;
          }

          .spk-table th,
          .spk-table td {
            padding: 12px 15px;
          }
        }

        @media (max-width: 480px) {
          .spk-page-header {
            gap: 12px;
          }

          .spk-page-icon {
            width: 44px;
            height: 44px;
          }

          .spk-upload-box {
            gap: 12px;
            padding: 16px;
          }

          .spk-upload-icon {
            width: 42px;
            height: 42px;
            font-size: 21px;
          }

          .spk-actions {
            gap: 12px;
          }

          .spk-actions .spk-btn {
            flex: 1 1 100%;
            width: 100%;
          }

          .spk-result-actions .spk-btn {
            width: 100%;
          }

          .spk-card-header-separated {
            gap: 10px;
          }

          .spk-count-badge {
            margin-left: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .spk-page *,
          .spk-page *::before,
          .spk-page *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </Layout>
  );
}

export default GenerateSPK;
