import sqlite3

from config import DATABASE_PATH


# ==========================================
# GET CONNECTION
# ==========================================

def get_connection():

    return sqlite3.connect(
        DATABASE_PATH
    )


# ==========================================
# CREATE TABLE
# ==========================================

def create_numbering_table():

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS numbering (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanggal TEXT,
            bidang TEXT,
            kegiatan TEXT,
            nomor INTEGER
        )
        """
    )

    conn.commit()

    conn.close()


# ==========================================
# GET OR CREATE NUMBER
# ==========================================

def get_or_create_number(
    tanggal,
    bidang,
    kegiatan
):

    conn = get_connection()

    cursor = conn.cursor()

    tanggal_str = str(tanggal)

    kegiatan = str(
        kegiatan
    ).strip()

    # ======================================
    # CEK APAKAH SUDAH ADA
    # ======================================

    cursor.execute(
        """
        SELECT nomor
        FROM numbering
        WHERE tanggal = ?
        AND bidang = ?
        AND kegiatan = ?
        """,
        (
            tanggal_str,
            bidang,
            kegiatan
        )
    )

    result = cursor.fetchone()

    # ======================================
    # JIKA SUDAH ADA
    # ======================================

    if result:

        nomor = result[0]

        conn.close()

        return nomor

    # ======================================
    # AMBIL NOMOR TERAKHIR
    # ======================================

    cursor.execute(
        """
        SELECT MAX(nomor)
        FROM numbering
        """
    )

    last_number = cursor.fetchone()[0]

    # ======================================
    # START NUMBER
    # ======================================

    if last_number is None:

        nomor_baru = 123

    else:

        nomor_baru = last_number + 1

    # ======================================
    # INSERT DATABASE
    # ======================================

    cursor.execute(
        """
        INSERT INTO numbering (
            tanggal,
            bidang,
            kegiatan,
            nomor
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            tanggal_str,
            bidang,
            kegiatan,
            nomor_baru
        )
    )

    conn.commit()

    conn.close()

    return nomor_baru


# ==========================================
# INIT TABLE
# ==========================================

create_numbering_table()