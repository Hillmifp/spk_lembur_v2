import pandas as pd


def generate_preview(file_path):

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
    # FORMAT TANGGAL
    # ======================================

    df["Tanggal Lembur"] = (
        df["Tanggal Lembur"]
        .ffill()
    )

    # ======================================
    # GROUPING
    # ======================================

    grouped = (
        df.groupby([
            "Tanggal Lembur",
            "Keterangan"
        ])
        .size()
        .reset_index(
            name="Jumlah Pegawai"
        )
    )

    # ======================================
    # SORT
    # ======================================

    grouped = grouped.sort_values(
        by=[
        "Keterangan",
        "Tanggal Lembur"
        ],
        ascending=True
    )

    # ======================================
    # RETURN
    # ======================================

    return grouped.to_dict(
        orient="records"
    )