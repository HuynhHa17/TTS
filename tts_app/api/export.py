"""API: Export to File_lưu.xlsx"""
import os
import json
from io import BytesIO
import openpyxl
from flask import Blueprint, jsonify, send_file, request
from core.database import get_session
from core.models import Candidate, Syndicate, Company, COL60_HEADERS, AppSettings
from core.exporter import export_to_excel, _style_header_row
import config

export_bp = Blueprint("export", __name__)

@export_bp.route("/export/template", methods=["GET"])
def export_template():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Form Mau"

    headers = ["STT"] + COL60_HEADERS[1:]

    db = get_session()
    try:
        settings = db.query(AppSettings).first()
        if settings and settings.custom_field_defs:
            cfs = json.loads(settings.custom_field_defs)
            for f in cfs:
                headers.append(f.get("label", ""))
                if f.get("requireJp"):
                    headers.append(f.get("label", "") + " (JPN)")
    except Exception:
        pass
    finally:
        db.close()

    for col_idx, h in enumerate(headers, 1):
        ws.cell(row=1, column=col_idx, value=h)

    _style_header_row(ws, 1, len(headers))
    for c in range(1, len(headers) + 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(c)].width = 20

    out = BytesIO()
    wb.save(out)
    out.seek(0)

    return send_file(
        out,
        as_attachment=True,
        download_name="Form_Mau_TTS.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@export_bp.route("/export", methods=["GET"])
def export_excel():
    db = get_session()
    try:
        candidates = db.query(Candidate).order_by(Candidate.id).all()
        syndicates = db.query(Syndicate).order_by(Syndicate.id).all()
        companies  = db.query(Company).order_by(Company.id).all()

        c_dicts = [c.to_dict() for c in candidates]
        s_dicts = [s.to_dict() for s in syndicates]
        co_dicts= [co.to_dict() for co in companies]
    finally:
        db.close()

    sheet_name = request.args.get("sheet", None)
    out_path   = config.OUTPUT_FILE

    export_to_excel(c_dicts, s_dicts, co_dicts, out_path, sheet_name)

    return send_file(
        out_path,
        as_attachment=True,
        download_name="File_lưu.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@export_bp.route("/export/path", methods=["GET"])
def export_info():
    """Return output file path info."""
    return jsonify({
        "output_path": config.OUTPUT_FILE,
        "cv_path":     config.CV_FILE,
        "exists":      os.path.exists(config.OUTPUT_FILE),
    })
