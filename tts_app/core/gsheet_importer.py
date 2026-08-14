"""
gsheet_importer.py — Import dữ liệu từ Google Sheets public URL
Không cần OAuth; dùng CSV export URL của Google Sheets.
"""
import re
import csv
import io
import requests
from typing import Tuple

# Mapping: tên cột Google Sheet → tên trường trong model
# Hỗ trợ cả 60 cột chuẩn lẫn tên viết tắt/biến thể
GSHEET_COL_MAP = {
    # exact match (lower-stripped)
    "ma ho so":                    "ma_ho_so",
    "ten vnm":                     "ten_vnm",
    "ten eng":                     "ten_eng",
    "ten phien am":                "ten_phien_am",
    "gioi tinh jpn":               "gioi_tinh_jpn",
    "so can cuoc":                 "so_can_cuoc",
    "ngay cap can cuoc vnm":       "ngay_cap_cccd_vnm",
    "ngay cap can cuoc jpn":       "ngay_cap_cccd_jpn",
    "noi cap can cuoc vnm":        "noi_cap_cccd_vnm",
    "noi cap can cuoc jpn":        "noi_cap_cccd_jpn",
    "so ho chieu":                 "so_ho_chieu",
    "ngay cap ho chieu vnm":       "ngay_cap_hc_vnm",
    "ngay cap ho chieu jpn":       "ngay_cap_hc_jpn",
    "noi cap ho chieu vnm":        "noi_cap_hc_vnm",
    "noi cap ho chieu jpn":        "noi_cap_hc_jpn",
    "nam sinh vnm":                "nam_sinh_vnm",
    "nam sinh jpn":                "nam_sinh_jpn",
    "tuoi jpn":                    "tuoi_jpn",
    "tuoi vnm":                    "tuoi_vnm",
    "dia chi vnm":                 "dia_chi_vnm",
    "dia chi jpn":                 "dia_chi_jpn",
    "noi sinh vnm":                "noi_sinh_vnm",
    "noi sinh jpn":                "noi_sinh_jpn",
    "nguoi giam ho, quan he (vnm)":"nguoi_giam_ho_vnm",
    "nguoi giam ho, quan he (jpn)":"nguoi_giam_ho_jpn",
    "dia chi nguoi giam ho (vnm)": "dc_nguoi_gh_vnm",
    "dia chi nguoi giam ho (jpn)": "dc_nguoi_gh_jpn",
    "sdt nguoi giam ho":           "sdt_nguoi_gh",
    "qua trinh hoc 1":             "qua_trinh_hoc_1",
    "ten truong 1":                "ten_truong_1",
    "qua trinh hoc 2":             "qua_trinh_hoc_2",
    "ten truong 2":                "ten_truong_2",
    "qua trinh hoc 3":             "qua_trinh_hoc_3",
    "ten truong  3":               "ten_truong_3",
    "ten truong 3":                "ten_truong_3",
    "qt lam viec 1":               "qt_lam_viec_1",
    "ten doanh nghiep 1 (nganh nghe)": "ten_dn_1",
    "qt lam viec 2":               "qt_lam_viec_2",
    "ten doanh nghiep 2 ( nganh nghe)": "ten_dn_2",
    "ten doanh nghiep 2 (nganh nghe)": "ten_dn_2",
    "qt lam viec 3":               "qt_lam_viec_3",
    "ten doanh nghiep 3 ( nganh nghe)": "ten_dn_3",
    "ten doanh nghiep 3 (nganh nghe)": "ten_dn_3",
    "nganh nghe tts vmn":          "nganh_nghe_vnm",
    "nganh nghe tts jpn":          "nganh_nghe_jpn",
    "kinh nghiem jpn":             "kinh_nghiem_jpn",
    "kinh nghiem vnm":             "kinh_nghiem_vnm",
    "ten nghiep doan vnm":         "ten_nghiep_doan_vnm",
    "ten nghiep doan jpn":         "ten_nghiep_doan_jpn",
    "d/c nghiep doan vnm":         "dc_nghiep_doan_vnm",
    "d/c nghiep doan jpn":         "dc_nghiep_doan_jpn",
    "ten chu tich nd vnm":         "ten_chu_tich_nd_vnm",
    "ten chu tich nd jpn":         "ten_chu_tich_nd_jpn",
    "ten tiep nhan vnm":           "ten_tiep_nhan_vnm",
    "ten tiep nhan jpn":           "ten_tiep_nhan_jpn",
    "d/c tiep nhan vnm":           "dc_tiep_nhan_vnm",
    "d/c tiep nhan jpn":           "dc_tiep_nhan_jpn",
    "ten gd tiep nhan vnm":        "ten_gd_tiep_nhan_vnm",
    "ten gd tiep nhan jpn":        "ten_gd_tiep_nhan_jpn",
    "cong ty chung nghe":          "cong_ty_chung_nghe",
    "ten giam doc cty chung nghe": "ten_gd_chung_nghe",
    "số đt tts":                   "sdt_tts",
    "so dt tts":                   "sdt_tts",
    "sdt tts":                     "sdt_tts",
}


