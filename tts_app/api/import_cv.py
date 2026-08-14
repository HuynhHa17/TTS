"""API: Import from CVpv.xlsx (file upload or path)"""
import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from core.parser import parse_cv_file
from core.database import get_session
from core.models import Candidate
import config

import_cv_bp = Blueprint("import_cv", __name__)
ALLOWED = {".xlsx", ".xls"}


def _allowed(filename):
    return os.path.splitext(filename)[1].lower() in ALLOWED


@import_cv_bp.route("/import/cv/preview", methods=["POST"])
def preview_cv():
    """
    Preview CVpv.xlsx before importing.
    Accepts either:
      - multipart file upload (field name: 'file')
      - JSON body: {"path": "d:/TTS/CVpv.xlsx"}
    """
    filepath = None
    tmp = False

    if "file" in request.files:
        f = request.files["file"]
        if not _allowed(f.filename):
            return jsonify({"error": "Chỉ hỗ trợ file .xlsx"}), 400
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tf:
            f.save(tf.name)
            filepath = tf.name
        tmp = True
    else:
        body = request.get_json() or {}
        filepath = body.get("path", config.CV_FILE)

    if not os.path.exists(filepath):
        return jsonify({"error": f"Không tìm thấy file: {filepath}"}), 404

    records, errors = parse_cv_file(filepath)

    if tmp:
        os.unlink(filepath)

    # Check conflicts with existing DB records
    db = get_session()
    try:
        conflicts = []
        for r in records:
            ma = r.get("ma_ho_so")
            if ma:
                existing = db.query(Candidate).filter(Candidate.ma_ho_so == ma).first()
                if existing:
                    conflicts.append(ma)
    finally:
        db.close()

    return jsonify({
        "records":   records,
        "count":     len(records),
        "errors":    errors,
        "conflicts": conflicts,
    })


@import_cv_bp.route("/import/cv/confirm", methods=["POST"])
def confirm_cv():
    """
    Confirm import of parsed CV records.
    Body: {
      "records": [...],
      "conflict_mode": "update" | "skip" | "create"
    }
    """
    body = request.get_json() or {}
    records       = body.get("records", [])
    conflict_mode = body.get("conflict_mode", "update")

    db = get_session()
    try:
        created = updated = skipped = 0
        valid_cols = set(Candidate.__table__.columns.keys()) - {"id", "created_at", "updated_at"}

        for rec in records:
            # Remove internal keys
            rec.pop("_sheet", None)

            ma = rec.get("ma_ho_so")
            existing = db.query(Candidate).filter(Candidate.ma_ho_so == ma).first() if ma else None

            if existing:
                if conflict_mode == "skip":
                    skipped += 1
                    continue
                elif conflict_mode == "update":
                    for k, v in rec.items():
                        if k in valid_cols and v is not None:
                            setattr(existing, k, v)
                    updated += 1
                else:  # create new — clear ma_ho_so uniqueness
                    rec.pop("ma_ho_so", None)
                    c = Candidate(**{k: v for k, v in rec.items() if k in valid_cols})
                    db.add(c)
                    created += 1
            else:
                c = Candidate(**{k: v for k, v in rec.items() if k in valid_cols})
                db.add(c)
                created += 1

        db.commit()
        return jsonify({
            "ok":      True,
            "created": created,
            "updated": updated,
            "skipped": skipped,
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
