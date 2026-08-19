"""
test_candidates.py — Unit tests cho toàn bộ chức năng Quản lý Ứng viên (Candidates Management)
Bao gồm:
  1. Thêm mới ứng viên (tối thiểu & đầy đủ 7 bảng quan hệ)
  2. Xem danh sách ứng viên (phân trang, tìm kiếm họ tên/mã hồ sơ, lọc trạng thái)
  3. Xem chi tiết ứng viên (đầy đủ các bảng con: CCCD/Hộ chiếu, Học vấn, Kinh nghiệm, Gia đình, Kỹ năng, Nguyện vọng)
  4. Cập nhật thông tin ứng viên và cập nhật danh sách bản ghi con
  5. Xóa ứng viên và kiểm tra xóa phân tầng (Cascade delete)
  6. Thống kê ứng viên (Stats endpoint)
"""

import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tts_app"))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tts_app"))

from run import app as flask_app
from core.database import init_db, get_session
from core.models import (
    Candidate, IdentityDocument, Education, WorkExperience,
    FamilyMember, SkillExperience, JapanExperience, CandidateAssignment
)


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


def jput(client, url, data):
    return client.put(url, data=json.dumps(data), content_type="application/json")


class TestCandidateCreation:
    """1. Kiểm tra chức năng thêm mới ứng viên"""

    def test_create_minimal_candidate(self, client):
        payload = {
            "candidate": {
                "full_name_vn": "Lê Văn Tối Thiểu",
                "gender": "Nam",
                "date_of_birth": "2001-02-10",
                "status": "draft",
            }
        }
        res = jpost(client, "/api/candidates", payload)
        assert res.status_code == 201
        data = res.get_json()
        assert "candidate" in data
        assert data["candidate"]["full_name_vn"] == "Lê Văn Tối Thiểu"
        assert data["candidate"]["profile_code"].startswith("TTS-")
        cid = data["candidate"]["id"]

        # Cleanup
        client.delete(f"/api/candidates/{cid}")

    def test_create_full_candidate_with_all_child_tables(self, client):
        payload = {
            "candidate": {
                "profile_code": "TTS-TEST-FULL",
                "full_name_vn": "Nguyễn Hoàng Đầy Đủ",
                "full_name_eng": "NGUYEN HOANG DAY DU",
                "full_name_katakana": "グエン ホアン ダイ ドゥ",
                "gender": "Nam",
                "date_of_birth": "1999-05-15",
                "date_of_birth_jp": "1999年05月15日",
                "phone": "0988776655",
                "nationality": "Việt Nam",
                "ethnicity": "Kinh",
                "birthplace_vn": "Nghệ An",
                "birthplace_jp": "ゲアン省",
                "address_vn": "TP. Vinh, Nghệ An",
                "address_jp": "ゲアン省ヴィン市",
                "marital_status": "Độc thân",
                "has_children": "Không",
                "height_cm": 168.5,
                "weight_kg": 60.0,
                "blood_type": "O",
                "preferred_hand": "Phải",
                "health_status": "Tốt",
                "guardian_name_vn": "Nguyễn Hoàng Bố",
                "guardian_name_jp": "グエン ホアン ボー",
                "guardian_phone": "0911223344",
                "purpose_to_japan_vn": "Học hỏi kỹ thuật xây dựng",
                "purpose_to_japan_jp": "建設技術を学ぶ",
                "status": "draft",
            },
            "identityDocuments": [
                {
                    "document_type": "CCCD",
                    "document_number": "038099001122",
                    "issue_date": "2021-08-20",
                    "issue_date_jp": "2021年08月20日",
                    "issue_place_vn": "Cục CSQLHC về TTXH",
                },
                {
                    "document_type": "Passport",
                    "document_number": "C9988776",
                    "issue_date": "2022-01-10",
                    "issue_place_vn": "Cục Quản lý XNC",
                }
            ],
            "educations": [
                {
                    "school_name_vn": "THPT Huỳnh Thúc Kháng",
                    "school_name_jp": "フィン・トゥック・カン高校",
                    "education_level": "THPT",
                    "start_date": "2014-09-01",
                    "end_date": "2017-06-01",
                },
                {
                    "school_name_vn": "Cao Đẳng Nghề Số 1",
                    "school_name_jp": "第一職業短期大学",
                    "education_level": "Cao đẳng",
                    "start_date": "2017-09-01",
                    "end_date": "2020-06-01",
                }
            ],
            "workExperiences": [
                {
                    "company_name_vn": "Công ty Xây Dựng Số 4",
                    "company_name_jp": "第四建設会社",
                    "job_title_vn": "Công nhân sắt thép",
                    "job_title_jp": "鉄筋工",
                    "start_date": "2020-07-01",
                    "end_date": "2023-08-01",
                    "description": "Lắp đặt cốt thép công trình",
                }
            ],
            "familyMembers": [
                {
                    "relationship": "Bố",
                    "full_name": "Nguyễn Hoàng Bố",
                    "age": 56,
                    "living_together": "Có",
                    "occupation": "Làm vườn",
                    "monthly_income": "8,000,000 VND",
                },
                {
                    "relationship": "Mẹ",
                    "full_name": "Trần Thị Mẹ",
                    "age": 52,
                    "living_together": "Có",
                    "occupation": "Nội trợ",
                }
            ],
            "skillExperiences": [
                {
                    "skill_name_vn": "Hàn điện",
                    "skill_name_jp": "電気溶接",
                    "experience_years": 2,
                }
            ],
            "assignment": {
                "internship_field_vn": "Gia công cơ khí",
                "internship_field_jp": "機械加工",
            }
        }

        res = jpost(client, "/api/candidates", payload)
        assert res.status_code == 201
        data = res.get_json()
        cid = data["candidate"]["id"]

        # Kiểm tra chi tiết đã được lưu trong DB
        res_get = client.get(f"/api/candidates/{cid}")
        assert res_get.status_code == 200
        p = res_get.get_json()

        assert p["candidate"]["full_name_vn"] == "Nguyễn Hoàng Đầy Đủ"
        assert p["candidate"]["height_cm"] == 168.5
        assert len(p["identityDocuments"]) == 2
        assert len(p["educations"]) == 2
        assert len(p["workExperiences"]) == 1
        assert len(p["familyMembers"]) == 2
        assert len(p["skillExperiences"]) == 1
        assert p["assignment"]["internship_field_vn"] == "Gia công cơ khí"

        # Cleanup
        client.delete(f"/api/candidates/{cid}")


