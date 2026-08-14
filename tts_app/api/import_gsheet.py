"""API: Import from Google Sheets public URL"""
from flask import Blueprint, request, jsonify
from core.gsheet_importer import fetch_from_gsheet
from core.database import get_session
from core.models import Candidate

import_gsheet_bp = Blueprint("import_gsheet", __name__)


@import_gsheet_bp.route("/import/gsheet/preview", methods=["POST"])
def preview_gsheet():
    body = request.get_json() or {}
    url  = body.get("url", "").strip()
    if not url:
        return jsonify({"error": "Vui lòng cung cấp URL Google Sheet"}), 400

    records, errors = fetch_from_gsheet(url)

    # Check conflicts
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


@import_gsheet_bp.route("/import/gsheet/confirm", methods=["POST"])
def confirm_gsheet():
    body = request.get_json() or {}
    records       = body.get("records", [])
    conflict_mode = body.get("conflict_mode", "update")

    db = get_session()
    try:
        created = updated = skipped = 0
        valid_cols = set(Candidate.__table__.columns.keys()) - {"id", "created_at", "updated_at"}

        for rec in records:
            ma = rec.get("ma_ho_so")
            existing = db.query(Candidate).filter(Candidate.ma_ho_so == ma).first() if ma else None

            if existing:
                if conflict_mode == "skip":
                    skipped += 1
                    continue
                elif conflict_mode == "update":
                    for k, v in rec.items():
                        if k in valid_cols and v is not None and v != "":
                            setattr(existing, k, v)
                    updated += 1
                else:
                    c = Candidate(**{k: v for k, v in rec.items() if k in valid_cols})
                    db.add(c)
                    created += 1
            else:
                c = Candidate(**{k: v for k, v in rec.items() if k in valid_cols})
                db.add(c)
                created += 1

        db.commit()
        return jsonify({"ok": True, "created": created, "updated": updated, "skipped": skipped})
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
