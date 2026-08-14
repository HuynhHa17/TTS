"""
TTS Backend — Test Suite
Chạy: cd d:\TTS && python -m pytest tests/test_backend.py -v

Bao phủ:
  - candidates CRUD
  - excel config / preview / export / import
  - translate (no-key branch)
  - settings GET/POST
"""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tts_app'))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tts_app'))

import pytest

# ─── App fixture ──────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def app():
    from run import app as flask_app
    flask_app.config["TESTING"] = True
    from core.database import init_db
    init_db()
    yield flask_app

@pytest.fixture(scope="module")
def client(app):
    return app.test_client()

# ─── Helpers ─────────────────────────────────────────────────────────────────
def jpost(client, url, data):
    return client.post(url, data=json.dumps(data), content_type="application/json")

def jput(client, url, data):
    return client.put(url, data=json.dumps(data), content_type="application/json")

CANDIDATE_MIN = {
    "candidate": {
        "full_name_vn": "Nguyễn Văn Test",
        "full_name_eng": "NGUYEN VAN TEST",
        "full_name_katakana": "グエン ヴァン テスト",
        "gender": "Nam",
        "date_of_birth": "2000-01-15",
        "status": "draft",
    }
}

CANDIDATE_FULL = {
    "candidate": {
        "full_name_vn": "Trần Thị Full",
        "full_name_eng": "TRAN THI FULL",
        "full_name_katakana": "チャン ティ フル",
        "gender": "Nữ",
        "date_of_birth": "1998-06-20",
        "date_of_birth_jp": "1998年06月20日",
        "nationality": "Việt Nam",
        "ethnicity": "Kinh",
        "birthplace_vn": "Hà Nội",
        "birthplace_jp": "ハノイ",
        "address_vn": "123 Phố Huế, Hà Nội",
        "address_jp": "ハノイ市 フエ通り123",
        "phone": "0912345678",
        "marital_status": "Độc thân",
        "has_children": "Không",
        "height_cm": 165, "weight_kg": 52,
        "blood_type": "A",
        "health_status": "Tốt", "hearing": "Bình thường",
        "chronic_disease": "Không", "dental_treatment": "Không",
        "guardian_name_vn": "Trần Văn Cha",
        "guardian_name_jp": "チャン ヴァン チャ",
        "guardian_address_vn": "123 Phố Huế, Hà Nội",
        "guardian_phone": "0987654321",
        "foreign_languages": "Tiếng Nhật N4",
        "japan_relative_flag": "Không",
        "japan_experience_flag": 0, "japan_intern_flag": 0, "coe_refusal_flag": 0,
        "overseas_experience_flag": "Không",
        "skill_summary_vn": "3 năm may mặc",
        "skill_summary_jp": "３年縫製",
        "purpose_to_japan_vn": "Muốn học nghề và kiếm tiền gửi về gia đình",
        "strengths_vn": "Cần cù, chăm chỉ",
        "hobbies_vn": "Đọc sách, nấu ăn",
        "status": "draft",
    },
    "identityDocuments": [
        {"document_type": "CCCD", "document_number": "012345678901",
         "issue_date": "2021-05-10", "issue_place_vn": "Hà Nội"},
        {"document_type": "Passport", "document_number": "B1234567",
         "issue_date": "2022-03-15", "issue_place_vn": "Hà Nội"},
    ],
    "educations": [
        {"school_name_vn": "THPT Chuyên Hà Nội", "school_name_jp": "ハノイ高校",
         "education_level": "THPT", "start_date": "2013-09-01", "end_date": "2016-06-01"},
        {"school_name_vn": "Đại học Bách Khoa Hà Nội", "school_name_jp": "ハノイ工科大学",
         "education_level": "Đại học", "start_date": "2016-09-01", "end_date": "2020-06-01"},
    ],
    "workExperiences": [
        {"company_name_vn": "Công ty May ABC", "company_name_jp": "ABC縫製会社",
         "job_title_vn": "Công nhân may", "start_date": "2020-08-01", "end_date": "2023-07-01"},
    ],
    "familyMembers": [
        {"relationship": "Bố", "full_name": "Trần Văn A", "age": 55, "living_together": "Có"},
        {"relationship": "Mẹ", "full_name": "Lê Thị B", "age": 50, "living_together": "Có"},
    ],
}

