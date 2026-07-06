import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function History() {

  const [history, setHistory] =
    useState([]);

  const [filtered, setFiltered] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [bidang, setBidang] =
    useState("");

  // =====================
  // LOAD DATA
  // =====================

  useEffect(() => {

    loadHistory();

  }, []);

  const loadHistory = async () => {

    try {

      const response =
        await api.get(
          "/api/history"
        );

      setHistory(
        response.data
      );

      setFiltered(
        response.data
      );

    } catch (error) {

      console.error(
        error
      );

    }

  };

  // =====================
  // FILTER
  // =====================

  useEffect(() => {

    let data = [...history];

    if (search) {

      data = data.filter(
        (item) =>
          item.nomor_spk
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );

    }

    if (bidang) {

      data = data.filter(
        (item) =>
          item.bidang === bidang
      );

    }

    setFiltered(
      data
    );

  }, [
    search,
    bidang,
    history
  ]);

  // =====================
  // DOWNLOAD
  // =====================

  const downloadFile =
    (nomor_spk) => {

      window.open(

        `http://localhost:5000/api/download/${encodeURIComponent(
          nomor_spk
        )}`,

        "_blank"

      );

    };

  const bidangOptions = [

    ...new Set(

      history.map(
        (item) =>
          item.bidang
      )

    )

  ];

  return (

    <Layout>

      <h2 className="mb-4">

        History SPK

      </h2>

      {/* Filter */}

      <div className="card mb-4">

        <div className="card-body">

          <div className="row">

            <div className="col-md-6">

              <input

                type="text"

                className="form-control"

                placeholder="Cari Nomor SPK..."

                value={search}

                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }

              />

            </div>

            <div className="col-md-4">

              <select

                className="form-select"

                value={bidang}

                onChange={(e) =>
                  setBidang(
                    e.target.value
                  )
                }

              >

                <option value="">

                  Semua Bidang

                </option>

                {

                  bidangOptions.map(
                    (item) => (

                      <option
                        key={item}
                        value={item}
                      >

                        {item}

                      </option>

                    )
                  )

                }

              </select>

            </div>

          </div>

        </div>

      </div>

      {/* Table */}

      <div className="card">

        <div className="card-body">

          <table className="table table-striped">

            <thead>

              <tr>

                <th>No</th>

                <th>Nomor SPK</th>

                <th>Tanggal</th>

                <th>Bidang</th>

                <th>Aksi</th>

              </tr>

            </thead>

            <tbody>

              {

                filtered.map(
                  (
                    item,
                    index
                  ) => (

                    <tr
                      key={index}
                    >

                      <td>

                        {index + 1}

                      </td>

                      <td>

                        {item.nomor_spk}

                      </td>

                      <td>

                        {item.tanggal}

                      </td>

                      <td>

                        {item.bidang}

                      </td>

                      <td>

                        <button

                          className="btn btn-success btn-sm"

                          onClick={() =>
                            downloadFile(
                              item.nomor_spk
                            )
                          }

                        >

                          ⬇ Download

                        </button>

                      </td>

                    </tr>

                  )
                )

              }

            </tbody>

          </table>

        </div>

      </div>

    </Layout>

  );

}

export default History;