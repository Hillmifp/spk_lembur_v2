import sqlite3

from config import DATABASE_PATH


# ==========================================
# GET CONNECTION
# ==========================================

def get_connection():

    conn = sqlite3.connect(
        DATABASE_PATH
    )

    return conn


# ==========================================
# CREATE TABLE
# ==========================================

def create_table():

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS spk_documents (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            nomor_spk TEXT,

            nomor_urut INTEGER,

            tanggal TEXT,

            bidang TEXT,

            file_path TEXT,

            created_at TIMESTAMP
            DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    conn.commit()

    conn.close()


# ==========================================
# INSERT SPK
# ==========================================

def insert_spk_document(
    nomor_spk,
    nomor_urut,
    tanggal,
    bidang,
    file_path
):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO spk_documents (

            nomor_spk,

            nomor_urut,

            tanggal,

            bidang,

            file_path

        )
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            nomor_spk,

            nomor_urut,

            tanggal,

            bidang,

            str(file_path)
        )
    )

    conn.commit()

    conn.close()


# ==========================================
# GET SPK EXISTING
# ==========================================

def get_spk_by_date_and_bidang(
    tanggal,
    bidang
):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT nomor_spk,
               nomor_urut
        FROM spk_documents
        WHERE tanggal = ?
        AND bidang = ?
        """,
        (
            str(tanggal),
            bidang
        )
    )

    result = cursor.fetchone()

    conn.close()

    return result


# ==========================================
# GET LAST NUMBER
# ==========================================

def get_last_number(
    tanggal
):

    conn = get_connection()

    cursor = conn.cursor()

    tahun = str(
        tanggal.year
    )

    cursor.execute(
        """
        SELECT MAX(nomor_urut)
        FROM spk_documents
        WHERE substr(
            tanggal,
            1,
            4
        ) = ?
        """,
        (tahun,)
    )

    result = cursor.fetchone()

    conn.close()

    if result[0]:

        return result[0]

    return 122


# ==========================================
# INIT TABLE
# ==========================================

create_table()

# ==========================================
# GET ALL SPK
# ==========================================

def get_all_spk():

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            nomor_spk,
            tanggal,
            bidang,
            file_path,
            created_at
        FROM spk_documents
        ORDER BY tanggal DESC
        """
    )

    results = cursor.fetchall()

    conn.close()

    return results

# ==========================================
# GET FILE PATH
# ==========================================

def get_file_path(nomor_spk):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT file_path
        FROM spk_documents
        WHERE nomor_spk = ?
        """,
        (nomor_spk,)
    )

    result = cursor.fetchone()

    conn.close()

    return result