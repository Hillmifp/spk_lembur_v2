
import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import api from "../services/api";

function Statistik() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================
  // AMBIL DATA STATISTIK DARI BACKEND
  // =====================================

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Mengambil data statistik SPK...");

      // Sesuai pola endpoint riwayat: /api/history
      const response = await api.get("/api/stats");

      console.log("Data statistik:", response.data);

      setStats(response.data);
    } catch (err) {
      console.error(
        "Gagal mengambil statistik:",
        err.response?.status,
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Gagal mengambil data statistik. Periksa endpoint backend Flask."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // =====================================
  // FORMAT ANGKA
  // =====================================

  const formatNumber = (value) =>
    new Intl.NumberFormat("id-ID").format(
      Number(value) || 0
    );

  // =====================================
  // NORMALISASI DATA DARI API
  // =====================================

  const getArray = (...values) =>
    values.find((value) => Array.isArray(value)) || [];

  const monthlyData = getArray(
    stats?.per_bulan,
    stats?.monthly,
    stats?.monthly_stats,
    stats?.statistik_bulanan
  );

  const bidangData = getArray(
    stats?.per_bidang,
    stats?.by_bidang,
    stats?.bidang_stats,
    stats?.statistik_bidang
  );

  const getMonthLabel = (item) =>
    item.bulan ??
    item.month ??
    item.label ??
    item.periode ??
    "-";

  const getMonthValue = (item) =>
    Number(
      item.jumlah ??
      item.total ??
      item.count ??
      item.total_spk ??
      0
    );

  const getBidangLabel = (item) =>
    item.bidang ??
    item.keterangan ??
    item.nama_bidang ??
    item.nama ??
    "-";

  const getBidangValue = (item) =>
    Number(
      item.jumlah ??
      item.total ??
      item.count ??
      item.total_spk ??
      0
    );

  // =====================================
  // RINGKASAN STATISTIK
  // =====================================

  const totalSPK = Number(
    stats?.total_spk ??
    stats?.total ??
    stats?.total_file ??
    stats?.jumlah_spk ??
    0
  );

  const totalBidang =
    stats?.total_bidang != null
      ? Number(stats.total_bidang)
      : new Set(bidangData.map(getBidangLabel)).size;

  // Nomor terakhir harus disediakan backend.
  const nomorTerakhir =
    stats?.nomor_terakhir ??
    stats?.nomor_terakhir_spk ??
    stats?.last_number ??
    stats?.latest_spk?.nomor_spk ??
    stats?.latest?.nomor_spk ??
    "-";

  const maxMonthly = Math.max(
    1,
    ...monthlyData.map(getMonthValue)
  );

  const maxBidang = Math.max(
    1,
    ...bidangData.map(getBidangValue)
  );

  // =====================================
  // TAMPILAN
  // =====================================

  return (
    <Layout>
      <div className="statistics-page">
        {/* HEADER */}
        <div className="statistics-header">
          <div>
            <h2>Statistik SPK</h2>
            <p>
              Ringkasan dan analisis dokumen SPK Lembur.
            </p>
          </div>

          <button
            type="button"
            className="statistics-refresh"
            onClick={loadStats}
            disabled={loading}
          >
            <span className="refresh-icon">↻</span>
            {loading ? "Memuat..." : "Refresh Data"}
          </button>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="statistics-message">
            <div className="statistics-spinner" />
            <p>Memuat data statistik...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="statistics-error">
            <div className="error-title">
              Data statistik belum tersedia
            </div>

            <p>{error}</p>

            <button
              type="button"
              onClick={loadStats}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* DATA STATISTIK */}
        {!loading && !error && stats && (
          <>
            {/* KARTU RINGKASAN */}
            <div className="statistics-summary">
              <div className="statistics-card">
                <div className="statistics-card-top">
                  <span>Total SPK</span>

                  <div className="statistics-icon icon-blue">
                    <span>▤</span>
                  </div>
                </div>

                <strong className="statistics-number">
                  {formatNumber(totalSPK)}
                </strong>

                <p>
                  Jumlah dokumen SPK tercatat.
                </p>
              </div>

              <div className="statistics-card">
                <div className="statistics-card-top">
                  <span>Total Bidang</span>

                  <div className="statistics-icon icon-purple">
                    <span>▦</span>
                  </div>
                </div>

                <strong className="statistics-number">
                  {formatNumber(totalBidang)}
                </strong>

                <p>
                  Jumlah bidang dalam rekap statistik.
                </p>
              </div>

              <div className="statistics-card">
                <div className="statistics-card-top">
                  <span>Nomor Terakhir</span>

                  <div className="statistics-icon icon-gray">
                    <span>#</span>
                  </div>
                </div>

                <strong className="statistics-last-number">
                  {nomorTerakhir}
                </strong>

                <p>
                  Nomor SPK terakhir yang dikirim backend.
                </p>
              </div>
            </div>

            {/* GRAFIK BULANAN */}
            <section className="statistics-panel">
              <div className="statistics-panel-header">
                <div>
                  <h3>Jumlah SPK per Bulan</h3>
                  <p>
                    Distribusi dokumen berdasarkan bulan.
                  </p>
                </div>
              </div>

              {monthlyData.length > 0 ? (
                <div className="monthly-chart">
                  {monthlyData.map((item, index) => {
                    const value = getMonthValue(item);

                    const height =
                      value > 0
                        ? Math.max(
                            8,
                            (value / maxMonthly) * 180
                          )
                        : 2;

                    return (
                      <div
                        className="monthly-chart-item"
                        key={`${getMonthLabel(item)}-${index}`}
                      >
                        <span className="monthly-chart-value">
                          {formatNumber(value)}
                        </span>

                        <div className="monthly-bar-area">
                          <div
                            className="monthly-bar"
                            style={{
                              height: `${height}px`,
                            }}
                            title={`${getMonthLabel(item)}: ${value} SPK`}
                          />
                        </div>

                        <span className="monthly-chart-label">
                          {getMonthLabel(item)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="statistics-empty">
                  Belum ada data statistik bulanan dari API.
                </div>
              )}
            </section>

            {/* REKAP BIDANG */}
            <section className="statistics-panel">
              <div className="statistics-panel-header">
                <div>
                  <h3>Rekap Berdasarkan Bidang</h3>
                  <p>
                    Jumlah dokumen SPK untuk setiap bidang.
                  </p>
                </div>
              </div>

              {bidangData.length > 0 ? (
                <div className="bidang-chart">
                  {bidangData.map((item, index) => {
                    const value = getBidangValue(item);

                    const percentage = Math.min(
                      100,
                      (value / maxBidang) * 100
                    );

                    return (
                      <div
                        className="bidang-chart-item"
                        key={`${getBidangLabel(item)}-${index}`}
                      >
                        <div className="bidang-chart-info">
                          <span>
                            {getBidangLabel(item)}
                          </span>

                          <strong>
                            {formatNumber(value)} SPK
                          </strong>
                        </div>

                        <div className="bidang-progress-track">
                          <div
                            className="bidang-progress-bar"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="statistics-empty">
                  Belum ada data statistik bidang dari API.
                </div>
              )}
            </section>
          </>
        )}

        {/* CSS HALAMAN STATISTIK */}
        <style>{`
          .statistics-page {
            width: 100%;
            min-width: 0;
            padding-bottom: 32px;
            color: #1f2937;
          }

          .statistics-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 28px;
          }

          .statistics-header h2 {
            margin: 0 0 8px;
            font-size: 27px;
            font-weight: 700;
          }

          .statistics-header p {
            margin: 0;
            color: #8290a5;
            font-size: 13px;
          }

          .statistics-refresh {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 42px;
            padding: 10px 16px;
            border: 1px solid #dce5f2;
            border-radius: 10px;
            background: white;
            color: #34445b;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }

          .statistics-refresh:hover {
            background: #f5f8ff;
          }

          .statistics-refresh:disabled {
            opacity: 0.6;
            cursor: wait;
          }

          .refresh-icon {
            font-size: 19px;
          }

          .statistics-summary {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 22px;
            margin-bottom: 28px;
          }

          .statistics-card {
            min-width: 0;
            padding: 24px;
            border: 1px solid #edf0f5;
            border-radius: 17px;
            background: #fff;
            box-shadow: 0 7px 25px rgba(31, 45, 61, 0.04);
          }

          .statistics-card-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 18px;
            color: #7c8799;
            font-size: 14px;
          }

          .statistics-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 42px;
            height: 42px;
            flex-shrink: 0;
            border-radius: 12px;
            font-size: 23px;
            font-weight: 700;
          }

          .icon-blue {
            color: #2864ed;
            background: #eaf1ff;
          }

          .icon-purple {
            color: #805ad5;
            background: #f0eaff;
          }

          .icon-gray {
            color: #64748b;
            background: #f1f5f9;
          }

          .statistics-number {
            display: block;
            color: #344054;
            font-size: 30px;
            font-weight: 700;
            line-height: 1.4;
          }

          .statistics-last-number {
            display: block;
            overflow-wrap: anywhere;
            color: #344054;
            font-size: clamp(14px, 1.15vw, 20px);
            font-weight: 700;
            line-height: 1.7;
          }

          .statistics-card > p {
            margin: 10px 0 0;
            color: #94a3b8;
            font-size: 12px;
            line-height: 1.6;
          }

          .statistics-panel {
            margin-bottom: 28px;
            overflow: hidden;
            border: 1px solid #edf0f5;
            border-radius: 17px;
            background: #fff;
            box-shadow: 0 7px 25px rgba(31, 45, 61, 0.04);
          }

          .statistics-panel-header {
            padding: 24px 26px;
            border-bottom: 1px solid #edf0f5;
          }

          .statistics-panel-header h3 {
            margin: 0 0 7px;
            font-size: 17px;
            font-weight: 700;
          }

          .statistics-panel-header p {
            margin: 0;
            color: #8290a5;
            font-size: 13px;
          }

          .monthly-chart {
            display: flex;
            align-items: flex-end;
            gap: 18px;
            min-height: 280px;
            padding: 28px 26px 22px;
            overflow-x: auto;
          }

          .monthly-chart-item {
            display: flex;
            flex: 1 0 55px;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            min-width: 55px;
            gap: 10px;
          }

          .monthly-chart-value {
            color: #64748b;
            font-size: 12px;
            font-weight: 600;
          }

          .monthly-bar-area {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            width: 100%;
            height: 185px;
            border-bottom: 1px solid #e5eaf2;
            background-image: linear-gradient(
              to top,
              #f8faff 1px,
              transparent 1px
            );
            background-size: 100% 46px;
          }

          .monthly-bar {
            width: min(42px, 75%);
            min-height: 2px;
            border-radius: 7px 7px 0 0;
            background: linear-gradient(
              180deg,
              #5b8cff,
              #2864ed
            );
            transition: height 0.25s ease;
          }

          .monthly-chart-label {
            color: #64748b;
            font-size: 12px;
            text-align: center;
            white-space: nowrap;
          }

          .bidang-chart {
            display: flex;
            flex-direction: column;
            gap: 22px;
            padding: 26px;
          }

          .bidang-chart-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 10px;
            font-size: 13px;
          }

          .bidang-chart-info > span {
            color: #475569;
            overflow-wrap: anywhere;
          }

          .bidang-chart-info > strong {
            flex-shrink: 0;
            color: #344054;
          }

          .bidang-progress-track {
            width: 100%;
            height: 9px;
            overflow: hidden;
            border-radius: 20px;
            background: #edf2f9;
          }

          .bidang-progress-bar {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(
              90deg,
              #2864ed,
              #75a0ff
            );
            transition: width 0.25s ease;
          }

          .statistics-message,
          .statistics-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            min-height: 140px;
            padding: 24px;
            color: #94a3b8;
            font-size: 13px;
            text-align: center;
          }

          .statistics-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid #e5eaf2;
            border-top-color: #2864ed;
            border-radius: 50%;
            animation: statistics-spin 0.8s linear infinite;
          }

          .statistics-message p {
            margin: 0;
          }

          @keyframes statistics-spin {
            to {
              transform: rotate(360deg);
            }
          }

          .statistics-error {
            margin-bottom: 24px;
            padding: 20px;
            border: 1px solid #fecaca;
            border-radius: 12px;
            background: #fff7f7;
            color: #991b1b;
          }

          .statistics-error .error-title {
            font-weight: 700;
          }

          .statistics-error p {
            margin: 8px 0 14px;
            font-size: 13px;
            line-height: 1.6;
          }

          .statistics-error button {
            padding: 9px 14px;
            border: 0;
            border-radius: 8px;
            background: #b91c1c;
            color: white;
            font-weight: 600;
            cursor: pointer;
          }

          @media (max-width: 1000px) {
            .statistics-summary {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 600px) {
            .statistics-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .statistics-header h2 {
              font-size: 23px;
            }

            .statistics-summary {
              grid-template-columns: 1fr;
              gap: 14px;
            }

            .statistics-card {
              padding: 20px;
            }

            .statistics-panel-header {
              padding: 20px;
            }

            .monthly-chart,
            .bidang-chart {
              padding: 20px;
            }

            .statistics-last-number {
              font-size: 16px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .statistics-page *,
            .statistics-page *::before,
            .statistics-page *::after {
              animation-duration: 0.01ms !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}

export default Statistik;
