import { useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function GenerateSPK() {

  const [file, setFile] = useState(null);

  const [previewData, setPreviewData] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState(null);

  // ==========================
  // PREVIEW
  // ==========================

  const handlePreview = async () => {

    if (!file) {

      alert(
        "Pilih file Excel terlebih dahulu"
      );

      return;

    }

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    try {

      const response =
        await api.post(
          "/preview",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data"
            }
          }
        );

      setPreviewData(
        response.data.data
      );

    } catch (error) {

      console.error(
        error
      );

      alert(
        "Gagal melakukan preview"
      );

    }

  };

  // ==========================
  // GENERATE
  // ==========================

  const handleGenerate =
    async () => {

      if (!file) {

        alert(
          "Pilih file Excel terlebih dahulu"
        );

        return;

      }

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      try {

        setLoading(true);

        const response =
          await api.post(
            "/generate",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data"
              }
            }
          );

        setResult(
          response.data
        );

      } catch (error) {

        console.error(
          error
        );

        alert(
          "Generate gagal"
        );

      } finally {

        setLoading(false);

      }

    };

  // ==========================
  // OPEN OUTPUT FOLDER
  // ==========================

  const openFolder =
    async () => {

      try {

        await api.post(
          "/api/open-output",
          {
            folder:
              result.output_folder
          }
        );

      } catch (error) {

        console.error(
          error
        );

        alert(
          "Gagal membuka folder"
        );

      }

    };

  return (

    <Layout>

      <h2 className="mb-4">

        Generate SPK

      </h2>

      {/* Upload */}

      <div className="card shadow-sm">

        <div className="card-body">

          <input

            type="file"

            accept=".xlsx,.xls"

            className="form-control"

            onChange={(e) =>
              setFile(
                e.target.files[0]
              )
            }

          />

          <div className="mt-3">

            <button

              className="btn btn-secondary me-2"

              onClick={
                handlePreview
              }

            >

              Preview

            </button>

            <button

              className="btn btn-primary"

              onClick={
                handleGenerate
              }

              disabled={
                loading
              }

            >

              {
                loading
                  ? "Generating..."
                  : "Generate SPK"
              }

            </button>

          </div>

        </div>

      </div>

      {/* Preview */}

      {

        previewData.length > 0 && (

          <div className="card mt-4">

            <div className="card-body">

              <h5>

                Preview Data

              </h5>

              <table className="table table-striped">

                <thead>

                  <tr>

                    <th>Tanggal</th>

                    <th>Bidang</th>

                    <th>Jumlah Pegawai</th>

                  </tr>

                </thead>

                <tbody>

                  {

                    previewData.map(
                      (
                        item,
                        index
                      ) => (

                        <tr
                          key={
                            index
                          }
                        >

                          <td>
                            {
                              item[
                                "Tanggal Lembur"
                              ]
                            }
                          </td>

                          <td>
                            {
                              item[
                                "Keterangan"
                              ]
                            }
                          </td>

                          <td>
                            {
                              item[
                                "Jumlah Pegawai"
                              ]
                            }
                          </td>

                        </tr>

                      )
                    )

                  }

                </tbody>

              </table>

            </div>

          </div>

        )

      }

      {/* Result */}

      {

        result &&
        result.success && (

          <div className="card mt-4 border-success">

            <div className="card-body">

              <h4>

                ✅ Generate Berhasil

              </h4>

              <hr />

              <p>

                Total SPK Dibuat :

                <b>

                  {" "}
                  {
                    result.total_file
                  }

                </b>

              </p>

              <p>

                Folder Output:

              </p>

              <code>

                {
                  result.output_folder
                }

              </code>

              <div className="mt-3">

                <button

                  className="btn btn-success me-2"

                  onClick={
                    openFolder
                  }

                >

                  📂 Buka Folder

                </button>

                <a

                  href="/history"

                  className="btn btn-primary"

                >

                  📜 History

                </a>

              </div>

              {

                result.files &&
                result.files.length > 0 && (

                  <div className="mt-4">

                    <h5>

                      File Hasil Generate

                    </h5>

                    <ul
                      className="list-group"
                    >

                      {

                        result.files.map(
                          (
                            file,
                            index
                          ) => (

                            <li

                              key={
                                index
                              }

                              className="list-group-item"

                            >

                              {

                                file.split(
                                  "\\"
                                ).pop()

                              }

                            </li>

                          )
                        )

                      }

                    </ul>

                  </div>

                )

              }

            </div>

          </div>

        )

      }

    </Layout>

  );

}

export default GenerateSPK;