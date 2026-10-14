from flask import (
    Flask,
    request,
    jsonify,
    render_template,
    send_file
)

from flask_cors import CORS

import os

from collections import Counter
from datetime import datetime

from services.generator_service import (
    generate_all_spk
)

from services.preview_service import (
    generate_preview
)

from services.database_service import (
    get_all_spk,
    get_file_path
)

from collections import Counter, defaultdict
from flask import abort
from services.checker_service import init_checker_table, list_checks, create_check, get_check, update_check, get_stored_file
from services.reference_service import (
    init_reference_tables, list_references, create_reference, get_reference,
    delete_reference, list_rules, create_rule, update_rule, paragraph_insights, audit_for
)

# ==========================================
# APP
# ==========================================

app = Flask(__name__)

CORS(app)
init_checker_table()
init_reference_tables()

# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    history = get_all_spk()

    return render_template(
        "index.html",
        history=history
    )

# ==========================================
# PREVIEW
# ==========================================

@app.route(
    "/preview",
    methods=["POST"]
)
def preview():

    if "file" not in request.files:

        return jsonify({
            "success": False,
            "error": "File tidak ditemukan"
        })

    file = request.files["file"]

    upload_folder = "uploads"

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    file_path = os.path.join(
        upload_folder,
        file.filename
    )

    file.save(file_path)

    preview_data = generate_preview(
        file_path
    )

    return jsonify({

        "success": True,

        "data": preview_data

    })

# ==========================================
# GENERATE
# ==========================================

@app.route(
    "/generate",
    methods=["POST"]
)
def generate():

    if "file" not in request.files:

        return jsonify({

            "success": False,

            "error": "File tidak ditemukan"

        })

    file = request.files["file"]

    upload_folder = "uploads"

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    file_path = os.path.join(
        upload_folder,
        file.filename
    )

    file.save(file_path)

    try:

        generated_files = generate_all_spk(
            file_path
        )

        if not generated_files:

            return jsonify({

                "success": False,

                "error":
                "Tidak ada SPK yang berhasil dibuat"

            })

        return jsonify({

            "success": True,

            "total_file":
            len(generated_files),

            "output_folder":
            os.path.dirname(
                generated_files[0]
            ),

            "files":
            generated_files

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "error":
            str(e)

        })

# ==========================================
# DASHBOARD
# ==========================================

@app.route("/api/dashboard")
def dashboard():

    history = get_all_spk()

    total_spk = len(history)

    bulan_ini = datetime.now().strftime(
        "%Y-%m"
    )

    spk_bulan_ini = 0

    bidang_list = []

    nomor_terakhir = "-"

    for row in history:

        nomor_spk = row[0]

        tanggal = str(row[1])

        bidang = row[2]

        if tanggal.startswith(
            bulan_ini
        ):

            spk_bulan_ini += 1

        bidang_list.append(
            bidang
        )

        nomor_terakhir = nomor_spk

    bidang_terbanyak = "-"

    if bidang_list:

        bidang_terbanyak = (
            Counter(
                bidang_list
            )
            .most_common(1)[0][0]
        )

    return jsonify({

        "total_spk":
        total_spk,

        "spk_bulan_ini":
        spk_bulan_ini,

        "bidang_terbanyak":
        bidang_terbanyak,

        "nomor_terakhir":
        nomor_terakhir

    })

# ==========================================
# HISTORY
# ==========================================

@app.route("/api/history")
def api_history():

    history = get_all_spk()

    data = []

    for row in history:

        data.append({

            "nomor_spk":
            row[0],

            "tanggal":
            row[1],

            "bidang":
            row[2],

            "file_path":
            row[3],

            "created_at":
            row[4]

        })

    return jsonify(
        data
    )

# ==========================================
# DOWNLOAD BY NOMOR SPK
# ==========================================

@app.route(
    "/api/download/<path:nomor_spk>"
)
def download_file(
    nomor_spk
):

    result = get_file_path(
        nomor_spk
    )

    if not result:

        return jsonify({

            "success": False,

            "error":
            "File tidak ditemukan"

        })

    file_path = result[0]

    return send_file(
        file_path,
        as_attachment=True
    )

# ==========================================
# DOWNLOAD BY FILE PATH
# ==========================================

@app.route(
    "/api/download-file"
)
def download_generated_file():

    file_path = request.args.get(
        "path"
    )

    if not file_path:

        return jsonify({

            "success": False,

            "error":
            "Path file kosong"

        })

    if not os.path.exists(
        file_path
    ):

        return jsonify({

            "success": False,

            "error":
            "File tidak ditemukan"

        })

    return send_file(
        file_path,
        as_attachment=True
    )

# ==========================================
# OPEN OUTPUT FOLDER
# ==========================================

@app.route(
    "/api/open-output",
    methods=["POST"]
)
def open_output():

    try:

        data = request.get_json()

        folder = data.get(
            "folder"
        )

        if not folder:

            return jsonify({

                "success": False,

                "error":
                "Folder tidak ditemukan"

            })

        if not os.path.exists(
            folder
        ):

            return jsonify({

                "success": False,

                "error":
                "Folder tidak ada"

            })

        os.startfile(
            folder
        )

        return jsonify({

            "success": True

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "error":
            str(e)

        })

# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/api/health")
def health():

    return jsonify({

        "status":
        "ok",

        "message":
        "SPK API Running"

    })

