import re
import pandas as pd

from services.database_service import (
    create_tables,
    insert_spk_document
)

from config import (
    DOKUMENTASI_FILE
)


def extract_nomor_urut(nomor_spk):

    match = re.search(
        r"SPK/KP/(\d+)/",
        nomor_spk
    )

    if match:

        return int(match.group(1))

    return 0


def migrate():

    # ======================================
    # BUAT TABLE
    # ======================================

    create_tables()

    # ======================================
    # LOAD EXCEL LAMA
    # ======================================

    df = pd.read_excel(
        DOKUMENTASI_FILE
    )

    # ======================================
    # LOOP DATA
    # ======================================

    for _, row in df.iterrows():

        nomor_spk = str(
            row["Nomor SPK"]
        )

        nomor_urut = (
            extract_nomor_urut(
                nomor_spk
            )
        )

        try:

            insert_spk_document(
                nomor_spk=nomor_spk,
                nomor_urut=nomor_urut,
                tanggal=(
                    f"{row['Tahun']}-01-01"
                ),
                bidang=str(
                    row["Perihal"]
                ),
                file_path=""
            )

            print(
                f"✅ Migrated: "
                f"{nomor_spk}"
            )

        except Exception as e:

            print(
                f"⚠️ Skip: "
                f"{nomor_spk}"
            )

    print(
        "\n🎉 Migrasi selesai."
    )


if __name__ == "__main__":

    migrate()