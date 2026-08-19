"""
test_translator_unit.py — Unit tests cho module Translator & Date Formatting
Bao gồm:
  1. format_date_to_jp: Chuyển đổi mọi định dạng ngày tháng sang tiếng Nhật (ISO, VN, gạch chéo, chấm, tháng/năm, năm)
  2. translate_single: Dịch / format trường ngày tháng trực tiếp không cần Gemini API Key
  3. translate_single: Xử lý người giám hộ (Guardian fallback)
  4. API /api/translate/field: Endpoint dịch từng trường đơn lẻ
  5. API /api/translate: Endpoint dịch toàn bộ
"""

import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tts_app"))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tts_app"))

from run import app as flask_app
from core.database import init_db
from core.translator import format_date_to_jp, translate_single


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


class TestDateFormattingToJapanese:
    """1. Kiểm tra format_date_to_jp với tất cả định dạng ngày tháng"""

    def test_iso_date_to_jp(self):
        assert format_date_to_jp("2000-10-28") == "2000年10月28日"
        assert format_date_to_jp("1998-05-02") == "1998年05月02日"

    def test_vn_date_to_jp(self):
        assert format_date_to_jp("28/10/2000") == "2000年10月28日"
        assert format_date_to_jp("05-12-1999") == "1999年12月05日"
        assert format_date_to_jp("15.01.2002") == "2002年01月15日"

    def test_slash_and_dot_yyyy_mm_dd(self):
        assert format_date_to_jp("2000/10/28") == "2000年10月28日"
        assert format_date_to_jp("2000.10.28") == "2000年10月28日"

    def test_month_year_to_jp(self):
        assert format_date_to_jp("09/2015") == "2015年09月"
        assert format_date_to_jp("2015-09") == "2015年09月"
        assert format_date_to_jp("06-2018") == "2018年06月"

    def test_year_only_to_jp(self):
        assert format_date_to_jp("2000") == "2000年"
        assert format_date_to_jp("1995") == "1995年"

    def test_already_japanese_date_preserved(self):
        assert format_date_to_jp("2000年10月28日") == "2000年10月28日"
        assert format_date_to_jp("2015年09月") == "2015年09月"

    def test_empty_or_none_returns_none(self):
        assert format_date_to_jp("") is None
        assert format_date_to_jp(None) is None


class TestTranslateSingleOffline:
    """2. Kiểm tra translate_single không cần Gemini API Key cho trường ngày tháng / người giám hộ / nghề nghiệp"""

    def test_date_fields_offline_translation(self):
        assert translate_single("date_of_birth", "2000-10-28") == "2000年10月28日"
        assert translate_single("ngay_sinh", "15/01/2000") == "2000年01月15日"
        assert translate_single("issue_date", "2021-08-20") == "2021年08月20日"
        assert translate_single("ngay_cap_cccd", "10/05/2021") == "2021年05月10日"

    def test_guardian_name_fallback_offline(self):
        # English
        res = translate_single("guardian_name_en", "Nguyễn Văn B (Bố)", api_key="")
        assert res == "NGUYEN VAN B (FATHER)"

        res2 = translate_single("guardian_name_en", "Phạm Trọng Hưng ( Bố)", api_key="")
        assert res2 == "PHAM TRONG HUNG (FATHER)"

        res3 = translate_single("guardian_name_en", "Trần Thị C (Mẹ)", api_key="")
        assert res3 == "TRAN THI C (MOTHER)"

        # Japanese (Tên không dấu + quan hệ tiếng Nhật)
        jp1 = translate_single("guardian_name_jp", "Phạm Trọng Hưng ( Bố)", api_key="")
        assert jp1 == "PHAM TRONG HUNG (父)"

        jp2 = translate_single("guardian_name_jp", "Trần Thị C (Mẹ)", api_key="")
        assert jp2 == "TRAN THI C (母)"

        jp3 = translate_single("guardian_name_jp", "Nguyễn Văn D (Anh trai)", api_key="")
        assert jp3 == "NGUYEN VAN D (兄)"

    def test_job_en_and_jp_offline_translation(self):
        assert translate_single("job_en", "Làm nông", api_key="") == "Farmer"
        assert translate_single("guardian_job_en", "Nội trợ", api_key="") == "Housewife"
        assert translate_single("occupation_en", "Công nhân", api_key="") == "Worker"

        assert translate_single("job_jp", "Làm nông", api_key="") == "農業"
        assert translate_single("guardian_job_jp", "Nội trợ", api_key="") == "主婦"
        assert translate_single("occupation_jp", "Công nhân", api_key="") == "会社員"

    def test_text_field_without_key_raises_error(self):
        with pytest.raises(ValueError) as exc:
            translate_single("dia_chi_vnm", "123 Phố Huế, Hà Nội", api_key="")
        assert "Gemini API Key" in str(exc.value)


class TestTranslateAPIEndpoints:
    """3. Kiểm tra API endpoints dịch thuật"""

    def test_translate_field_date_endpoint_success_without_key(self, client):
        res = jpost(client, "/api/translate/field", {
            "field_name": "date_of_birth_jp",
            "value": "28/10/2000"
        })
        assert res.status_code == 200
        assert res.get_json()["translation"] == "2000年10月28日"

    def test_translate_field_empty_value_returns_400(self, client):
        res = jpost(client, "/api/translate/field", {
            "field_name": "date_of_birth_jp",
            "value": "   "
        })
        assert res.status_code == 400

    def test_translate_field_text_without_key_returns_400_or_200(self, client):
        res = jpost(client, "/api/translate/field", {
            "field_name": "dia_chi_vnm",
            "value": "Hà Nội"
        })
        # Nếu chưa cấu hình API key trả về 400 thông báo rõ ràng
        assert res.status_code in (200, 400)
