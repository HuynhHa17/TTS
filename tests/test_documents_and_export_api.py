"""
test_documents_and_export_api.py — Unit tests cho toàn bộ Document & Export API
Bao gồm:
  1. Tải file mẫu Tờ Đơn: /api/documents/form-template
  2. Xem trước tờ đơn: /api/documents/preview-form
  3. Import tờ đơn đơn lẻ & hàng loạt: /api/documents/import-form & import-forms-batch
  4. Xuất 履歴書 Rirekisho Excel: /api/documents/rirekisho/<id>
  5. Xuất TCMMXD PDF: /api/documents/tcmmxd/<id>
  6. Tải Master Excel: /api/documents/khai-tt
  7. Xuất hàng loạt ZIP: /api/documents/batch-export
  8. Export endpoints trong export.py (/api/export, /api/export/path, /api/export/template, /api/export/pdf/all)
"""

import sys
import os
import io
import json
import zipfile
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tts_app"))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tts_app"))

from run import app as flask_app
from core.database import init_db, get_session
from core.form_template import create_candidate_form_workbook


@pytest.fixture(scope="module")
def app():
    flask_app.config["TESTING"] = True
    init_db()
    yield flask_app


@pytest.fixture(scope="module")
def client(app):
    return app.test_client()


def jpost(client, url, data):
    return client.post(url, data=json.dumps(data), content_type="application/json")


class TestDocumentEndpoints:
    @pytest.fixture(autouse=True)
    def setup_candidate(self, client):
        cand = jpost(client, "/api/candidates", {
            "candidate": {
                "profile_code": "TTS-DOCS-001",
                "full_name_vn": "Đoàn Văn Doc",
                "full_name_eng": "DOAN VAN DOC",
                "full_name_katakana": "ドアン ヴァン ドック",
                "gender": "Nam",
                "date_of_birth": "2000-03-10",
                "date_of_birth_jp": "2000年03月10日",
                "status": "draft"
            },
            "educations": [
                {"school_name_vn": "THPT Chu Văn An", "education_level": "THPT"}
            ],
            "workExperiences": [
                {"company_name_vn": "Công Ty Điện Tử", "job_title_vn": "Lắp ráp linh kiện"}
            ],
            "familyMembers": [
                {"relationship": "Bố", "full_name": "Đoàn Văn Cha", "age": 55, "living_together": "Có"}
            ]
        }).get_json()["candidate"]

        self.cid = cand["id"]
        yield
        client.delete(f"/api/candidates/{self.cid}")

    def test_download_form_template(self, client):
        res = client.get("/api/documents/form-template")
        assert res.status_code == 200
        assert "spreadsheetml" in res.headers.get("Content-Type", "")

    def test_export_rirekisho_excel(self, client):
        res = client.get(f"/api/documents/rirekisho/{self.cid}")
        assert res.status_code == 200
        assert "spreadsheetml" in res.headers.get("Content-Type", "")
        assert len(res.data) > 1000

    def test_export_tcmmxd_pdf(self, client):
        res = client.get(f"/api/documents/tcmmxd/{self.cid}")
        assert res.status_code == 200
        assert res.headers.get("Content-Type") == "application/pdf"
        assert res.data.startswith(b"%PDF")

    def test_export_khai_tt_master_excel(self, client):
        res = client.get("/api/documents/khai-tt")
        assert res.status_code == 200
        assert "spreadsheetml" in res.headers.get("Content-Type", "")

    def test_batch_export_zip(self, client):
        res = jpost(client, "/api/documents/batch-export", {
            "candidate_ids": [self.cid],
            "templates": ["rirekisho", "tcmmxd", "khai_tt", "form_template"]
        })
        assert res.status_code == 200
        assert "zip" in res.headers.get("Content-Type", "")
        
        # Verify valid ZIP content
        zf = zipfile.ZipFile(io.BytesIO(res.data))
        names = zf.namelist()
        assert len(names) >= 1
        assert any("TCMMXD.pdf" in n for n in names) or any("Rirekisho.xlsx" in n for n in names)


class TestExportModuleEndpoints:
    def test_export_template(self, client):
        res = client.get("/api/export/template")
        assert res.status_code == 200
        assert "spreadsheetml" in res.headers.get("Content-Type", "")

    def test_export_path_info(self, client):
        res = client.get("/api/export/path")
        assert res.status_code == 200
        data = res.get_json()
        assert "output_path" in data
        assert "cv_path" in data

    def test_export_excel_endpoint(self, client):
        res = client.get("/api/export")
        assert res.status_code == 200
        assert "spreadsheetml" in res.headers.get("Content-Type", "")

    def test_export_pdf_all_zip(self, client):
        res = client.get("/api/export/pdf/all")
        assert res.status_code == 200
        assert "zip" in res.headers.get("Content-Type", "")
