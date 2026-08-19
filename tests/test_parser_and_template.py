"""
test_parser_and_template.py — Unit tests cho các module xử lý CVpv và điền mẫu Rirekisho Excel
Bao gồm:
  1. parser.py: Trích xuất thông tin cá nhân, Katakana, ngày sinh VN/JP, tuổi
  2. parser.py: Quét quá trình học vấn, kinh nghiệm làm việc, danh sách gia đình
  3. parser.py: Tự động phát hiện người giám hộ (Guardian detection: Cha/Mẹ)
  4. template_filler.py: Điền dữ liệu ứng viên vào mẫu CVpv.xlsx (履歴書)
  5. template_filler.py: Ánh xạ quan hệ thân nhân tiếng Việt sang tiếng Nhật (Cha/Bố -> 父, Mẹ -> 母, v.v.)
"""

import sys
import os
import openpyxl
import tempfile
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tts_app"))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tts_app"))

from core.parser import (
    _parse_dob_vnm, _extract_age, _extract_age_vnm,
    _scan_education, _scan_work, _scan_family, _detect_guardian,
    parse_cv_sheet, parse_cv_file, _split_period
)
from core.template_filler import (
    fill_rirekisho_excel, _rel_to_jp, _fmt_period_jp, _calculate_age
)
from core.models import Candidate, Education, WorkExperience, FamilyMember
import config


class TestCVParserHelpers:
    """1. Kiểm tra các hàm trích xuất chi tiết trong parser.py"""

    def test_parse_dob_vnm_from_japanese_date(self):
        assert _parse_dob_vnm("2000年10月28日") == "2000-10-28"
        assert _parse_dob_vnm("1998年05月03日") == "1998-05-03"
        assert _parse_dob_vnm(None) is None

    def test_extract_age_and_age_vnm(self):
        assert _extract_age("年齢（23）歳") == "23歳"
        assert _extract_age_vnm("年齢（23）歳") == "23 tuổi"
        assert _extract_age("25") == "25歳"
        assert _extract_age("") is None

    def test_split_period(self):
        s, e = _split_period("2015年09月   ～ 2018年06月")
        assert s == "2015年09月"
        assert e == "2018年06月"

        s2, e2 = _split_period("2020-01-01 ~ 2022-12-31")
        assert s2 == "2020-01-01"
        assert e2 == "2022-12-31"

    def test_detect_guardian_prefers_father_then_mother(self):
        family = [
            {"rel_jp": "妹", "name": "LE THI EM", "job": "Học sinh"},
            {"rel_jp": "母", "name": "LE THI ME", "job": "Nội trợ"},
            {"rel_jp": "父", "name": "LE VAN CHA", "job": "Làm nông"},
        ]
        g = _detect_guardian(family)
        assert g["rel_jp"] == "父"
        assert g["name"] == "LE VAN CHA"

        # Nếu không có Cha thì ưu tiên Mẹ
        family_no_father = [
            {"rel_jp": "妹", "name": "LE THI EM", "job": "Học sinh"},
            {"rel_jp": "母", "name": "LE THI ME", "job": "Nội trợ"},
        ]
        g2 = _detect_guardian(family_no_father)
        assert g2["rel_jp"] == "母"
        assert g2["name"] == "LE THI ME"


class TestTemplateFillerAndRelMapping:
    """2. Kiểm tra điền mẫu Excel 履歴書 và ánh xạ quan hệ"""

    def test_rel_to_jp_mapping(self):
        assert _rel_to_jp("Bố") == "父"
        assert _rel_to_jp("Cha") == "父"
        assert _rel_to_jp("ba") == "父"
        assert _rel_to_jp("Mẹ") == "母"
        assert _rel_to_jp("Anh trai") == "兄"
        assert _rel_to_jp("Chị") == "姉"
        assert _rel_to_jp("Em gái") == "妹"
        assert _rel_to_jp("Vợ") == "妻"
        assert _rel_to_jp("Chồng") == "夫"
        assert _rel_to_jp("Con") == "子"
        assert _rel_to_jp("Ông") == "祖父"
        assert _rel_to_jp("Bà") == "祖母"

    def test_fmt_period_jp(self):
        assert _fmt_period_jp("2018-09-01") == "2018年09月"
        assert _fmt_period_jp("01/06/2022") == "2022年06月"
        assert _fmt_period_jp("09/2015") == "2015年09月"
        assert _fmt_period_jp("2020年05月") == "2020年05月"

    def test_fill_rirekisho_excel_execution(self):
        template_path = config.CV_FILE
        if not os.path.isfile(template_path):
            # Tạo workbook mẫu nếu không có sẵn
            wb = openpyxl.Workbook()
            ws = wb.active
            wb.save(template_path)

        cand = Candidate(
            id=101,
            profile_code="TTS-101",
            full_name_vn="Đỗ Minh Quân",
            full_name_eng="DO MINH QUAN",
            full_name_katakana="ド・ミン・クアン",
            gender="Nam",
            date_of_birth="2000-08-15",
            date_of_birth_jp="2000年08月15日",
            marital_status="Độc thân",
            has_children="Không",
            address_vn="Hà Nội",
            address_jp="ハノイ",
            birthplace_vn="Hải Phòng",
            birthplace_jp="ハイフォン",
            height_cm=170,
            weight_kg=62,
            blood_type="A",
            preferred_hand="Phải",
            health_status="Tốt",
        )
        cand.educations = [
            Education(school_name_vn="THPT Ngô Quyền", school_name_jp="ゴ・クエン高校", start_date="2015-09-01", end_date="2018-06-01")
        ]
        cand.work_experiences = [
            WorkExperience(company_name_vn="Cty Cơ Khí Hải Phòng", company_name_jp="ハイフォン機械", job_title_vn="Thợ tiện", job_title_jp="旋盤工", start_date="2018-08-01", end_date="2022-05-01")
        ]
        cand.family_members = [
            FamilyMember(relationship="Bố", full_name="Đỗ Văn Bố", age=54, living_together="Có", occupation="Làm nông"),
            FamilyMember(relationship="Mẹ", full_name="Nguyễn Thị Mẹ", age=50, living_together="Có", occupation="Nội trợ"),
        ]

        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
            out_path = tmp.name

        try:
            res_path = fill_rirekisho_excel(cand, template_path, out_path)
            assert os.path.exists(res_path)
            wb_filled = openpyxl.load_workbook(res_path)
            ws_filled = wb_filled.active

            # Kiểm tra ô mã hồ sơ
            assert "TTS-101" in str(ws_filled["A1"].value)
            # Kiểm tra Katakana & Tên tiếng Anh
            assert ws_filled["E4"].value == "ド・ミン・クアン"
            assert ws_filled["E5"].value == "DO MINH QUAN"
            # Kiểm tra ngày sinh JP
            assert ws_filled["E7"].value == "2000年08月15日"
            # Kiểm tra quan hệ gia đình đã được dịch sang chữ Hán
            assert ws_filled["A26"].value == "父"
            assert ws_filled["C26"].value == "Đỗ Văn Bố"
            assert ws_filled["A27"].value == "母"
            assert ws_filled["C27"].value == "Nguyễn Thị Mẹ"
        finally:
            if os.path.exists(out_path):
                os.remove(out_path)
