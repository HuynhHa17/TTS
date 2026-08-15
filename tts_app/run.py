"""
TTS Master Dashboard — Entry Point
Run: python run.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from flask_cors import CORS

import config
from core.database import init_db
from api.candidates   import candidates_bp
# from api.import_cv    import import_cv_bp
# from api.import_gsheet import import_gsheet_bp
# from api.export       import export_bp
from api.translate    import translate_bp
# from api.lookup       import lookup_bp
from api.settings     import settings_bp
from api.excel_io     import excel_io_bp
from api.documents    import documents_bp

app = Flask(__name__)
app.secret_key = config.SECRET_KEY
CORS(app)

# Register blueprints
app.register_blueprint(candidates_bp,    url_prefix="/api")
# app.register_blueprint(import_cv_bp,     url_prefix="/api")
# app.register_blueprint(import_gsheet_bp, url_prefix="/api")
# app.register_blueprint(export_bp,        url_prefix="/api")
app.register_blueprint(translate_bp,     url_prefix="/api")
# app.register_blueprint(lookup_bp,        url_prefix="/api")
app.register_blueprint(settings_bp,      url_prefix="/api")
app.register_blueprint(excel_io_bp,      url_prefix="/api")
app.register_blueprint(documents_bp,     url_prefix="/api")



if __name__ == "__main__":
    import sys, io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    print("\n[TTS] TTS Master Dashboard dang khoi dong...")
    print(f"   CV Input : {config.CV_FILE}")
    print(f"   Output   : {config.OUTPUT_FILE}")
    print(f"   Database : {config.DB_PATH}")
    init_db()

    # Auto-backup khi khởi động
    try:
        from core.backup import create_backup
        bp = create_backup(reason="startup")
        if bp:
            print(f"   ✅ Backup: {os.path.basename(bp)}")
    except Exception as e:
        print(f"   ⚠️ Backup failed: {e}")

    print(f"\n[OK] Mo trinh duyet: http://localhost:{config.PORT}\n")
    app.run(debug=config.DEBUG, port=config.PORT, use_reloader=False)

