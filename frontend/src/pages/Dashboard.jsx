import {
  useEffect,
  useState
} from "react";

import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import api from "../services/api";

import {
  FaFileAlt,
  FaCalendarAlt,
  FaUsers,
  FaHashtag
} from "react-icons/fa";

function Dashboard() {

  const [data, setData] =
    useState({

      total_spk: 0,

      spk_bulan_ini: 0,

      bidang_terbanyak: "-",

      nomor_terakhir: "-"

    });

  // ==========================
  // LOAD DASHBOARD
  // ==========================

  useEffect(() => {

    loadDashboard();

  }, []);

  const loadDashboard =
    async () => {

      try {

        const response =
          await api.get(
            "/api/dashboard"
          );

        setData(
          response.data
        );

      } catch (error) {

        console.error(
          "Gagal load dashboard:",
          error
        );

      }

    };

  return (

    <Layout>

      {/* HEADER */}

      <div className="page-header">

        <h2>

          Dashboard

        </h2>

        <p
          style={{
            color: "#6b7280"
          }}
        >

          Sistem Manajemen SPK Lembur

        </p>

      </div>

      {/* CARD STATISTIK */}

      <div className="stats-grid">

        <StatCard

          title="Total SPK"

          value={
            data.total_spk
          }

          icon={
            <FaFileAlt />
          }

        />

        <StatCard

          title="SPK Bulan Ini"

          value={
            data.spk_bulan_ini
          }

          icon={
            <FaCalendarAlt />
          }

        />

        <StatCard

          title="Bidang Terbanyak"

          value={
            data.bidang_terbanyak
          }

          icon={
            <FaUsers />
          }

        />

        {/* CARD NOMOR TERAKHIR */}

        <div className="stat-card">

          <div
            style={{
              flex: 1
            }}
          >

            <p className="stat-title">

              Nomor Terakhir

            </p>

            <div
              className="nomor-spk"
            >

              {
                data.nomor_terakhir
              }

            </div>

          </div>

          <div className="stat-icon">

            <FaHashtag />

          </div>

        </div>

      </div>

      {/* WELCOME PANEL */}

      <div
        className="dashboard-welcome"
      >

        <h4>

          Selamat Datang

        </h4>

        <p>

          Aplikasi ini digunakan untuk
          menghasilkan Surat Perintah Kerja
          (SPK) Lembur secara otomatis,
          mengelola histori SPK,
          serta memantau statistik penerbitan
          SPK berdasarkan data lembur yang
          diunggah melalui file Excel.

        </p>

      </div>

    </Layout>

  );

}

export default Dashboard;