def extract_sheet_info(url: str) -> Tuple[str, str]:
    """
    Extract (spreadsheet_id, gid) from any Google Sheets URL.
    Supports: /edit, /view, /pub, share links.
    """
    m_id = re.search(r'/spreadsheets/d/([a-zA-Z0-9_-]+)', url)
    if not m_id:
        raise ValueError("URL không hợp lệ — không tìm thấy Spreadsheet ID.")
    sheet_id = m_id.group(1)

    m_gid = re.search(r'[#&?]gid=(\d+)', url)
    gid = m_gid.group(1) if m_gid else "0"

    return sheet_id, gid


def build_csv_url(sheet_id: str, gid: str) -> str:
    return (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}"
        f"/export?format=csv&gid={gid}"
    )


def fetch_csv(url: str) -> str:
    """Download CSV content from Google Sheets export URL."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TTS-App/1.0",
    }
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    # Detect encoding
    content = resp.content
    for enc in ("utf-8-sig", "utf-8", "cp1252"):
        try:
            return content.decode(enc)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="replace")


def map_row(header: list, row: list) -> dict:
    """Map a CSV row to candidate dict using GSHEET_COL_MAP."""
    record = {}
    for col_name, val in zip(header, row):
        key = col_name.strip().lower()
        # Try exact match
        field = GSHEET_COL_MAP.get(key)
        if not field:
            # Try partial match
            for k, v in GSHEET_COL_MAP.items():
                if k in key or key in k:
                    field = v
                    break
        if field:
            record[field] = val.strip() if val else None
    return record


def fetch_from_gsheet(url: str) -> Tuple[list, list]:
    """
    Fetch & parse Google Sheet from URL.
    Returns (records: list[dict], errors: list[str])
    """
    try:
        sheet_id, gid = extract_sheet_info(url)
    except ValueError as e:
        return [], [str(e)]

    csv_url = build_csv_url(sheet_id, gid)

    try:
        csv_text = fetch_csv(csv_url)
    except requests.RequestException as e:
        return [], [f"Không thể tải Google Sheet: {e}. Hãy đảm bảo sheet đã được chia sẻ công khai."]

    reader = csv.reader(io.StringIO(csv_text))
    rows   = list(reader)

    if len(rows) < 2:
        return [], ["Sheet trống hoặc không có dữ liệu."]

    # Find header row (row containing 'MA HO SO' or 'TEN VNM')
    header_idx = 0
    for i, row in enumerate(rows[:5]):
        joined = " ".join(row).upper()
        if "MA HO SO" in joined or "TEN VNM" in joined or "TEN ENG" in joined:
            header_idx = i
            break

    header  = rows[header_idx]
    records = []
    errors  = []
    for row_num, row in enumerate(rows[header_idx + 1:], start=header_idx + 2):
        if not any(cell.strip() for cell in row):
            continue
        try:
            rec = map_row(header, row)
            # Set default status
            rec.setdefault("status", "Mới tạo")
            records.append(rec)
        except Exception as e:
            errors.append(f"Dòng {row_num}: {e}")

    return records, errors
