"""Local, auditable knowledge base for approved correspondence documents.

No external AI/model calls are made. This service stores approved reference files,
extracts their paragraphs, derives frequency observations, and manages human-approved rules.
"""
from __future__ import annotations
import hashlib
import json
import re
import sqlite3
from datetime import datetime
from difflib import SequenceMatcher
from pathlib import Path
from werkzeug.utils import secure_filename
from config import BASE_DIR, DATABASE_PATH
from services.checker_service import extract_text

REFERENCE_DIR = BASE_DIR / "data" / "reference_documents"
ALLOWED_EXTENSIONS = {".docx", ".pdf", ".txt"}


def _now():
    return datetime.now().isoformat(timespec="seconds")


def _connect():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def normalize(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def split_paragraphs(text: str):
    # Preserve paragraph boundaries extracted from DOCX/PDF/TXT while removing blank lines.
    out = []
    for raw in re.split(r"\n\s*\n|\r\n|\n", text or ""):
        p = re.sub(r"\s+", " ", raw).strip()
        if len(p) >= 18:
            out.append(p)
    return out


def init_reference_tables():
    REFERENCE_DIR.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS reference_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_type TEXT NOT NULL,
            title TEXT NOT NULL,
            document_number TEXT DEFAULT '',
            document_date TEXT DEFAULT '',
            approval_status TEXT NOT NULL DEFAULT 'Final disetujui',
            attachment_name TEXT NOT NULL,
            stored_path TEXT NOT NULL,
            extracted_text TEXT NOT NULL DEFAULT '',
            sha256 TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS reference_paragraphs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reference_id INTEGER NOT NULL REFERENCES reference_documents(id) ON DELETE CASCADE,
            paragraph_no INTEGER NOT NULL,
            paragraph_text TEXT NOT NULL,
            normalized_text TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(reference_id, paragraph_no)
        );
        CREATE TABLE IF NOT EXISTS document_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            document_type TEXT NOT NULL DEFAULT 'Semua jenis',
            rule_type TEXT NOT NULL DEFAULT 'required_paragraph',
            content TEXT NOT NULL,
            description TEXT DEFAULT '',
            severity TEXT NOT NULL DEFAULT 'warning',
            source_reference_id INTEGER REFERENCES reference_documents(id) ON DELETE SET NULL,
            source_paragraph_id INTEGER REFERENCES reference_paragraphs(id) ON DELETE SET NULL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS checker_audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            action TEXT NOT NULL,
            detail_json TEXT NOT NULL DEFAULT '{}',
            actor TEXT NOT NULL DEFAULT 'local-user',
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_ref_type ON reference_documents(document_type);
        CREATE INDEX IF NOT EXISTS idx_rule_type_active ON document_rules(document_type, active);
        CREATE INDEX IF NOT EXISTS idx_audit_entity ON checker_audit_log(entity_type, entity_id, id DESC);
        """)


def _audit(conn, entity_type, entity_id, action, detail):
    conn.execute("INSERT INTO checker_audit_log(entity_type,entity_id,action,detail_json,created_at) VALUES(?,?,?,?,?)",
                 (entity_type, entity_id, action, json.dumps(detail or {}, ensure_ascii=False), _now()))


def list_references():
    with _connect() as conn:
        rows = conn.execute("""SELECT d.id,d.document_type,d.title,d.document_number,d.document_date,
            d.approval_status,d.attachment_name,d.sha256,d.created_at,
            (SELECT COUNT(*) FROM reference_paragraphs p WHERE p.reference_id=d.id) paragraph_count
            FROM reference_documents d ORDER BY d.id DESC""").fetchall()
        return [dict(r) for r in rows]


def create_reference(form, uploaded):
    original = secure_filename(uploaded.filename or "")
    suffix = Path(original).suffix.lower()
    if not original or suffix not in ALLOWED_EXTENSIONS:
        raise ValueError("Format referensi harus DOCX, PDF, atau TXT.")
    title = (form.get("title") or Path(original).stem).strip()[:200]
    doc_type = (form.get("document_type") or "Nota Dinas").strip()[:100]
    approval = (form.get("approval_status") or "Final disetujui").strip()
    if approval != "Final disetujui":
        raise ValueError("Tahap pertama hanya menerima dokumen final yang sudah disetujui/ditandatangani.")
    REFERENCE_DIR.mkdir(parents=True, exist_ok=True)
    path = REFERENCE_DIR / (hashlib.sha256(f"{_now()}-{original}".encode()).hexdigest()[:16] + "_" + original)
    uploaded.save(path)
    try:
        text = extract_text(path)
        if not text.strip():
            raise ValueError("Teks tidak berhasil diekstrak. PDF scan belum didukung tanpa OCR; gunakan PDF teks atau DOCX.")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        paragraphs = split_paragraphs(text)
        with _connect() as conn:
            # Hash duplicates are blocked so frequency statistics cannot be inflated accidentally.
            existing = conn.execute("SELECT id FROM reference_documents WHERE sha256=?", (digest,)).fetchone()
            if existing:
                raise ValueError(f"Dokumen identik sudah terdaftar sebagai referensi ID {existing['id']}.")
            cur = conn.execute("""INSERT INTO reference_documents
                (document_type,title,document_number,document_date,approval_status,attachment_name,stored_path,extracted_text,sha256,created_at)
                VALUES(?,?,?,?,?,?,?,?,?,?)""",
                (doc_type,title,form.get("document_number","").strip(),form.get("document_date","").strip(),approval,
                 original,str(path),text[:500000],digest,_now()))
            ref_id = cur.lastrowid
            for i, para in enumerate(paragraphs, start=1):
                conn.execute("INSERT INTO reference_paragraphs(reference_id,paragraph_no,paragraph_text,normalized_text,created_at) VALUES(?,?,?,?,?)",
                             (ref_id,i,para,normalize(para),_now()))
            _audit(conn,"reference_document",ref_id,"created",{"title":title,"document_type":doc_type,"paragraph_count":len(paragraphs),"sha256":digest})
        return get_reference(ref_id)
    except Exception:
        path.unlink(missing_ok=True)
        raise


def get_reference(reference_id):
    with _connect() as conn:
        doc = conn.execute("SELECT id,document_type,title,document_number,document_date,approval_status,attachment_name,sha256,created_at FROM reference_documents WHERE id=?", (reference_id,)).fetchone()
        if not doc:
            return None
        result = dict(doc)
        result["paragraphs"] = [dict(r) for r in conn.execute("SELECT id,paragraph_no,paragraph_text FROM reference_paragraphs WHERE reference_id=? ORDER BY paragraph_no", (reference_id,)).fetchall()]
        result["audit"] = [dict(r) for r in conn.execute("SELECT action,detail_json,actor,created_at FROM checker_audit_log WHERE entity_type='reference_document' AND entity_id=? ORDER BY id DESC", (reference_id,)).fetchall()]
        return result


def delete_reference(reference_id):
    with _connect() as conn:
        row = conn.execute("SELECT stored_path,title FROM reference_documents WHERE id=?", (reference_id,)).fetchone()
        if not row:
            return False
        # Keep rules, but their source references become NULL through FK SET NULL.
        conn.execute("DELETE FROM reference_documents WHERE id=?", (reference_id,))
        _audit(conn,"reference_document",reference_id,"deleted",{"title":row['title']})
        path = Path(row["stored_path"])
    path.unlink(missing_ok=True)
    return True


def list_rules():
    with _connect() as conn:
        rows = conn.execute("""SELECT r.*, d.title AS source_title, p.paragraph_no AS source_paragraph_no
            FROM document_rules r LEFT JOIN reference_documents d ON d.id=r.source_reference_id
            LEFT JOIN reference_paragraphs p ON p.id=r.source_paragraph_id ORDER BY r.active DESC,r.id DESC""").fetchall()
        return [dict(r) for r in rows]


def create_rule(data):
    name = str(data.get("name", "")).strip()[:200]
    content = str(data.get("content", "")).strip()[:10000]
    if not name or not content:
        raise ValueError("Nama aturan dan isi paragraf/frasa wajib diisi.")
    rule_type = data.get("rule_type", "required_paragraph")
    if rule_type not in {"required_paragraph", "required_phrase", "forbidden_phrase", "guidance"}:
        raise ValueError("Jenis aturan tidak valid.")
    severity = data.get("severity", "warning")
    if severity not in {"info", "warning", "error"}:
        raise ValueError("Tingkat temuan tidak valid.")
    now = _now()
    with _connect() as conn:
        ref_id = data.get("source_reference_id") or None
        para_id = data.get("source_paragraph_id") or None
        if para_id:
            source = conn.execute("SELECT reference_id,paragraph_text FROM reference_paragraphs WHERE id=?", (para_id,)).fetchone()
            if not source:
                raise ValueError("Paragraf sumber tidak ditemukan.")
            ref_id = source["reference_id"]
        cur = conn.execute("""INSERT INTO document_rules(name,document_type,rule_type,content,description,severity,source_reference_id,source_paragraph_id,active,created_at,updated_at)
            VALUES(?,?,?,?,?,?,?,?,1,?,?)""",
            (name,str(data.get("document_type") or "Semua jenis"),rule_type,content,str(data.get("description") or "")[:2000],severity,ref_id,para_id,now,now))
        rule_id = cur.lastrowid
        _audit(conn,"document_rule",rule_id,"created",{"name":name,"source_reference_id":ref_id,"source_paragraph_id":para_id})
        return get_rule(rule_id)


def get_rule(rule_id):
    with _connect() as conn:
        row = conn.execute("SELECT * FROM document_rules WHERE id=?", (rule_id,)).fetchone()
        return dict(row) if row else None


def update_rule(rule_id, data):
    with _connect() as conn:
        row = conn.execute("SELECT * FROM document_rules WHERE id=?", (rule_id,)).fetchone()
        if not row:
            return None
        active = int(bool(data.get("active", row["active"])))
        now = _now()
        conn.execute("UPDATE document_rules SET active=?,updated_at=? WHERE id=?", (active,now,rule_id))
        _audit(conn,"document_rule",rule_id,"activated" if active else "deactivated",{"active":active})
    return get_rule(rule_id)


def paragraph_insights(reference_id=None):
    """Exact normalized paragraph recurrence; frequency is an observation, not a rule."""
    with _connect() as conn:
        where = "WHERE p.reference_id=?" if reference_id else ""
        params = (reference_id,) if reference_id else ()
        rows = conn.execute(f"""SELECT p.normalized_text, MIN(p.paragraph_text) sample_text,
            COUNT(DISTINCT p.reference_id) document_count, COUNT(*) occurrence_count,
            GROUP_CONCAT(DISTINCT d.document_type) document_types,
            GROUP_CONCAT(DISTINCT d.id) reference_ids
            FROM reference_paragraphs p JOIN reference_documents d ON d.id=p.reference_id
            {where} GROUP BY p.normalized_text HAVING LENGTH(p.normalized_text)>=18
            ORDER BY document_count DESC, occurrence_count DESC LIMIT 300""", params).fetchall()
        total = conn.execute("SELECT COUNT(*) FROM reference_documents" + (" WHERE id=?" if reference_id else ""), params).fetchone()[0]
        results=[]
        for r in rows:
            item=dict(r); item["reference_ids"]=[int(x) for x in (item["reference_ids"] or "").split(",") if x]
            item["frequency"] = round(item["document_count"] / total, 3) if total else 0
            results.append(item)
        return {"reference_count":total,"paragraphs":results}


def evaluate_against_rules(document_type, text):
    """Deterministic, explainable matching. Every finding includes rule/reference provenance."""
    paragraphs = [normalize(p) for p in split_paragraphs(text)]
    normalized_doc = normalize(text)
    findings=[]
    with _connect() as conn:
        rules = conn.execute("""SELECT r.*,d.title source_title,d.document_number source_number,p.paragraph_no source_paragraph_no
            FROM document_rules r LEFT JOIN reference_documents d ON d.id=r.source_reference_id
            LEFT JOIN reference_paragraphs p ON p.id=r.source_paragraph_id
            WHERE r.active=1 AND (r.document_type='Semua jenis' OR r.document_type=?) ORDER BY r.id""", (document_type,)).fetchall()
        for rule in rules:
            target=normalize(rule["content"])
            if not target: continue
            matched = target in normalized_doc if rule["rule_type"] in {"required_phrase","forbidden_phrase"} else any(
                p == target or (len(target)>40 and SequenceMatcher(None,p,target).ratio() >= 0.88) for p in paragraphs)
            if rule["rule_type"] == "forbidden_phrase" and matched:
                message=f"Frasa yang ditandai untuk dihindari ditemukan: {rule['name']}."
                missing=False
            elif rule["rule_type"] in {"required_phrase","required_paragraph"} and not matched:
                message=f"Standar belum terdeteksi: {rule['name']}. Verifikasi apakah memang wajib untuk naskah ini."
                missing=True
            elif rule["rule_type"] == "guidance":
                continue
            else:
                continue
            findings.append({"severity":rule["severity"],"code":"reference_rule_match" if not missing else "reference_rule_missing",
                "message":message,"rule_id":rule["id"],"rule_name":rule["name"],"rule_type":rule["rule_type"],
                "source_reference_id":rule["source_reference_id"],"source_title":rule["source_title"],
                "source_document_number":rule["source_number"],"source_paragraph_no":rule["source_paragraph_no"],
                "matched":not missing})
    return findings


def audit_for(entity_type=None, entity_id=None, limit=100):
    clauses=[]; params=[]
    if entity_type:
        clauses.append("entity_type=?"); params.append(entity_type)
    if entity_id is not None:
        clauses.append("entity_id=?"); params.append(entity_id)
    where=(" WHERE "+" AND ".join(clauses)) if clauses else ""
    with _connect() as conn:
        rows=conn.execute("SELECT * FROM checker_audit_log"+where+" ORDER BY id DESC LIMIT ?", (*params,max(1,min(int(limit),500)))).fetchall()
        out=[]
        for r in rows:
            x=dict(r); x["detail"]=json.loads(x.pop("detail_json") or "{}"); out.append(x)
        return out