# ═══════════════════════════════════════════════════════════════════════════════
# 1. HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════
class TestHealthCheck:
    def test_candidates_endpoint_exists(self, client):
        r = client.get("/api/candidates")
        assert r.status_code == 200

    def test_settings_endpoint_exists(self, client):
        r = client.get("/api/settings")
        assert r.status_code == 200

    def test_excel_config_endpoint_exists(self, client):
        r = client.get("/api/excel/config")
        assert r.status_code == 200

    def test_responses_are_json(self, client):
        for url in ["/api/candidates", "/api/settings", "/api/excel/config"]:
            r = client.get(url)
            assert r.content_type and "json" in r.content_type, f"{url} not JSON"


# ═══════════════════════════════════════════════════════════════════════════════
# 2. CANDIDATES CRUD
# ═══════════════════════════════════════════════════════════════════════════════
class TestCandidatesCRUD:
    created_id = None

    def test_list_returns_list(self, client):
        r = client.get("/api/candidates")
        assert r.status_code == 200
        assert isinstance(json.loads(r.data), list)

    def test_list_supports_pagination(self, client):
        r = client.get("/api/candidates?page=1&limit=5")
        assert r.status_code == 200

    def test_list_supports_search(self, client):
        r = client.get("/api/candidates?q=Nguyen")
        assert r.status_code == 200

    def test_list_supports_status_filter(self, client):
        r = client.get("/api/candidates?status=draft")
        assert r.status_code == 200

    def test_create_minimal(self, client):
        r = jpost(client, "/api/candidates", CANDIDATE_MIN)
        assert r.status_code == 201, r.data
        data = json.loads(r.data)
        assert data["candidate"]["full_name_vn"] == "Nguyễn Văn Test"
        TestCandidatesCRUD.created_id = data["candidate"]["id"]

    def test_create_auto_assigns_profile_code(self, client):
        r = jpost(client, "/api/candidates", {
            "candidate": {"full_name_vn": "Auto Code Test", "status": "draft"}
        })
        assert r.status_code == 201
        assert json.loads(r.data)["candidate"]["profile_code"]

    def test_create_full_profile(self, client):
        r = jpost(client, "/api/candidates", CANDIDATE_FULL)
        assert r.status_code == 201, r.data
        data = json.loads(r.data)
        c = data["candidate"]
        assert c["full_name_vn"] == "Trần Thị Full"
        assert c["height_cm"] == 165
        assert c["has_children"] == "Không"
        assert c["guardian_name_vn"] == "Trần Văn Cha"
        assert c["health_status"] == "Tốt"
        assert c["skill_summary_jp"] == "３年縫製"
        assert len(data["identityDocuments"]) == 2
        assert len(data["educations"]) == 2
        assert len(data["workExperiences"]) == 1
        assert len(data["familyMembers"]) == 2

    def test_get_by_id(self, client):
        cid = TestCandidatesCRUD.created_id
        if not cid:
            pytest.skip("create_minimal failed")
        r = client.get(f"/api/candidates/{cid}")
        assert r.status_code == 200
        assert json.loads(r.data)["candidate"]["id"] == cid

    def test_get_full_profile_structure(self, client):
        cid = TestCandidatesCRUD.created_id
        if not cid:
            pytest.skip("create_minimal failed")
        data = json.loads(client.get(f"/api/candidates/{cid}").data)
        for key in ["candidate", "identityDocuments", "educations",
                    "workExperiences", "familyMembers", "assignment"]:
            assert key in data, f"Missing key: {key}"

    def test_get_404_nonexistent(self, client):
        assert client.get("/api/candidates/999999").status_code == 404

    def test_update_basic_fields(self, client):
        cid = TestCandidatesCRUD.created_id
        if not cid:
            pytest.skip("create_minimal failed")
        r = jput(client, f"/api/candidates/{cid}", {
            "candidate": {"full_name_vn": "Nguyễn Văn Updated", "status": "reviewing"}
        })
        assert r.status_code == 200
        data = json.loads(r.data)["candidate"]
        assert data["full_name_vn"] == "Nguyễn Văn Updated"
        assert data["status"] == "reviewing"

    def test_update_new_fields(self, client):
        cid = TestCandidatesCRUD.created_id
        if not cid:
            pytest.skip("create_minimal failed")
        new_vals = {
            "date_of_birth_jp": "2000年01月15日",
            "ethnicity": "Kinh",
            "has_children": "Không",
            "health_status": "Tốt",
            "hearing": "Bình thường",
            "chronic_disease": "Không",
            "dental_treatment": "Không",
            "guardian_name_vn": "Nguyễn Văn Cha",
            "guardian_phone": "0911111111",
            "foreign_languages": "Tiếng Nhật N3",
            "japan_relative_flag": "Không",
            "skill_summary_vn": "2 năm",
            "skill_summary_jp": "２年",
            "purpose_to_japan_vn": "Muốn học hỏi kinh nghiệm",
            "plan_after_return_vn": "Về nước mở doanh nghiệp",
            "strengths_vn": "Chăm chỉ, cẩn thận",
            "weaknesses_vn": "Đôi khi quá cẩn thận",
            "hobbies_vn": "Đọc sách",
        }
        r = jput(client, f"/api/candidates/{cid}", {"candidate": new_vals})
        assert r.status_code == 200, r.data
        c = json.loads(r.data)["candidate"]
        for k, v in new_vals.items():
            assert c.get(k) == v, f"Field '{k}' expected '{v}', got '{c.get(k)}'"

    def test_update_with_relations(self, client):
        cid = TestCandidatesCRUD.created_id
        if not cid:
            pytest.skip("create_minimal failed")
        r = jput(client, f"/api/candidates/{cid}", {
            "candidate": {"full_name_vn": "Nguyễn Văn Updated"},
            "identityDocuments": [
                {"document_type": "CCCD", "document_number": "000111222333",
                 "issue_date": "2020-01-01", "issue_place_vn": "Hà Nội"},
            ],
            "educations": [
                {"school_name_vn": "Trường THPT ABC", "education_level": "THPT",
                 "start_date": "2012-09-01", "end_date": "2015-06-01"},
            ],
        })
        assert r.status_code == 200
        data = json.loads(r.data)
        assert len(data["identityDocuments"]) == 1
        assert data["identityDocuments"][0]["document_number"] == "000111222333"
        assert len(data["educations"]) == 1

    def test_delete_candidate(self, client):
        r = jpost(client, "/api/candidates", {
            "candidate": {"full_name_vn": "To Delete", "status": "draft"}
        })
        cid = json.loads(r.data)["candidate"]["id"]
        assert client.delete(f"/api/candidates/{cid}").status_code == 200
        assert client.get(f"/api/candidates/{cid}").status_code == 404

    def test_create_missing_name_fails(self, client):
        r = jpost(client, "/api/candidates", {"candidate": {}})
        assert r.status_code in (400, 500)


