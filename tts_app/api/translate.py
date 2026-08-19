"""API: Gemini translate Vietnamese → Japanese"""
from flask import Blueprint, request, jsonify
from core.translator import translate_fields, translate_single
from core.database import get_session
from core.models import AppSettings

translate_bp = Blueprint("translate", __name__)


def _get_api_key():
    db = get_session()
    try:
        s = db.query(AppSettings).filter(AppSettings.key == "gemini_api_key").first()
        return s.value if s else ""
    finally:
        db.close()


@translate_bp.route("/translate", methods=["POST"])
def translate_all():
    """
    Translate multiple VNM fields → JPN.
    Body: { "fields": { "ten_vnm": "...", "dia_chi_vnm": "...", ... } }
    """
    body   = request.get_json() or {}
    fields = body.get("fields", {})
    api_key = _get_api_key()

    if not api_key:
        return jsonify({"error": "Chưa cấu hình Gemini API Key. Vào ⚙️ Cài Đặt để nhập."}), 400

    try:
        result = translate_fields(fields, api_key)
        return jsonify({"ok": True, "translations": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@translate_bp.route("/translate/field", methods=["POST"])
def translate_one():
    """
    Translate a single field.
    Body: { "field_name": "dia_chi_vnm", "value": "..." }
    """
    body       = request.get_json() or {}
    field_name = body.get("field_name", "")
    value      = body.get("value", "").strip()
    if not value:
        return jsonify({"error": "Giá trị không được để trống"}), 400

    api_key = _get_api_key()
    is_date = any(k in field_name.lower() for k in ("date", "ngay", "sinh", "dob", "birth", "nam_sinh", "issue_date"))
    if not api_key and not is_date:
        return jsonify({"error": "Chưa cấu hình Gemini API Key. Vào tab Cài Đặt để nhập."}), 400

    try:
        result = translate_single(field_name, value, api_key)
        return jsonify({"ok": True, "translation": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
