import pandas as pd


def format_jam(value):

    # ======================================
    # HANDLE NULL / KOSONG
    # ======================================

    if pd.isna(value):

        return ""

    # ======================================
    # HANDLE STRING
    # ======================================

    if isinstance(value, str):

        value = value.strip()

        # Kalau sudah format jam
        # contoh: 19:24
        if ":" in value:

            return value

        # Kalau format decimal string
        # contoh: "17.00"
        try:

            return f"{float(value):.2f}"

        except:

            return value

    # ======================================
    # HANDLE ANGKA
    # ======================================

    if isinstance(value, (int, float)):

        return f"{float(value):.2f}"

    # ======================================
    # FALLBACK
    # ======================================

    return str(value)