# ═══════════════════════════════════════════════════════════════════════════════
# 3. ALL NEW FIELDS ROUND-TRIP
# ═══════════════════════════════════════════════════════════════════════════════
class TestNewFields:
    NEW_FIELDS = [
        "date_of_birth_jp", "ethnicity", "has_children",
        "health_status", "hearing", "chronic_disease", "chronic_disease_name",
        "dental_treatment", "guardian_name_vn", "guardian_name_jp",
        "guardian_address_vn", "guardian_address_jp", "guardian_phone",
        "foreign_languages", "japan_relative_flag", "japan_relative_info",
        "overseas_experience_flag", "overseas_experience_info",
        "skill_summary_vn", "skill_summary_jp",
        "purpose_to_japan_vn", "purpose_to_japan_jp",
        "plan_after_return_vn", "plan_after_return_jp",
        "strengths_vn", "strengths_jp",
        "weaknesses_vn", "weaknesses_jp",
        "hobbies_vn", "hobbies_jp",
    ]

    def test_all_new_fields_in_list(self, client):
        r = client.get("/api/candidates?limit=1")
        data = json.loads(r.data)
        if not data:
            pytest.skip("Empty DB")
        for f in self.NEW_FIELDS:
            assert f in data[0], f"MISSING in list: '{f}'"

    def test_all_new_fields_in_detail(self, client):
        items = json.loads(client.get("/api/candidates?limit=1").data)
        if not items:
            pytest.skip("Empty DB")
        data = json.loads(client.get(f"/api/candidates/{items[0]['id']}").data)
        for f in self.NEW_FIELDS:
            assert f in data["candidate"], f"MISSING in detail: '{f}'"


