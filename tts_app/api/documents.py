import os
import uuid
from flask import Blueprint, jsonify, send_file, current_app

from core.database import get_session
from core.models import Candidate
from core.template_filler import fill_rirekisho_excel
import config

documents_bp = Blueprint("documents", __name__)

@documents_bp.route("/documents/rirekisho/<int:candidate_id>", methods=["GET"])
def export_rirekisho(candidate_id):
    db = get_session()
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            return jsonify({"error": "Candidate not found"}), 404

        template_path = os.path.join(config.BASE_DIR, "..", "CVpv.xlsx")
        template_path = os.path.normpath(template_path)

        if not os.path.isfile(template_path):
            return jsonify({"error": f"Template not found at {template_path}"}), 500

        # Create temp dir if not exists
        temp_dir = os.path.join(config.BASE_DIR, "temp")
        os.makedirs(temp_dir, exist_ok=True)

        safe_name = candidate.full_name_vn.replace(" ", "_") if candidate.full_name_vn else "Unknown"
        output_filename = f"{candidate.profile_code or 'CV'}_{safe_name}_Rirekisho.xlsx"
        output_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{output_filename}")

        # Fill template
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
