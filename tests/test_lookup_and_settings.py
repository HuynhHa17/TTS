"""
test_lookup_and_settings.py — Unit tests cho các bảng tra cứu (Syndicates, Companies) và Cài đặt hệ thống (Settings)
Bao gồm:
  1. CRUD Nghiệp đoàn (Syndicates)
  2. CRUD Xí nghiệp tiếp nhận (Companies)
  3. Quản lý cài đặt hệ thống (Settings: Custom fields, File paths, Gemini API Key Masking)
"""

import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tts_app"))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tts_app"))

from run import app as flask_app
from core.database import init_db


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


class TestSyndicatesCRUD:
    """1. Kiểm tra chức năng Quản lý Nghiệp đoàn"""

    def test_syndicate_lifecycle(self, client):
        # Create
        payload = {
            "ten_vnm": "Nghiệp đoàn Xây dựng Tokyo",
            "ten_jpn": "東京建設協同組合",
            "chu_tich_vnm": "Tanaka Taro",
            "chu_tich_jpn": "田中太郎",
            "dia_chi_vnm": "Tokyo, Nhật Bản",
            "dia_chi_jpn": "東京都新宿区",
            "so_dien_thoai": "03-1234-5678"
        }
        res = jpost(client, "/api/syndicates", payload)
        assert res.status_code == 201
        s_data = res.get_json()
        assert s_data["ten_vnm"] == "Nghiệp đoàn Xây dựng Tokyo"
        sid = s_data["id"]

        # Read List
        res_list = client.get("/api/syndicates")
        assert res_list.status_code == 200
        items = res_list.get_json()
        assert any(s["id"] == sid for s in items)

        # Update
        update_payload = {"ten_vnm": "Nghiệp đoàn Xây dựng Tokyo (Cập nhật)"}
        res_u = jput(client, f"/api/syndicates/{sid}", update_payload)
        assert res_u.status_code == 200
        assert res_u.get_json()["ten_vnm"] == "Nghiệp đoàn Xây dựng Tokyo (Cập nhật)"

        # Delete
        res_del = client.delete(f"/api/syndicates/{sid}")
        assert res_del.status_code == 200
        assert res_del.get_json()["ok"] is True

        # Confirm deleted
        res_del_again = client.delete(f"/api/syndicates/{sid}")
        assert res_del_again.status_code == 404


class TestCompaniesCRUD:
    """2. Kiểm tra chức năng Quản lý Xí nghiệp tiếp nhận"""

    def test_company_lifecycle(self, client):
        # Create
        payload = {
            "ten_vnm": "Công ty TNHH Cơ Khí Osaka",
            "ten_jpn": "大阪機械工業株式会社",
            "giam_doc_vnm": "Yamada Hanako",
            "giam_doc_jpn": "山田花子",
            "dia_chi_vnm": "Osaka, Nhật Bản",
            "dia_chi_jpn": "大阪府大阪市",
            "so_dien_thoai": "06-9876-5432"
        }
        res = jpost(client, "/api/companies", payload)
        assert res.status_code == 201
        c_data = res.get_json()
        assert c_data["ten_vnm"] == "Công ty TNHH Cơ Khí Osaka"
        cid = c_data["id"]

        # Read List
        res_list = client.get("/api/companies")
        assert res_list.status_code == 200
        items = res_list.get_json()
        assert any(c["id"] == cid for c in items)

        # Update
        update_payload = {"giam_doc_vnm": "Yamada Hanako (CEO)"}
        res_u = jput(client, f"/api/companies/{cid}", update_payload)
        assert res_u.status_code == 200
        assert res_u.get_json()["giam_doc_vnm"] == "Yamada Hanako (CEO)"

        # Delete
        res_del = client.delete(f"/api/companies/{cid}")
        assert res_del.status_code == 200
        assert res_del.get_json()["ok"] is True


class TestSettingsManagement:
    """3. Kiểm tra chức năng Cài đặt hệ thống"""

    def test_get_settings(self, client):
        res = client.get("/api/settings")
        assert res.status_code == 200
        data = res.get_json()
        assert "cv_path" in data
        assert "output_path" in data
        assert "gemini_api_key_set" in data

    def test_save_and_retrieve_settings(self, client):
        custom_fields = json.dumps([
            {"id": "field_zalo", "label": "Zalo cá nhân", "type": "text", "requireJp": False}
        ])
        payload = {
            "custom_field_defs": custom_fields,
            "test_config_key": "test_value_123"
        }
        res = jpost(client, "/api/settings", payload)
        assert res.status_code == 200
        assert res.get_json()["ok"] is True

        # Retrieve
        res_get = client.get("/api/settings")
        assert res_get.status_code == 200
        d = res_get.get_json()
        assert d.get("custom_field_defs") == custom_fields
        assert d.get("test_config_key") == "test_value_123"
