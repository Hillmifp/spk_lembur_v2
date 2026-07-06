import pandas as pd
from config import DOKUMENTASI_FILE


def save_dokumentasi(data):

    df_baru = pd.DataFrame(data)

    try:

        existing = pd.read_excel(
            DOKUMENTASI_FILE
        )

    except:

        existing = pd.DataFrame()

    final = pd.concat([
        existing,
        df_baru
    ])

    final = final.drop_duplicates(
        subset=["Nomor SPK"],
        keep="last"
    )

    final.to_excel(
        DOKUMENTASI_FILE,
        index=False
    )