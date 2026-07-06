REQUIRED_COLUMNS = [
    "Nama",
    "NIP",
    "Tanggal Lembur",
    "Jam Mulai",
    "Jam Selesai",
    "Keterangan Lembur",
    "Keterangan"
]


def validate_columns(df):

    for col in REQUIRED_COLUMNS:

        if col not in df.columns:

            raise ValueError(
                f"Kolom '{col}' tidak ditemukan."
            )