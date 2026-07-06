from pathlib import Path

BASE_DIR = Path(__file__).parent

TEMPLATE_PATH = (
    BASE_DIR /
    "data/template/template_spk_lembur.docx"
)

OUTPUT_DIR = (
    BASE_DIR /
    "data/output"
)

DOKUMENTASI_FILE = (
    BASE_DIR /
    "data/dokumentasi/dokumentasi_penomoran.xlsx"
)

DATABASE_PATH = (
    BASE_DIR /
    "database/spk.db"
)