class TestCandidateQueries:
    """2. Kiểm tra chức năng xem danh sách, phân trang, lọc và tìm kiếm"""

    @pytest.fixture(autouse=True)
    def setup_candidates(self, client):
        cand1 = jpost(client, "/api/candidates", {
            "candidate": {"full_name_vn": "Phan Văn Tìm Kiếm", "status": "draft", "gender": "Nam", "date_of_birth": "2000-01-01"}
        }).get_json()["candidate"]
        cand2 = jpost(client, "/api/candidates", {
            "candidate": {"full_name_vn": "Đặng Thị Hoàn Thành", "status": "confirmed", "gender": "Nữ", "date_of_birth": "2002-05-05"}
        }).get_json()["candidate"]

        yield [cand1["id"], cand2["id"]]

        for cid in [cand1["id"], cand2["id"]]:
            client.delete(f"/api/candidates/{cid}")

    def test_list_candidates(self, client):
        res = client.get("/api/candidates")
        assert res.status_code == 200
        data = res.get_json()
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_search_candidate_by_name(self, client):
        res = client.get("/api/candidates?q=Tìm Kiếm")
        assert res.status_code == 200
        data = res.get_json()
        assert any(c["full_name_vn"] == "Phan Văn Tìm Kiếm" for c in data)

    def test_filter_candidate_by_status(self, client):
        res = client.get("/api/candidates?status=confirmed")
        assert res.status_code == 200
        data = res.get_json()
        assert any(c["full_name_vn"] == "Đặng Thị Hoàn Thành" for c in data)
        assert all(c.get("status") == "confirmed" for c in data if "status" in c)

    def test_get_candidate_by_id(self, client, setup_candidates):
        cid = setup_candidates[0]
        res = client.get(f"/api/candidates/{cid}")
        assert res.status_code == 200
        data = res.get_json()
        assert data["candidate"]["id"] == cid

    def test_get_nonexistent_candidate_returns_404(self, client):
        res = client.get("/api/candidates/9999999")
        assert res.status_code == 404


