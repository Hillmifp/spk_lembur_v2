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

# ==========================================
# APP
# ==========================================

app = Flask(__name__)

CORS(app)

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
# RUN
# ==========================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=5000,

        debug=True

    )