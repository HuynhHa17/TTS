import os
import io
import uuid
import zipfile
import json
from io import BytesIO
from flask import Blueprint, jsonify, send_file, request

from core.database import get_session
from core.models import (
    Candidate, IdentityDocument, Education, WorkExperience,
    SkillExperience, JapanExperience, FamilyMember, CandidateAssignment, to_dict
)
from core.template_filler import fill_rirekisho_excel
from core.pdf_exporter import build_rirekisho_pdf
from core.form_template import export_candidate_form_template
from core.form_parser import parse_candidate_form_excel
from api.candidates import _build_full_profile, _sync_excel
import config

documents_bp = Blueprint("documents", __name__)


def _get_template_path():
    template_path = os.path.join(config.BASE_DIR, "..", "CVpv.xlsx")
    return os.path.normpath(template_path)


@documents_bp.route("/documents/form-template", methods=["GET"])
def download_form_template():
    """Tải file Excel Mẫu Tờ Đơn Ứng Viên (To_Khai_Ung_Vien.xlsx)."""
    try:
        data_bytes = export_candidate_form_template()
        return send_file(
            BytesIO(data_bytes),
            as_attachment=True,
            download_name="To_Khai_Ung_Vien.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@documents_bp.route("/documents/preview-form", methods=["POST"])
def preview_form():
    """Đọc trước nội dung file Tờ Đơn Excel vừa tải lên."""
    if "file" not in request.files:
        return jsonify({"error": "Vui lòng chọn file Excel tờ đơn"}), 400
    
    f = request.files["file"]
    if not f.filename.endswith((".xlsx", ".xls")):
        return jsonify({"error": "File phải có định dạng .xlsx hoặc .xls"}), 400

    try:
        content = f.read()
        profile = parse_candidate_form_excel(content)
        return jsonify(profile)
    except Exception as e:
        return jsonify({"error": f"Không thể đọc file tờ đơn: {str(e)}"}), 400


@documents_bp.route("/documents/import-form", methods=["POST"])
def import_form():
    """Import và lưu dữ liệu từ file Tờ Đơn Excel vào Database & Master Excel."""
    if "file" not in request.files:
        return jsonify({"error": "Vui lòng chọn file Excel tờ đơn"}), 400
    
    f = request.files["file"]
    if not f.filename.endswith((".xlsx", ".xls")):
        return jsonify({"error": "File phải có định dạng .xlsx hoặc .xls"}), 400

    try:
        content = f.read()
        profile_data = parse_candidate_form_excel(content)
    except Exception as e:
        return jsonify({"error": f"Lỗi đọc file: {str(e)}"}), 400

    db = get_session()
    try:
        c_data = profile_data.get("candidate", {})
        if not c_data.get("full_name_vn"):
            return jsonify({"error": "Tờ đơn chưa có Họ và tên ứng viên"}), 400

        # Auto assign profile code if empty
        if not c_data.get("profile_code"):
            count = db.query(Candidate).count()
            c_data["profile_code"] = f"TTS-{count + 1:03d}"

        valid_cols = set(Candidate.__table__.columns.keys()) - {"id", "created_at", "updated_at"}
        c = Candidate(**{k: v for k, v in c_data.items() if k in valid_cols and v is not None})
        db.add(c)
        db.flush()

        for doc in profile_data.get("identityDocuments", []):
            if doc.get("document_number"):
                cols = {k: v for k, v in doc.items() if k in IdentityDocument.__table__.columns.keys() and k not in ('id', 'candidate_id')}
                db.add(IdentityDocument(**cols, candidate_id=c.id))

        for edu in profile_data.get("educations", []):
            if edu.get("school_name_vn"):
                cols = {k: v for k, v in edu.items() if k in Education.__table__.columns.keys() and k not in ('id', 'candidate_id')}
                db.add(Education(**cols, candidate_id=c.id))

        for work in profile_data.get("workExperiences", []):
            if work.get("company_name_vn"):
                cols = {k: v for k, v in work.items() if k in WorkExperience.__table__.columns.keys() and k not in ('id', 'candidate_id')}
                db.add(WorkExperience(**cols, candidate_id=c.id))

        for fam in profile_data.get("familyMembers", []):
            if fam.get("full_name"):
                cols = {k: v for k, v in fam.items() if k in FamilyMember.__table__.columns.keys() and k not in ('id', 'candidate_id')}
                db.add(FamilyMember(**cols, candidate_id=c.id))

        asgn = profile_data.get("assignment", {})
        if asgn.get("internship_field_vn"):
            db.add(CandidateAssignment(
                candidate_id=c.id,
                internship_field_vn=asgn.get("internship_field_vn")
            ))

        db.commit()
        db.refresh(c)
        result = _build_full_profile(c)
        _sync_excel()
        return jsonify({"ok": True, "candidate_id": c.id, "profile": result}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@documents_bp.route("/documents/import-forms-batch", methods=["POST"])
def import_forms_batch():
    """Import hàng loạt nhiều file Tờ Đơn Excel cùng lúc."""
    files = request.files.getlist("files")
    if not files and "file" in request.files:
        files = [request.files["file"]]

    if not files:
        return jsonify({"error": "Vui lòng chọn ít nhất 1 file Excel tờ đơn"}), 400

    db = get_session()
    imported_list = []
    errors_list = []

    try:
        for f in files:
            filename = f.filename or "unknown.xlsx"
            if not filename.endswith((".xlsx", ".xls")):
                errors_list.append({"file": filename, "error": "Không phải file Excel .xlsx/.xls"})
                continue

            try:
                content = f.read()
                profile_data = parse_candidate_form_excel(content)
                c_data = profile_data.get("candidate", {})
                
                if not c_data.get("full_name_vn"):
                    errors_list.append({"file": filename, "error": "Thiếu Họ và tên trong tờ đơn"})
                    continue

                if not c_data.get("profile_code"):
                    count = db.query(Candidate).count()
                    c_data["profile_code"] = f"TTS-{count + 1:03d}"

                valid_cols = set(Candidate.__table__.columns.keys()) - {"id", "created_at", "updated_at"}
                c = Candidate(**{k: v for k, v in c_data.items() if k in valid_cols and v is not None})
                db.add(c)
                db.flush()

                for doc in profile_data.get("identityDocuments", []):
                    if doc.get("document_number"):
                        cols = {k: v for k, v in doc.items() if k in IdentityDocument.__table__.columns.keys() and k not in ('id', 'candidate_id')}
                        db.add(IdentityDocument(**cols, candidate_id=c.id))

                for edu in profile_data.get("educations", []):
                    if edu.get("school_name_vn"):
                        cols = {k: v for k, v in edu.items() if k in Education.__table__.columns.keys() and k not in ('id', 'candidate_id')}
                        db.add(Education(**cols, candidate_id=c.id))

                for work in profile_data.get("workExperiences", []):
                    if work.get("company_name_vn"):
                        cols = {k: v for k, v in work.items() if k in WorkExperience.__table__.columns.keys() and k not in ('id', 'candidate_id')}
                        db.add(WorkExperience(**cols, candidate_id=c.id))

                for fam in profile_data.get("familyMembers", []):
                    if fam.get("full_name"):
                        cols = {k: v for k, v in fam.items() if k in FamilyMember.__table__.columns.keys() and k not in ('id', 'candidate_id')}
                        db.add(FamilyMember(**cols, candidate_id=c.id))

                asgn = profile_data.get("assignment", {})
                if asgn.get("internship_field_vn"):
                    db.add(CandidateAssignment(
                        candidate_id=c.id,
                        internship_field_vn=asgn.get("internship_field_vn")
                    ))

                db.flush()
                imported_list.append({
                    "id": c.id,
                    "name": c.full_name_vn,
                    "code": c.profile_code,
                    "file": filename
                })

            except Exception as fe:
                errors_list.append({"file": filename, "error": str(fe)})

        db.commit()
        _sync_excel()
        return jsonify({
            "ok": True,
            "total_files": len(files),
            "imported_count": len(imported_list),
            "imported": imported_list,
            "errors": errors_list
        }), (200 if imported_list else 400)

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


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
    """Xuất hồ sơ TCMMXD dạng PDF (履歴書 Rirekisho format)."""
    db = get_session()
    try:
        c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not c:
            return jsonify({"error": "Candidate not found"}), 404
        profile = _build_full_profile(c)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

    try:
        pdf_bytes = build_rirekisho_pdf(profile)
    except Exception as e:
        return jsonify({"error": f"PDF generation failed: {e}"}), 500

    cand = profile.get("candidate", {})
    name = (cand.get("full_name_eng") or cand.get("full_name_vn") or f"candidate_{candidate_id}").upper().replace(" ", "_")
    code = cand.get("profile_code") or str(candidate_id)
    stt = code.split("-")[-1] if "-" in str(code) else str(code)
    filename = f"{stt}. {name.replace('_', ' ')} - TCMMXD.pdf"

    return send_file(
        BytesIO(pdf_bytes),
        as_attachment=True,
        download_name=filename,
        mimetype="application/pdf",
    )


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

                # 1. Export Rirekisho Excel if requested
                if "rirekisho" in templates or "all" in templates:
                    temp_file = os.path.join(temp_dir, f"{uuid.uuid4()}_rirekisho.xlsx")
                    try:
                        fill_rirekisho_excel(cand, template_path, temp_file)
                        zip_file.write(temp_file, arcname=f"{prefix}_{safe_name}_Rirekisho.xlsx")
                    except Exception as e:
                        print(f"Error exporting rirekisho for {cand.id}: {e}")
                    finally:
                        if os.path.exists(temp_file):
                            os.remove(temp_file)

                # 2. Export TCMMXD PDF if requested
                if "tcmmxd" in templates or "tcmmxd_pdf" in templates or "pdf" in templates or "all" in templates:
                    try:
                        profile = _build_full_profile(cand)
                        pdf_bytes = build_rirekisho_pdf(profile)
                        stt = prefix.split("-")[-1] if "-" in str(prefix) else str(prefix)
                        zip_file.writestr(f"{stt}. {safe_name} - TCMMXD.pdf", pdf_bytes)
                    except Exception as e:
                        print(f"Error exporting PDF for {cand.id}: {e}")

            # 3. Export Master Excel if requested
            if "khai_form" in templates or "khai_tt" in templates or "master_excel" in templates or "all" in templates:
                if os.path.exists(config.OUTPUT_FILE):
                    zip_file.write(config.OUTPUT_FILE, arcname="File_luu_Master.xlsx")

            # 4. Export Candidate Blank Form if requested
            if "form_template" in templates or "candidate_form" in templates:
                form_bytes = export_candidate_form_template()
                zip_file.writestr("To_Khai_Ung_Vien_Mau.xlsx", form_bytes)

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

