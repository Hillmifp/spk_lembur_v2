
import { useEffect, useMemo, useState } from "react";
import Layout from "../components/layout/Layout";
import api from "../services/api";

function History() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [bidang, setBidang] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState("");
  const pageSize = 10;

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/history");
      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setHistory(data);
    } catch (err) {
      console.error("Gagal memuat riwayat SPK:", err);
      setError(
        "Data riwayat SPK gagal dimuat. Periksa koneksi backend, lalu coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  const bidangOptions = useMemo(() => {
    return [
      ...new Set(
        history
          .map((item) => item.bidang)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "id"));
  }, [history]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return history.filter((item) => {
      const nomor = String(item.nomor_spk || "").toLowerCase();
      const namaBidang = String(item.bidang || "").toLowerCase();

      const matchesSearch =
        !keyword ||
        nomor.includes(keyword) ||
        namaBidang.includes(keyword);

      const matchesBidang =
        !bidang || item.bidang === bidang;

      return matchesSearch && matchesBidang;
    });
  }, [history, search, bidang]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedData = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, bidang]);

  const downloadFile = async (nomorSpk) => {
    if (!nomorSpk || downloading) return;

    setDownloading(nomorSpk);

    try {
      const response = await api.get(
        `/api/download/${encodeURIComponent(nomorSpk)}`,
        { responseType: "blob" }
      );

      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${nomorSpk.replaceAll("/", "_")}.docx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Gagal mengunduh SPK:", err);
      window.alert(
        "File SPK gagal diunduh. Pastikan file tersedia di server."
      );
    } finally {
      setDownloading("");
    }
  };

  const resetFilter = () => {
    setSearch("");
    setBidang("");
    setPage(1);
  };

  return (
    <Layout>
      <div className="history-page">
        <style>{`
          .history-page {
            width: 100%;
            max-width: 1600px;
            margin: 0 auto;
            padding-bottom: 32px;
            color: #1e293b;
          }

          .history-page * {
            box-sizing: border-box;
          }

          .history-page .history-heading {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 24px;
          }

          .history-page .history-title {
            margin: 0;
            font-size: 27px;
            line-height: 1.3;
            font-weight: 750;
            color: #172033;
            letter-spacing: -0.5px;
          }

          .history-page .history-subtitle {
            margin: 7px 0 0;
            color: #7b879b;
            font-size: 14px;
          }

          .history-page .history-count {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 9px 14px;
            border: 1px solid #dce7fb;
            border-radius: 12px;
            background: #edf4ff;
            color: #285bc5;
            font-size: 13px;
            font-weight: 650;
            white-space: nowrap;
          }

          .history-page .history-card {
            background: #fff;
            border: 1px solid #edf0f5;
            border-radius: 18px;
            box-shadow: 0 6px 24px rgba(31, 45, 72, 0.045);
            margin-bottom: 24px;
            overflow: hidden;
          }

          .history-page .history-filter {
            padding: 24px;
          }

          .history-page .filter-grid {
            display: grid;
            grid-template-columns: minmax(240px, 1.6fr) minmax(200px, 1fr) auto;
            align-items: end;
            gap: 16px;
          }

          .history-page .filter-field {
            min-width: 0;
          }

          .history-page .filter-label {
            display: block;
            margin-bottom: 9px;
            color: #475569;
            font-size: 13px;
            font-weight: 650;
          }

          .history-page .filter-control {
            display: block;
            width: 100%;
            min-height: 46px;
            padding: 10px 14px;
            border: 1px solid #dfe5ee;
            border-radius: 10px;
            background-color: #fff;
            color: #263449;
            font-family: inherit;
            font-size: 14px;
            outline: none;
            transition: border-color .2s, box-shadow .2s;
          }

          .history-page .filter-control:focus {
            border-color: #3979f6;
            box-shadow: 0 0 0 3px rgba(57, 121, 246, .12);
          }

          .history-page .search-wrap {
            position: relative;
          }

          .history-page .search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 17px;
            color: #94a3b8;
            pointer-events: none;
          }

          .history-page .search-input {
            padding-left: 42px;
          }

          .history-page .filter-reset {
            min-height: 46px;
            padding: 0 16px;
            border: 1px solid #dfe5ee;
            border-radius: 10px;
            background: #fff;
            color: #475569;
            font-family: inherit;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background .2s, border-color .2s;
          }

          .history-page .filter-reset:hover {
            background: #f8fafc;
            border-color: #b8c7dd;
          }

          .history-page .table-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
            padding: 22px 24px;
            border-bottom: 1px solid #edf0f5;
          }

          .history-page .table-title {
            margin: 0;
            font-size: 16px;
            font-weight: 750;
            color: #172033;
          }

          .history-page .table-caption {
            margin: 5px 0 0;
            color: #8792a5;
            font-size: 12px;
          }

          .history-page .table-total {
            color: #64748b;
            font-size: 13px;
          }

          .history-page .table-scroll {
            width: 100%;
            overflow-x: auto;
          }

          .history-page .history-table {
            width: 100%;
            min-width: 720px;
            margin: 0;
            border-collapse: separate;
            border-spacing: 0;
            table-layout: auto;
          }

          .history-page .history-table thead th {
            padding: 16px 20px;
            background: #f8fafc;
            color: #64748b;
            border-bottom: 1px solid #e9eef5;
            font-size: 11px;
            font-weight: 750;
            letter-spacing: .65px;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .history-page .history-table tbody td {
            padding: 17px 20px;
            color: #344256;
            font-size: 13px;
            line-height: 1.5;
            vertical-align: middle;
            border-bottom: 1px solid #f0f2f6;
            background: #fff;
          }

          .history-page .history-table tbody tr:last-child td {
            border-bottom: 0;
          }

          .history-page .history-table tbody tr:hover td {
            background: #f8fbff;
          }

          .history-page .col-number {
            width: 65px;
            text-align: center;
            color: #94a3b8 !important;
          }

          .history-page .col-date {
            white-space: nowrap;
            min-width: 130px;
          }

          .history-page .spk-number {
            display: inline-block;
            color: #285bc5;
            font-weight: 700;
            white-space: nowrap;
            letter-spacing: .1px;
          }

          .history-page .field-badge {
            display: inline-block;
            max-width: 260px;
            padding: 6px 10px;
            overflow-wrap: anywhere;
            border-radius: 7px;
            background: #f1f5f9;
            color: #526176;
            font-size: 12px;
            font-weight: 600;
          }

          .history-page .col-action {
            width: 145px;
            text-align: center;
            white-space: nowrap;
          }

          .history-page .download-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 36px;
            padding: 8px 13px;
            border: 0;
            border-radius: 9px;
            background: #16a765;
            color: #fff;
            font-family: inherit;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: background .2s, transform .2s;
          }

          .history-page .download-btn:hover:not(:disabled) {
            background: #128653;
            transform: translateY(-1px);
          }

          .history-page .download-btn:disabled {
            opacity: .65;
            cursor: wait;
          }

          .history-page .empty-state {
            padding: 54px 20px !important;
            text-align: center;
          }

          .history-page .empty-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 54px;
            height: 54px;
            margin: 0 auto 14px;
            border-radius: 16px;
            background: #f1f5f9;
            color: #64748b;
            font-size: 25px;
          }

          .history-page .empty-title {
            margin: 0 0 6px;
            color: #334155;
            font-size: 15px;
            font-weight: 700;
          }

          .history-page .empty-description {
            margin: 0;
            color: #94a3b8;
            font-size: 13px;
          }

          .history-page .alert-error {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding: 16px 18px;
            border: 1px solid #fecaca;
            border-radius: 12px;
            background: #fff1f2;
            color: #b91c1c;
            font-size: 13px;
          }

          .history-page .retry-btn {
            padding: 7px 12px;
            border: 1px solid #fca5a5;
            border-radius: 8px;
            background: #fff;
            color: #b91c1c;
            font-weight: 650;
            cursor: pointer;
          }

          .history-page .pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
            padding: 18px 24px;
            border-top: 1px solid #edf0f5;
          }

          .history-page .pagination-info {
            color: #8792a5;
            font-size: 12px;
          }

          .history-page .pagination-actions {
            display: flex;
            gap: 6px;
            align-items: center;
          }

          .history-page .page-btn {
            min-width: 36px;
            height: 36px;
            padding: 0 10px;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            background: #fff;
            color: #475569;
            font-family: inherit;
            font-size: 12px;
            font-weight: 650;
            cursor: pointer;
          }

          .history-page .page-btn.active {
            border-color: #3979f6;
            background: #3979f6;
            color: #fff;
          }

          .history-page .page-btn:disabled {
            opacity: .4;
            cursor: not-allowed;
          }

          .history-page .loading-state {
            padding: 52px 20px;
            text-align: center;
            color: #64748b;
            font-size: 13px;
          }

          .history-page .loading-spinner {
            display: inline-block;
            width: 23px;
            height: 23px;
            margin-bottom: 12px;
            border: 3px solid #dbeafe;
            border-top-color: #3979f6;
            border-radius: 50%;
            animation: history-spin .75s linear infinite;
          }

          @keyframes history-spin {
            to { transform: rotate(360deg); }
          }

          @media (max-width: 900px) {
            .history-page .filter-grid {
              grid-template-columns: 1fr 1fr;
            }

            .history-page .filter-reset {
              grid-column: 1 / -1;
            }
          }

          @media (max-width: 600px) {
            .history-page .history-title {
              font-size: 23px;
            }

            .history-page .history-filter {
              padding: 18px;
            }

            .history-page .filter-grid {
              grid-template-columns: 1fr;
              gap: 14px;
            }

            .history-page .filter-reset {
              grid-column: auto;
            }

            .history-page .table-card-header {
              padding: 18px;
            }

            .history-page .pagination {
              padding: 16px 18px;
            }
          }
        `}</style>

        <div className="history-heading">
          <div>
            <h1 className="history-title">Riwayat SPK</h1>
            <p className="history-subtitle">
              Kelola, cari, dan unduh dokumen SPK yang telah dibuat.
            </p>
          </div>

          <div className="history-count">
            <span>▤</span>
            {history.length} Dokumen SPK
          </div>
        </div>

        {error && (
          <div className="alert-error">
            <span>{error}</span>
            <button
              type="button"
              className="retry-btn"
              onClick={loadHistory}
            >
              Coba Lagi
            </button>
          </div>
        )}

        <section className="history-card">
          <div className="history-filter">
            <div className="filter-grid">
              <div className="filter-field">
                <label
                  className="filter-label"
                  htmlFor="history-search"
                >
                  Cari Dokumen
                </label>

                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input
                    id="history-search"
                    type="text"
                    className="filter-control search-input"
                    placeholder="Cari nomor SPK atau bidang..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-field">
                <label
                  className="filter-label"
                  htmlFor="history-bidang"
                >
                  Filter Bidang
                </label>

                <select
                  id="history-bidang"
                  className="filter-control"
                  value={bidang}
                  onChange={(e) => setBidang(e.target.value)}
                >
                  <option value="">Semua Bidang</option>
                  {bidangOptions.map((item) => (
                    <option key={item} value={item}>
                      {item.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="filter-reset"
                onClick={resetFilter}
              >
                ↺ Reset Filter
              </button>
            </div>
          </div>
        </section>

        <section className="history-card">
          <div className="table-card-header">
            <div>
              <h2 className="table-title">Daftar Dokumen SPK</h2>
              <p className="table-caption">
                Riwayat dokumen berdasarkan data yang tersimpan.
              </p>
            </div>

            <span className="table-total">
              {filtered.length} data ditemukan
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <div>Memuat riwayat SPK...</div>
            </div>
          ) : (
            <>
              <div className="table-scroll">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th className="col-number">No.</th>
                      <th>Nomor SPK</th>
                      <th className="col-date">Tanggal</th>
                      <th>Bidang</th>
                      <th className="col-action">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item, index) => (
                        <tr
                          key={
                            item.id ??
                            `${item.nomor_spk}-${item.tanggal}-${index}`
                          }
                        >
                          <td className="col-number">
                            {(currentPage - 1) * pageSize + index + 1}
                          </td>

                          <td>
                            <span className="spk-number">
                              {item.nomor_spk || "-"}
                            </span>
                          </td>

                          <td className="col-date">
                            {item.tanggal || "-"}
                          </td>

                          <td>
                            <span className="field-badge">
                              {String(item.bidang || "-").replaceAll(
                                "_",
                                " "
                              )}
                            </span>
                          </td>

                          <td className="col-action">
                            <button
                              type="button"
                              className="download-btn"
                              disabled={Boolean(downloading)}
                              onClick={() =>
                                downloadFile(item.nomor_spk)
                              }
                            >
                              <span>↓</span>
                              {downloading === item.nomor_spk
                                ? "Mengunduh..."
                                : "Download"}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          <div className="empty-icon">⌕</div>
                          <p className="empty-title">
                            {history.length === 0
                              ? "Belum Ada Riwayat SPK"
                              : "Dokumen Tidak Ditemukan"}
                          </p>
                          <p className="empty-description">
                            {history.length === 0
                              ? "Dokumen SPK yang dibuat akan muncul di halaman ini."
                              : "Coba ubah kata kunci atau reset filter pencarian."}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filtered.length > 0 && (
                <div className="pagination">
                  <span className="pagination-info">
                    Menampilkan{" "}
                    {(currentPage - 1) * pageSize + 1}
                    {"–"}
                    {Math.min(
                      currentPage * pageSize,
                      filtered.length
                    )}{" "}
                    dari {filtered.length} dokumen
                  </span>

                  <div className="pagination-actions">
                    <button
                      type="button"
                      className="page-btn"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setPage((p) => Math.max(1, p - 1))
                      }
                    >
                      ←
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, i) => i + 1
                    )
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1
                      )
                      .map((p, i, arr) => (
                        <span
                          key={p}
                          style={{
                            display: "contents",
                          }}
                        >
                          {i > 0 && arr[i - 1] !== p - 1 && (
                            <span
                              style={{
                                color: "#94a3b8",
                                padding: "0 2px",
                              }}
                            >
                              …
                            </span>
                          )}

                          <button
                            type="button"
                            className={`page-btn ${
                              currentPage === p ? "active" : ""
                            }`}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>
                        </span>
                      ))}

                    <button
                      type="button"
                      className="page-btn"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setPage((p) =>
                          Math.min(totalPages, p + 1)
                        )
                      }
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default History;
