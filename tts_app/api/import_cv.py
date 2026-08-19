"""API: Import from CVpv.xlsx (file upload or path)"""
import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from core.parser import parse_cv_file
from core.database import get_session
from core.models import (
    Candidate, Education, WorkExperience, FamilyMember, IdentityDocument
)
from api.candidates import _sync_excel
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
            ma = r.get("profile_code") or r.get("ma_ho_so")
            if ma:
                existing = db.query(Candidate).filter(Candidate.profile_code == ma).first()
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
            rec = dict(rec)
            # Pop sub lists
            rec.pop("_sheet", None)
            edus = rec.pop("educations", [])
            works = rec.pop("work_experiences", [])
            fams = rec.pop("family_members", [])

            ma = rec.get("profile_code") or rec.get("ma_ho_so")
            if not rec.get("profile_code") and ma:
                rec["profile_code"] = ma

            existing = db.query(Candidate).filter(Candidate.profile_code == ma).first() if ma else None

            target_cand = None
            if existing:
                if conflict_mode == "skip":
                    skipped += 1
                    continue
                elif conflict_mode == "update":
                    for k, v in rec.items():
                        if k in valid_cols and v is not None:
                            setattr(existing, k, v)
                    target_cand = existing
                    updated += 1
                else:  # create new
                    rec.pop("profile_code", None)
                    c = Candidate(**{k: v for k, v in rec.items() if k in valid_cols and v is not None})
                    db.add(c)
                    db.flush()
                    target_cand = c
                    created += 1
            else:
                c = Candidate(**{k: v for k, v in rec.items() if k in valid_cols and v is not None})
                db.add(c)
                db.flush()
                target_cand = c
                created += 1

            if target_cand:
                # If updating, clear existing child records first if new ones provided
                if existing and conflict_mode == "update":
                    if edus:
                        for e in list(target_cand.educations): db.delete(e)
                    if works:
                        for w in list(target_cand.work_experiences): db.delete(w)
                    if fams:
                        for f in list(target_cand.family_members): db.delete(f)
                    db.flush()

                # Save Educations
                for edu in edus:
                    if edu.get("school_name_jp") or edu.get("school_name_vn") or edu.get("period"):
                        db.add(Education(
                            candidate_id=target_cand.id,
                            school_name_jp=edu.get("school_name_jp"),
                            school_name_vn=edu.get("school_name_vn"),
                            start_date=edu.get("start_date"),
                            end_date=edu.get("end_date"),
                            education_level=edu.get("education_level", "THPT"),
                        ))

                # Save Work Experiences
                for w in works:
                    if w.get("company_name_jp") or w.get("company_name_vn") or w.get("period") or w.get("label"):
                        db.add(WorkExperience(
                            candidate_id=target_cand.id,
                            company_name_jp=w.get("company_name_jp"),
                            company_name_vn=w.get("company_name_vn"),
                            job_title_jp=w.get("job_title_jp"),
                            job_title_vn=w.get("job_title_vn"),
                            start_date=w.get("start_date"),
                            end_date=w.get("end_date"),
                            description=w.get("label"),
                        ))

                # Save Family Members
                for fam in fams:
                    if fam.get("full_name") or fam.get("name"):
                        db.add(FamilyMember(
                            candidate_id=target_cand.id,
                            relationship=fam.get("relationship") or fam.get("rel_jp") or "Người thân",
                            full_name=fam.get("full_name") or fam.get("name"),
                            age=fam.get("age"),
                            living_together=fam.get("living_together", "Có"),
                            occupation=fam.get("occupation") or fam.get("job"),
                            monthly_income=fam.get("monthly_income"),
                        ))

        db.commit()
        _sync_excel()
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
