"""API: App settings (Gemini API Key, etc.)"""
from flask import Blueprint, request, jsonify
from core.database import get_session
from core.models import AppSettings
import config

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/settings", methods=["GET"])
def get_settings():
    db = get_session()
    try:
        rows = db.query(AppSettings).all()
        data = {r.key: r.value for r in rows}
        # Mask API key
        if "gemini_api_key" in data and data["gemini_api_key"]:
            k = data["gemini_api_key"]
            data["gemini_api_key_masked"] = k[:8] + "..." + k[-4:] if len(k) > 12 else "****"
            data["gemini_api_key_set"] = True
        else:
            data["gemini_api_key_masked"] = ""
            data["gemini_api_key_set"] = False
        data["cv_path"]     = config.CV_FILE
        data["output_path"] = config.OUTPUT_FILE
        return jsonify(data)
    finally:
        db.close()


@settings_bp.route("/settings", methods=["POST"])
def save_settings():
    db = get_session()
    try:
        data = request.get_json() or {}
        for key, value in data.items():
            row = db.query(AppSettings).filter(AppSettings.key == key).first()
            if row:
                row.value = value
            else:
                db.add(AppSettings(key=key, value=value))
        db.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