# ═══════════════════════════════════════════════════════════════════════════════
# 4. SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════
class TestSettings:
    def test_get_returns_required_keys(self, client):
        data = json.loads(client.get("/api/settings").data)
        for key in ["cv_path", "output_path", "gemini_api_key_set"]:
            assert key in data, f"Missing '{key}' in settings"

    def test_post_saves_key(self, client):
        r = jpost(client, "/api/settings", {"__test_key__": "hello_world"})
        assert r.status_code == 200
        assert json.loads(r.data).get("ok")

    def test_saved_key_persists(self, client):
        jpost(client, "/api/settings", {"__persist_test__": "value_abc"})
        data = json.loads(client.get("/api/settings").data)
        assert data.get("__persist_test__") == "value_abc"


# ═══════════════════════════════════════════════════════════════════════════════
# 5. EXCEL I/O
# ═══════════════════════════════════════════════════════════════════════════════
class TestExcelIO:
    def test_config_returns_path_and_exists(self, client):
        data = json.loads(client.get("/api/excel/config").data)
        assert "path" in data
        assert isinstance(data["exists"], bool)

    def test_config_set_valid_path(self, client):
        r = jpost(client, "/api/excel/config", {"path": r"D:\TTS\File_luu_test.xlsx"})
        assert r.status_code == 200
        assert json.loads(r.data).get("ok")

    def test_config_set_empty_path_fails(self, client):
        r = jpost(client, "/api/excel/config", {"path": ""})
        assert r.status_code == 400

    def test_preview_valid_structure_or_404(self, client):
        jpost(client, "/api/excel/config", {"path": r"D:\TTS\File_lưu.xlsx"})
        r = client.get("/api/excel/preview")
        if r.status_code == 200:
            data = json.loads(r.data)
            assert "headers" in data and "rows" in data
            assert len(data["headers"]) == 60
            assert isinstance(data["rows"], list)
        else:
            assert r.status_code == 404

    def test_export_returns_exported_count(self, client):
        jpost(client, "/api/excel/config", {"path": r"D:\TTS\File_lưu.xlsx"})
        r = client.get("/api/excel/export")
        data = json.loads(r.data)
        if r.status_code == 200:
            assert data.get("ok") and "exported" in data
        else:
            assert "error" in data  # file bị lock hoặc lỗi khác

    def test_import_nonexistent_file_returns_404(self, client):
        jpost(client, "/api/excel/config", {"path": r"D:\TTS\_not_exist_.xlsx"})
        r = jpost(client, "/api/excel/import", {})
        assert r.status_code == 404
        assert "error" in json.loads(r.data)

    def test_import_with_real_file(self, client):
        jpost(client, "/api/excel/config", {"path": r"D:\TTS\File_lưu.xlsx"})
        r = jpost(client, "/api/excel/import", {})
        data = json.loads(r.data)
        if r.status_code == 200:
            assert "created" in data and "skipped" in data and "errors" in data
        else:
            assert r.status_code == 404  # file chưa có


# ═══════════════════════════════════════════════════════════════════════════════
# 6. TRANSLATE
# ═══════════════════════════════════════════════════════════════════════════════
class TestTranslate:
    def test_translate_without_key_returns_400_or_200(self, client):
        r = jpost(client, "/api/translate", {"fields": {"ten_vnm": "Nguyễn Văn A"}})
        assert r.status_code in (200, 400)
        if r.status_code == 400:
            err = json.loads(r.data).get("error", "")
            assert any(w in err for w in ["Gemini", "API", "key", "Key"])

    def test_translate_field_empty_value_400(self, client):
        r = jpost(client, "/api/translate/field", {"field_name": "ten_vnm", "value": ""})
        assert r.status_code == 400

    def test_translate_single_no_key_or_200(self, client):
        r = jpost(client, "/api/translate/field", {
            "field_name": "dia_chi_vnm", "value": "123 Phố Huế, Hà Nội"
        })
        assert r.status_code in (200, 400)

    def test_translate_empty_fields_no_crash(self, client):
        r = jpost(client, "/api/translate", {"fields": {}})
        assert r.status_code in (200, 400)
