"""
test_pdf_exporter_unit.py — Unit tests cho chức năng xuất PDF 履歴書 (Rirekisho / TCMMXD PDF)
Bao gồm:
  1. Xuất PDF hồ sơ tối thiểu
  2. Xuất PDF hồ sơ đầy đủ (Kèm tiếng Nhật, tiếng Việt, học vấn, kinh nghiệm, gia đình)
  3. Kiểm tra tính hợp lệ của tệp nhị phân PDF (%PDF header)
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tts_app"))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tts_app"))

from core.pdf_exporter import build_rirekisho_pdf


class TestPdfExporter:
    def test_build_pdf_minimal_candidate(self):
        profile = {
            "candidate": {
                "id": 1,
                "profile_code": "TTS-001",
                "full_name_vn": "Nguyễn Văn Đơn Giản",
                "full_name_eng": "NGUYEN VAN DON GIAN",
                "full_name_katakana": "グエン ヴァン ドン ジアン",
                "gender": "Nam",
                "date_of_birth": "2001-01-01",
                "date_of_birth_jp": "2001年01月01日",
                "status": "draft",
            },
            "identityDocuments": [],
            "educations": [],
            "workExperiences": [],
            "familyMembers": [],
            "skillExperiences": [],
            "japanExperiences": [],
            "assignment": {}
        }

        pdf_bytes = build_rirekisho_pdf(profile)
        assert isinstance(pdf_bytes, (bytes, bytearray))
        assert len(pdf_bytes) > 1000
        # Valid PDF header
        assert pdf_bytes.startswith(b"%PDF")

    def test_build_pdf_full_candidate(self):
        profile = {
            "candidate": {
                "id": 2,
                "profile_code": "TTS-002",
                "full_name_vn": "Trần Thị Hoàn Chỉnh",
                "full_name_eng": "TRAN THI HOAN CHINH",
                "full_name_katakana": "チャン ティ ホアン チン",
                "gender": "Nữ",
                "date_of_birth": "1998-10-15",
                "date_of_birth_jp": "1998年10月15日",
                "birthplace_vn": "Hà Tĩnh",
                "birthplace_jp": "ハティン省",
                "address_vn": "TP. Hà Tĩnh",
                "address_jp": "ハティン市",
                "phone": "0912345678",
                "marital_status": "Đã kết hôn",
                "has_children": "Có",
                "height_cm": 160.0,
                "weight_kg": 50.0,
                "blood_type": "AB",
                "vision_left": "10/10",
                "vision_right": "10/10",
                "preferred_hand": "Phải",
                "health_status": "Tốt",
                "guardian_name_vn": "Trần Văn Cha",
                "guardian_name_jp": "チャン ヴァン チャ",
                "guardian_phone": "0987654321",
                "purpose_to_japan_vn": "Học tập công nghệ may mặc hiện đại",
                "purpose_to_japan_jp": "最新の縫製技術を学ぶ",
                "plan_after_return_vn": "Mở xưởng may tại quê nhà",
                "plan_after_return_jp": "地元で縫製工場を開く",
                "strengths_vn": "Tỉ mỉ, kiên nhẫn",
                "strengths_jp": "几帳面、辛抱強い",
                "weaknesses_vn": "Ít nói",
                "weaknesses_jp": "無口",
                "hobbies_vn": "Nấu ăn",
                "hobbies_jp": "料理",
            },
            "identityDocuments": [
                {"document_type": "CCCD", "document_number": "042098001234", "issue_date": "2020-05-15", "issue_place_vn": "Hà Tĩnh"}
            ],
            "educations": [
                {"school_name_vn": "THPT Phan Đình Phùng", "school_name_jp": "ファン・ディン・フン高校", "education_level": "THPT", "start_date": "2013-09-01", "end_date": "2016-06-01"},
                {"school_name_vn": "Đại Học Dệt May", "school_name_jp": "繊維大学", "education_level": "Đại học", "start_date": "2016-09-01", "end_date": "2020-06-01"}
            ],
            "workExperiences": [
                {"company_name_vn": "May 10", "company_name_jp": "May 10社", "job_title_vn": "Thợ may", "job_title_jp": "縫製工", "start_date": "2020-07-01", "end_date": "2023-06-01"}
            ],
            "familyMembers": [
                {"relationship": "Bố", "full_name": "Trần Văn Cha", "age": 58, "living_together": "Có", "occupation": "Làm nông"},
                {"relationship": "Mẹ", "full_name": "Phan Thị Mẹ", "age": 55, "living_together": "Có", "occupation": "Nội trợ"},
                {"relationship": "Chồng", "full_name": "Lê Văn Chồng", "age": 30, "living_together": "Có", "occupation": "Kỹ sư"}
            ],
            "skillExperiences": [],
            "japanExperiences": [],
            "assignment": {
                "internship_field_vn": "May mặc",
                "internship_field_jp": "衣服製造"
            }
        }

        pdf_bytes = build_rirekisho_pdf(profile)
        assert isinstance(pdf_bytes, (bytes, bytearray))
        assert len(pdf_bytes) > 2000
        assert pdf_bytes.startswith(b"%PDF")