# ==========================================
# API STATISTIK
# ==========================================

@app.route("/api/statistik")
def statistik():

    history = get_all_spk()

    bidang_counter = Counter()

    bulan_counter = defaultdict(int)

    for row in history:

        tanggal = row[1]
        bidang = row[2]

        bidang_counter[bidang] += 1

        bulan = tanggal[:7]
        bulan_counter[bulan] += 1

    bidang_data = []

    for bidang, total in bidang_counter.items():

        bidang_data.append({

            "name": bidang,
            "value": total

        })

    bulan_data = []

    for bulan, total in sorted(
        bulan_counter.items()
    ):

        bulan_data.append({

            "bulan": bulan,
            "jumlah": total

        })

    return jsonify({

        "bidang": bidang_data,

        "bulan": bulan_data

    })


# ==========================================
# CHECKER PERSURATAN
# ==========================================

@app.route("/api/checker", methods=["GET"])
def api_checker_list():
    return jsonify(list_checks())

@app.route("/api/checker", methods=["POST"])
def api_checker_create():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "File dokumen belum dipilih."}), 400
    try:
        result = create_check(request.form, request.files["file"])
        return jsonify({"success": True, "data": result}), 201
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception:
        app.logger.exception("Gagal membuat pemeriksaan persuratan")
        return jsonify({"success": False, "error": "Dokumen gagal diproses. Periksa format file atau log server."}), 500

@app.route("/api/checker/<int:check_id>", methods=["GET"])
def api_checker_detail(check_id):
    result = get_check(check_id)
    if not result:
        return jsonify({"success": False, "error": "Data pemeriksaan tidak ditemukan."}), 404
    return jsonify(result)

@app.route("/api/checker/<int:check_id>", methods=["PUT"])
def api_checker_update(check_id):
    data = request.get_json(silent=True) or {}
    try:
        result = update_check(check_id, data)
        if not result:
            return jsonify({"success": False, "error": "Data pemeriksaan tidak ditemukan."}), 404
        return jsonify({"success": True, "data": result})
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

@app.route("/api/checker/<int:check_id>/file", methods=["GET"])
def api_checker_download(check_id):
    result = get_stored_file(check_id)
    if not result or not result[0].is_file():
        return jsonify({"success": False, "error": "File tidak ditemukan."}), 404
    return send_file(result[0], as_attachment=True, download_name=result[1])

# ==========================================
# SMART PERSURATAN: REFERENCE LIBRARY & RULES
# ==========================================

@app.route("/api/references", methods=["GET"])
def api_reference_list():
    return jsonify(list_references())

@app.route("/api/references", methods=["POST"])
def api_reference_create():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "Pilih dokumen final yang sudah disetujui."}), 400
    try:
        result = create_reference(request.form, request.files["file"])
        return jsonify({"success": True, "data": result}), 201
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception:
        app.logger.exception("Gagal menambahkan dokumen referensi")
        return jsonify({"success": False, "error": "Dokumen referensi gagal diproses. Periksa format file dan log server."}), 500

@app.route("/api/references/<int:reference_id>", methods=["GET"])
def api_reference_detail(reference_id):
    result = get_reference(reference_id)
    if not result:
        return jsonify({"success": False, "error": "Dokumen referensi tidak ditemukan."}), 404
    return jsonify(result)

@app.route("/api/references/<int:reference_id>", methods=["DELETE"])
def api_reference_delete(reference_id):
    if not delete_reference(reference_id):
        return jsonify({"success": False, "error": "Dokumen referensi tidak ditemukan."}), 404
    return jsonify({"success": True})

@app.route("/api/references/<int:reference_id>/file", methods=["GET"])
def api_reference_file(reference_id):
    from services.reference_service import _connect
    with _connect() as conn:
        row = conn.execute("SELECT stored_path,attachment_name FROM reference_documents WHERE id=?", (reference_id,)).fetchone()
    if not row or not os.path.isfile(row["stored_path"]):
        return jsonify({"success": False, "error": "File referensi tidak ditemukan."}), 404
    return send_file(row["stored_path"], as_attachment=True, download_name=row["attachment_name"])

@app.route("/api/reference-insights", methods=["GET"])
def api_reference_insights():
    ref_id = request.args.get("reference_id", type=int)
    return jsonify(paragraph_insights(ref_id))

@app.route("/api/rules", methods=["GET"])
def api_rules_list():
    return jsonify(list_rules())

@app.route("/api/rules", methods=["POST"])
def api_rule_create():
    try:
        return jsonify({"success": True, "data": create_rule(request.get_json(silent=True) or {})}), 201
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception:
        app.logger.exception("Gagal membuat aturan persuratan")
        return jsonify({"success": False, "error": "Aturan gagal disimpan."}), 500

@app.route("/api/rules/<int:rule_id>", methods=["PUT"])
def api_rule_update(rule_id):
    try:
        result = update_rule(rule_id, request.get_json(silent=True) or {})
        if not result:
            return jsonify({"success": False, "error": "Aturan tidak ditemukan."}), 404
        return jsonify({"success": True, "data": result})
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

@app.route("/api/audit-log", methods=["GET"])
def api_audit_log():
    entity_type = request.args.get("entity_type")
    entity_id = request.args.get("entity_id", type=int)
    limit = request.args.get("limit", default=100, type=int)
    return jsonify(audit_for(entity_type, entity_id, limit))

# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=5000,

        debug=True

    )