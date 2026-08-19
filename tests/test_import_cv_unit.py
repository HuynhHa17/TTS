"""
test_import_cv_unit.py — Unit tests cho chức năng Import CV từ file CVpv.xlsx
Bao gồm:
  1. Preview dữ liệu từ file CVpv.xlsx (multipart upload & JSON path)
  2. Confirm import với các chế độ xung đột (conflict_mode: 'update', 'skip', 'create')
  3. Kiểm tra lưu tự động các bảng con Education, WorkExperience, FamilyMember
"""

import sys
import os
import io
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tts_app"))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tts_app"))

from run import app as flask_app
from core.database import init_db, get_session
from core.models import Candidate, Education, WorkExperience, FamilyMember
import config


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


class TestImportCVEndpoints:
    def test_preview_cv_from_default_path(self, client):
        if not os.path.exists(config.CV_FILE):
            pytest.skip("CVpv.xlsx không tồn tại tại đường dẫn mặc định")

        res = jpost(client, "/api/import/cv/preview", {"path": config.CV_FILE})
        assert res.status_code == 200
        data = res.get_json()
        assert "records" in data
        assert "count" in data
        assert isinstance(data["records"], list)
        assert data["count"] >= 0

    def test_confirm_cv_import_with_child_records(self, client):
        records = [
            {
                "profile_code": "TTS-TEST-CV1",
                "full_name_vn": "HOANG VAN THU",
                "full_name_eng": "HOANG VAN THU",
                "full_name_katakana": "ホアン ヴァン トゥー",
                "date_of_birth": "20/05/2000",
                "date_of_birth_jp": "2000年05月20日",
                "gender": "Nam",
                "marital_status": "Độc thân",
                "address_jp": "ハノイ市",
                "birthplace_jp": "ハイフォン市",
                "educations": [
                    {
                        "school_name_jp": "ハイフォン高校",
                        "school_name_vn": "THPT Hải Phòng",
                        "start_date": "2015年09月",
                        "end_date": "2018年06月",
                    }
                ],
                "work_experiences": [
                    {
                        "company_name_jp": "建設会社",
                        "company_name_vn": "Công ty Xây Dựng",
                        "job_title_jp": "とび工",
                        "start_date": "2018年08月",
                        "end_date": "2022年12月",
                    }
                ],
                "family_members": [
                    {
                        "relationship": "Cha",
                        "full_name": "HOANG VAN BO",
                        "age": 55,
                        "living_together": "Có",
                        "occupation": "自営業",
                    }
                ]
            }
        ]

        # 1. Import tạo mới
        res = jpost(client, "/api/import/cv/confirm", {
            "records": records,
            "conflict_mode": "create"
        })
        assert res.status_code == 200
        data = res.get_json()
        assert data["ok"] is True
        assert data["created"] >= 1

        # Kiểm tra trong DB
        db = get_session()
        try:
            cand = db.query(Candidate).filter(Candidate.profile_code == "TTS-TEST-CV1").first()
            assert cand is not None
            assert cand.full_name_vn == "HOANG VAN THU"
            assert len(cand.educations) >= 1
            assert cand.educations[0].school_name_jp == "ハイフォン高校"
            assert len(cand.work_experiences) >= 1
            assert cand.work_experiences[0].company_name_jp == "建設会社"
            assert len(cand.family_members) >= 1
            assert cand.family_members[0].full_name == "HOANG VAN BO"
            cand_id = cand.id
        finally:
            db.close()

        # 2. Import cập nhật (conflict_mode = update)
        records[0]["full_name_vn"] = "HOANG VAN THU UPDATED"
        res_update = jpost(client, "/api/import/cv/confirm", {
            "records": records,
            "conflict_mode": "update"
        })
        assert res_update.status_code == 200
        assert res_update.get_json()["updated"] >= 1

        # 3. Import bỏ qua (conflict_mode = skip)
        res_skip = jpost(client, "/api/import/cv/confirm", {
            "records": records,
            "conflict_mode": "skip"
        })
        assert res_skip.status_code == 200
        assert res_skip.get_json()["skipped"] >= 1

        # Cleanup
        client.delete(f"/api/candidates/{cand_id}")
