import os
import pandas as pd

from datetime import datetime

from config import (
    TEMPLATE_PATH,
    OUTPUT_DIR
)

from services.template_service import (
    load_template,
    replace_placeholders
)

from services.numbering_service import (
    get_or_create_number
)

from services.database_service import (
    insert_spk_document,
    get_spk_by_date_and_bidang
)

from services.dokumentasi_service import (
    save_dokumentasi
)

from utils.validator import (
    validate_columns
)

from utils.table_style import (
    style_cell
)

from utils.formatter import (
    format_tanggal_indonesia,
    get_nama_bulan,
    get_nama_hari
)

from utils.time_formatter import (
    format_jam
)


def generate_all_spk(file_path):

    # ======================================
    # LOAD EXCEL
    # ======================================

    df = pd.read_excel(file_path)

    # ======================================
    # HAPUS UNNAMED
    # ======================================

    df = df.loc[
        :,
        ~df.columns.str.contains("^Unnamed")
    ]

    # ======================================
    # VALIDASI
    # ======================================

    validate_columns(df)

    # ======================================
    # FORMAT TANGGAL
    # ======================================

    df["Tanggal Lembur"] = (
        df["Tanggal Lembur"]
        .ffill()
    )

    df["Tanggal Lembur"] = pd.to_datetime(
        df["Tanggal Lembur"],
        dayfirst=True,
        errors="coerce"
    ).dt.date

    # ======================================
    # VALIDASI TANGGAL
    # ======================================

    if df["Tanggal Lembur"].isna().any():

        print("\n❌ Ada tanggal tidak valid:")

        print(
            df[
                df["Tanggal Lembur"].isna()
            ]
        )

        return []

    # ======================================
    # SORT DATA
    # ======================================

    df = df.sort_values(
        by=[
            "Keterangan",
            "Tanggal Lembur"
        ],
        ascending=True
    )

    # ======================================
    # GROUPING
    # ======================================

    grouped = df.groupby([
        "Tanggal Lembur",
        "Keterangan"
    ])

    # ======================================
    # DOKUMENTASI
    # ======================================

    dokumentasi_data = []

    # ======================================
    # GENERATED FILES
    # ======================================

    generated_files = []

    # ======================================
    # LOOP GENERATE
    # ======================================

    for (tanggal, bidang), group in grouped:

        # ==================================
        # CLEAN BIDANG
        # ==================================

        bidang_clean = (
            str(bidang)
            .replace(" ", "_")
            .replace("/", "_")
        )

        # ==================================
        # KEGIATAN
        # ==================================

        kegiatan = str(
            group.iloc[0][
                "Keterangan Lembur"
            ]
        ).strip()

        # ==================================
        # CEK DATABASE
        # ==================================

        existing_spk = (
            get_spk_by_date_and_bidang(
                tanggal,
                bidang_clean
            )
        )

        # ==================================
        # JIKA REVISI
        # ==================================

        if existing_spk:

            nomor_full = existing_spk[0]

            nomor = existing_spk[1]

            nomor_str = str(
                nomor
            ).zfill(5)

            print(
                f"♻️ Revisi detected: "
                f"{nomor_full}"
            )

        # ==================================
        # JIKA BARU
        # ==================================

        else:

            nomor = get_or_create_number(
                tanggal,
                bidang_clean,
                kegiatan
            )

            nomor_str = str(
                nomor
            ).zfill(5)

            nomor_full = (
                f"SPK/KP/"
                f"{nomor_str}/"
                f"{tanggal.month:02d}/"
                f"{tanggal.year}/81"
            )

        # ==================================
        # FORMAT TANGGAL
        # ======================================

        tanggal_dt = datetime.combine(
            tanggal,
            datetime.min.time()
        )

        tanggal_indo = (
            format_tanggal_indonesia(
                tanggal_dt
            )
        )

        # ==================================
        # LOAD TEMPLATE
        # ==================================

        doc = load_template(
            TEMPLATE_PATH
        )

        # ==================================
        # REPLACE PLACEHOLDER
        # ==================================

        replace_placeholders(doc, {

            "{{NOMOR_SPK}}":
            nomor_full,

            "{{TANGGAL}}":
            tanggal_indo,

            "{{JAKARTA_TANGGAL}}":
            tanggal_indo

        })

        # ==================================
        # ISI TABEL
        # ==================================

        for table in doc.tables:

            if (
                table.cell(0, 0)
                .text
                .strip()
                .lower()
                == "no"
            ):

                # ==========================
                # HAPUS ROW TEMPLATE
                # ==========================

                while len(table.rows) > 1:

                    table._tbl.remove(
                        table.rows[1]._tr
                    )

                # ==========================
                # TAMBAH ROW
                # ==========================

                for i, (_, row) in enumerate(
                    group.iterrows(),
                    start=1
                ):

                    row_cells = (
                        table.add_row().cells
                    )

                    data = [

                        str(i),

                        str(row["Nama"]),

                        str(row["NIP"]),

                        tanggal.strftime(
                            "%d-%m-%Y"
                        ),

                        format_jam(
                            row["Jam Mulai"]
                        ),

                        format_jam(
                            row["Jam Selesai"]
                        ),

                        str(
                            row[
                                "Keterangan Lembur"
                            ]
                        )
                    ]

                    for idx, value in enumerate(
                        data
                    ):

                        row_cells[
                            idx
                        ].text = value

                        style_cell(
                            row_cells[idx],
                            center=(
                                idx < 6
                            )
                        )

        # ==================================
        # FOLDER TAHUN
        # ==================================

        folder_tahun = (
            OUTPUT_DIR /
            str(tanggal.year)
        )

        folder_tahun.mkdir(
            parents=True,
            exist_ok=True
        )

        # ==================================
        # FOLDER BULAN
        # ==================================

        folder_bulan = (
            folder_tahun /
            get_nama_bulan(
                tanggal_dt
            )
        )

        folder_bulan.mkdir(
            parents=True,
            exist_ok=True
        )

        # ==================================
        # OUTPUT FILE
        # ==================================

        output_path = (
            folder_bulan /
            (
                f"SPK_KP_"
                f"{nomor_str}_"
                f"{tanggal.month:02d}_"
                f"{tanggal.year}_81_"
                f"{bidang_clean}_"
                f"{tanggal}.docx"
            )
        )

        # ==================================
        # OVERWRITE FILE
        # ==================================

        if os.path.exists(
            output_path
        ):

            os.remove(
                output_path
            )

        # ==================================
        # SAVE DOCX
        # ==================================

        doc.save(
            output_path
        )

        # ==================================
        # GENERATED FILES
        # ==================================

        generated_files.append(
            str(output_path)
        )

        print(
            f"✅ SPK berhasil dibuat: "
            f"{output_path}"
        )

        # ==================================
        # INSERT DATABASE
        # ==================================

        if not existing_spk:

            insert_spk_document(

                nomor_spk=nomor_full,

                nomor_urut=nomor,

                tanggal=str(
                    tanggal
                ),

                bidang=bidang_clean,

                file_path=output_path

            )

        # ==================================
        # DOKUMENTASI
        # ==================================

        dokumentasi_data.append({

            "Hari": get_nama_hari(
                tanggal_dt
            ),

            "Tanggal": tanggal.day,

            "Bulan": get_nama_bulan(
                tanggal_dt
            ),

            "Tahun": tanggal.year,

            "Nomor SPK": nomor_full,

            "Perihal": (
                f"Surat Perintah "
                f"Kerja Lembur "
                f"Bidang {bidang}"
            )
        })

    # ======================================
    # SAVE DOKUMENTASI
    # ======================================

    save_dokumentasi(
        dokumentasi_data
    )

    # ======================================
    # DONE
    # ======================================

    print(
        "\n🎉 Semua SPK berhasil dibuat."
    )

    return generated_files