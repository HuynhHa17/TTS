import os
import io
import uuid
import zipfile
from flask import Blueprint, jsonify, send_file, request

from core.database import get_session
from core.models import Candidate
from core.template_filler import fill_rirekisho_excel
import config

documents_bp = Blueprint("documents", __name__)


def _get_template_path():
    template_path = os.path.join(config.BASE_DIR, "..", "CVpv.xlsx")
    return os.path.normpath(template_path)


@documents_bp.route("/documents/rirekisho/<int:candidate_id>", methods=["GET"])
def export_rirekisho(candidate_id):
    db = get_session()
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            return jsonify({"error": "Candidate not found"}), 404

        template_path = _get_template_path()
        if not os.path.isfile(template_path):
            return jsonify({"error": f"Template not found at {template_path}"}), 500

        temp_dir = os.path.join(config.BASE_DIR, "temp")
        os.makedirs(temp_dir, exist_ok=True)

        safe_name = candidate.full_name_vn.replace(" ", "_") if candidate.full_name_vn else "Unknown"
        output_filename = f"{candidate.profile_code or 'CV'}_{safe_name}_Rirekisho.xlsx"
        output_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{output_filename}")

        fill_rirekisho_excel(candidate, template_path, output_path)

        return send_file(
            output_path,
            as_attachment=True,
            download_name=output_filename,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@documents_bp.route("/documents/tcmmxd/<int:candidate_id>", methods=["GET"])
def export_tcmmxd(candidate_id):
    # Currently uses the primary template filler for TCMMXD
    return export_rirekisho(candidate_id)


@documents_bp.route("/documents/khai-tt", methods=["GET"])
def export_khai_tt():
    out_path = config.OUTPUT_FILE
    if os.path.exists(out_path):
        return send_file(
            out_path,
            as_attachment=True,
            download_name="File_lưu.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    return jsonify({"error": "Chưa có file Master Excel."}), 404


@documents_bp.route("/documents/batch-export", methods=["POST"])
def batch_export_zip():
    data = request.get_json() or {}
    candidate_ids = data.get("candidate_ids", [])
    templates = data.get("templates", ["rirekisho"])

    template_path = _get_template_path()
    if not os.path.isfile(template_path):
        return jsonify({"error": "Template CVpv.xlsx not found"}), 500

    db = get_session()
    try:
        if candidate_ids:
            candidates = db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()
        else:
            candidates = db.query(Candidate).all()

        if not candidates:
            return jsonify({"error": "Không có ứng viên nào để xuất"}), 400

        temp_dir = os.path.join(config.BASE_DIR, "temp")
        os.makedirs(temp_dir, exist_ok=True)

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for cand in candidates:
                safe_name = cand.full_name_vn.replace(" ", "_") if cand.full_name_vn else f"ID_{cand.id}"
                prefix = cand.profile_code or f"TTS_{cand.id}"

                # Export Rirekisho if requested
                if "rirekisho" in templates or "all" in templates or not templates:
                    temp_file = os.path.join(temp_dir, f"{uuid.uuid4()}_rirekisho.xlsx")
                    try:
                        fill_rirekisho_excel(cand, template_path, temp_file)
                        zip_file.write(temp_file, arcname=f"{prefix}_{safe_name}_Rirekisho.xlsx")
                    finally:
                        if os.path.exists(temp_file):
                            os.remove(temp_file)

        zip_buffer.seek(0)
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name=f"Hoso_TTS_Batch_{uuid.uuid4().hex[:6]}.zip",
            mimetype="application/zip"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