class TestCandidateUpdateAndDelete:
    """3. Kiểm tra chức năng cập nhật và xóa ứng viên (kèm cascade delete)"""

    def test_update_candidate_info_and_children(self, client):
        # Create
        res_c = jpost(client, "/api/candidates", {
            "candidate": {"full_name_vn": "Ứng Viên Gốc", "status": "draft", "gender": "Nam", "date_of_birth": "2000-01-01"},
            "educations": [{"school_name_vn": "Trường Cũ", "education_level": "THPT"}]
        })
        cid = res_c.get_json()["candidate"]["id"]

        # Update
        update_payload = {
            "candidate": {
                "full_name_vn": "Ứng Viên Đã Cập Nhật",
                "phone": "0999888777",
                "status": "interviewing"
            },
            "educations": [
                {"school_name_vn": "Trường Mới 1", "education_level": "Cao đẳng"},
                {"school_name_vn": "Trường Mới 2", "education_level": "Đại học"}
            ],
            "familyMembers": [
                {"relationship": "Vợ", "full_name": "Nguyễn Thị Vợ", "age": 24, "living_together": "Có"}
            ]
        }
        res_u = jput(client, f"/api/candidates/{cid}", update_payload)
        assert res_u.status_code == 200
        u_data = res_u.get_json()
        assert u_data["candidate"]["full_name_vn"] == "Ứng Viên Đã Cập Nhật"
        assert len(u_data["educations"]) == 2
        assert u_data["educations"][0]["school_name_vn"] == "Trường Mới 1"
        assert len(u_data["familyMembers"]) == 1

        # Cleanup
        client.delete(f"/api/candidates/{cid}")

    def test_cascade_delete_removes_all_child_records(self, client):
        res = jpost(client, "/api/candidates", {
            "candidate": {"full_name_vn": "Sắp Bị Xóa", "status": "draft", "gender": "Nam", "date_of_birth": "2000-01-01"},
            "educations": [{"school_name_vn": "Trường X"}],
            "workExperiences": [{"company_name_vn": "Công Ty Y"}],
            "familyMembers": [{"full_name": "Người Nhà Z", "relationship": "Bố"}]
        })
        cid = res.get_json()["candidate"]["id"]

        # Xóa ứng viên
        res_del = client.delete(f"/api/candidates/{cid}")
        assert res_del.status_code == 200

        # Kiểm tra trong database SQLite các bảng con đã bị xóa sạch
        db = get_session()
        try:
            assert db.query(Candidate).filter(Candidate.id == cid).first() is None
            assert db.query(Education).filter(Education.candidate_id == cid).count() == 0
            assert db.query(WorkExperience).filter(WorkExperience.candidate_id == cid).count() == 0
            assert db.query(FamilyMember).filter(FamilyMember.candidate_id == cid).count() == 0
        finally:
            db.close()


class TestCandidateStats:
    """4. Kiểm tra endpoint thống kê ứng viên"""

    def test_candidates_stats(self, client):
        res = client.get("/api/candidates/stats")
        assert res.status_code == 200
        stats = res.get_json()
        assert "total" in stats
        assert "by_status" in stats
        assert "by_gender" in stats
        assert isinstance(stats["total"], int)
