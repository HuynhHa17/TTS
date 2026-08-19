"""
translator.py — Gemini API auto-translate Vietnamese → Japanese
Uses google-genai (new SDK, replaces google-generativeai)
"""
import json
import re
import unicodedata
from typing import Optional

try:
    from google import genai as _genai
    GENAI_AVAILABLE = True
except ImportError:
    try:
        import google.generativeai as _legacy_genai
        GENAI_AVAILABLE = True
        _genai = None
    except ImportError:
        GENAI_AVAILABLE = False
        _genai = None
        _legacy_genai = None


CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
]

# Offline dictionaries
OFFLINE_REL_EN = {
    "cha": "FATHER", "bo": "FATHER", "bố": "FATHER", "ba": "FATHER", "bo de": "FATHER", "bố đẻ": "FATHER", "cha đẻ": "FATHER",
    "me": "MOTHER", "mẹ": "MOTHER", "ma": "MOTHER", "má": "MOTHER", "me de": "MOTHER", "mẹ đẻ": "MOTHER", "má đẻ": "MOTHER",
    "anh": "BROTHER", "anh trai": "ELDER BROTHER", "anh ruột": "ELDER BROTHER", "em trai": "YOUNGER BROTHER", "em trai ruột": "YOUNGER BROTHER",
    "chi": "SISTER", "chị": "SISTER", "chi gai": "ELDER SISTER", "chị gái": "ELDER SISTER", "chị ruột": "ELDER SISTER", "em gai": "YOUNGER SISTER", "em gái": "YOUNGER SISTER", "em gái ruột": "YOUNGER SISTER",
    "vo": "WIFE", "vợ": "WIFE", "chong": "HUSBAND", "chồng": "HUSBAND",
    "con": "CHILD", "con trai": "SON", "con gai": "DAUGHTER", "con gái": "DAUGHTER",
    "ong": "GRANDFATHER", "ông": "GRANDFATHER", "ong noi": "GRANDFATHER", "ông nội": "GRANDFATHER", "ong ngoai": "GRANDFATHER", "ông ngoại": "GRANDFATHER",
    "ba noi": "GRANDMOTHER", "bà": "GRANDMOTHER", "ba ngoai": "GRANDMOTHER", "bà nội": "GRANDMOTHER", "bà ngoại": "GRANDMOTHER",
    "chu": "UNCLE", "chú": "UNCLE", "bac": "UNCLE", "bác": "UNCLE", "cau": "UNCLE", "cậu": "UNCLE",
    "co": "AUNT", "cô": "AUNT", "di": "AUNT", "dì": "AUNT", "mo": "AUNT", "mợ": "AUNT", "thim": "AUNT", "thím": "AUNT",
}

OFFLINE_REL_JP = {
    "cha": "父", "bo": "父", "bố": "父", "ba": "父", "bo de": "父", "bố đẻ": "父", "cha đẻ": "父",
    "me": "母", "mẹ": "母", "ma": "母", "má": "母", "me de": "母", "mẹ đẻ": "母", "má đẻ": "母",
    "anh": "兄", "anh trai": "兄", "anh ruột": "兄", "em trai": "弟", "em trai ruột": "弟",
    "chi": "姉", "chị": "姉", "chi gai": "姉", "chị gái": "姉", "chị ruột": "姉", "em gai": "妹", "em gái": "妹", "em gái ruột": "妹",
    "vo": "妻", "vợ": "妻", "chong": "夫", "chồng": "夫",
    "con": "子", "con trai": "長男", "con gái": "長女",
    "ong": "祖父", "ông": "祖父", "ong noi": "祖父", "ông nội": "祖父", "ong ngoai": "祖父", "ông ngoại": "祖父",
    "ba noi": "祖母", "bà": "祖母", "ba ngoai": "祖母", "bà nội": "祖母", "bà ngoại": "祖母",
    "chu": "叔父", "chú": "叔父", "bac": "伯父", "bác": "伯父", "cau": "叔父", "cậu": "叔父",
    "co": "叔母", "cô": "叔母", "di": "叔母", "dì": "叔母", "mo": "叔母", "mợ": "叔母", "thim": "叔母", "thím": "叔母",
}

OFFLINE_JOB_EN = {
    "làm nông": "Farmer", "nông nghiệp": "Farmer", "nông dân": "Farmer", "trồng trọt": "Farmer", "lam nong": "Farmer",
    "nội trợ": "Housewife", "noi tro": "Housewife",
    "công nhân": "Worker", "cong nhan": "Worker", "lao động tự do": "Freelance worker", "lao dong tu do": "Freelance worker",
    "công nhân may": "Garment worker", "thợ may": "Tailor", "may mặc": "Garment worker", "tho may": "Tailor",
    "kinh doanh tự do": "Self-employed", "kinh doanh": "Business", "buôn bán": "Merchant", "kinh doanh tu do": "Self-employed",
    "thợ xây": "Construction worker", "xây dựng": "Construction worker", "tho xay": "Construction worker",
    "thợ hàn": "Welder", "tho han": "Welder", "thợ tiện": "Lathe operator", "thợ cơ khí": "Mechanic", "cơ khí": "Mechanic",
    "thợ điện": "Electrician", "tho dien": "Electrician",
    "lái xe": "Driver", "tài xế": "Driver", "lai xe": "Driver",
    "học sinh": "Student", "sinh viên": "Student", "hoc sinh": "Student", "sinh vien": "Student",
    "nhân viên văn phòng": "Office worker", "kế toán": "Accountant", "kỹ sư": "Engineer",
    "giáo viên": "Teacher", "bác sĩ": "Doctor", "y tá": "Nurse",
    "bán hàng": "Salesperson", "nhân viên bán hàng": "Salesperson",
    "đầu bếp": "Chef", "phụ bếp": "Kitchen assistant", "bảo vệ": "Security guard",
}

OFFLINE_JOB_JP = {
    "làm nông": "農業", "nông nghiệp": "農業", "nông dân": "農業", "trồng trọt": "農業", "lam nong": "農業",
    "nội trợ": "主婦", "noi tro": "主婦",
    "công nhân": "会社員", "cong nhan": "会社員", "lao động tự do": "自由業", "lao dong tu do": "自由業",
    "công nhân may": "縫製工", "thợ may": "縫製工", "may mặc": "縫製業", "tho may": "縫製工",
    "kinh doanh tự do": "自営業", "kinh doanh": "会社員", "buôn bán": "商業", "kinh doanh tu do": "自営業",
    "thợ xây": "建設作業員", "xây dựng": "建設業", "tho xay": "建設作業員",
    "thợ hàn": "溶接工", "tho han": "溶接工", "thợ tiện": "旋盤工", "thợ cơ khí": "機械工", "cơ khí": "機械工",
    "thợ điện": "電気技師", "tho dien": "電気技師",
    "lái xe": "運転手", "tài xế": "運転手", "lai xe": "運転手",
    "học sinh": "学生", "sinh viên": "大学生", "hoc sinh": "学生", "sinh vien": "大学生",
    "nhân viên văn phòng": "会社員", "kế toán": "会計士", "kỹ sư": "エンジニア",
    "giáo viên": "教師", "bác sĩ": "医師", "y tá": "看護師",
    "bán hàng": "販売員", "nhân viên bán hàng": "販売員",
    "đầu bếp": "調理師", "phụ bếp": "調理補助", "bảo vệ": "警備員",
}


def remove_vietnamese_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để tạo tên không dấu chuẩn."""
    if not text:
        return ""
    text = text.replace("Đ", "D").replace("đ", "d")
    nfkd = unicodedata.normalize('NFKD', text)
    return "".join([c for c in nfkd if not unicodedata.combining(c)]).strip()


def translate_guardian_name_jp_offline(val: str) -> str:
    """Tự động chuyển tên người giám hộ sang tên không dấu (quan hệ tiếng Nhật). Ví dụ: PHAM TRONG HUNG (父)"""
    if not val:
        return ""
    s = val.strip()
    # Check if there is relationship in parentheses e.g. "Phạm Trọng Hưng ( Bố)" or "Phạm Trọng Hưng (Bố)" or "Phạm Trọng Hưng （Cha）"
    m = re.search(r"^(.*?)\s*[\(\[\{（]\s*(.+?)\s*[\)\]\}）]\s*$", s)
    if m:
        name_part = m.group(1).strip()
        rel_part = m.group(2).strip().lower()
        no_accent_name = remove_vietnamese_accents(name_part).upper()
        rel_jp = OFFLINE_REL_JP.get(rel_part, remove_vietnamese_accents(rel_part).upper())
        return f"{no_accent_name} ({rel_jp})"
    
    # Check if string ends with relationship separated by hyphen or slash e.g. "Phạm Trọng Hưng - Bố"
    m2 = re.search(r"^(.*?)\s*[-/]\s*(.+?)$", s)
    if m2:
        name_part = m2.group(1).strip()
        rel_part = m2.group(2).strip().lower()
        if rel_part in OFFLINE_REL_JP:
            no_accent_name = remove_vietnamese_accents(name_part).upper()
            return f"{no_accent_name} ({OFFLINE_REL_JP[rel_part]})"

    return remove_vietnamese_accents(s).upper()


def translate_guardian_name_offline(val: str) -> str:
    """Tự động chuyển tên người giám hộ và quan hệ sang tiếng Anh viết hoa. Ví dụ: PHAM TRONG HUNG (FATHER)"""
    if not val:
        return ""
    s = val.strip()
    # Check if there is relationship in parentheses e.g. "Phạm Trọng Hưng ( Bố)" or "Nguyễn Văn B (Bố)"
    m = re.search(r"^(.*?)\s*[\(\[\{（]\s*(.+?)\s*[\)\]\}）]\s*$", s)
    if m:
        name_part = m.group(1).strip()
        rel_part = m.group(2).strip().lower()
        no_accent_name = remove_vietnamese_accents(name_part).upper()
        rel_en = OFFLINE_REL_EN.get(rel_part, remove_vietnamese_accents(rel_part).upper())
        return f"{no_accent_name} ({rel_en})"
    
    # Check if string ends with relationship separated by hyphen or slash e.g. "Nguyễn Văn B - Bố"
    m2 = re.search(r"^(.*?)\s*[-/]\s*(.+?)$", s)
    if m2:
        name_part = m2.group(1).strip()
        rel_part = m2.group(2).strip().lower()
        if rel_part in OFFLINE_REL_EN:
            no_accent_name = remove_vietnamese_accents(name_part).upper()
            return f"{no_accent_name} ({OFFLINE_REL_EN[rel_part]})"

    return remove_vietnamese_accents(s).upper()


def _generate(api_key: str, prompt: str) -> str:
    """Call Gemini API with the new or legacy SDK using gemini-3.5-flash-lite."""
    if not GENAI_AVAILABLE:
        raise RuntimeError("Chưa cài đặt thư viện google-genai / google-generativeai.")
    if not api_key:
        raise ValueError("Chưa cấu hình Gemini API Key. Vào tab Cài Đặt để nhập.")

    last_error = None
    for model_name in CANDIDATE_MODELS:
        try:
            if _genai is not None:
                # New SDK: google-genai
                client = _genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                if response and response.text:
                    return response.text.strip()
            else:
                # Legacy SDK fallback
                _legacy_genai.configure(api_key=api_key)
                model = _legacy_genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
        except Exception as err:
            last_error = err
            continue

    if last_error:
        raise last_error
    raise RuntimeError("Không nhận được phản hồi từ Gemini API.")


TRANSLATE_PROMPT = """Ban la chuyen gia dich thuat ho so thuc tap sinh (TTS) Viet Nam sang tieng Nhat va tieng Anh.
Hay dich TOAN BO cac truong thong tin duoc cung cap trong JSON dau vao, khong bo sot bat ky truong nao:

Quy tac dich:
- ten_vnm (ten ung vien): Chuyen sang "ten_phien_am" (Katakana chuan, VD: グエン ヴァン アー) va "ten_tieng_anh" (chu in hoa khong dau, VD: NGUYEN VAN A)
- dia_chi_vnm: Dich sang "dia_chi_jpn" (tieng Nhat tu nhien, giu nguyen dia danh)
- noi_sinh_vnm: Dich sang "noi_sinh_jpn" (ten tinh/thanh pho sang tieng Nhat)
- noi_cap_cccd_vnm, noi_cap_hc_vnm: Dich sang "noi_cap_cccd_jpn", "noi_cap_hc_jpn" (tieng Nhat)
- nguoi_giam_ho_vnm: Dich sang "nguoi_giam_ho_en" (tieng Anh viet hoa khong dau kem quan he, VD: "NGUYEN VAN B (FATHER)") va "nguoi_giam_ho_jpn" (Katakana/tieng Nhat)
- nghe_giam_ho_vnm: Dich sang "nghe_giam_ho_en" (tieng Anh, VD: "Farmer", "Housewife", "Worker") va "nghe_giam_ho_jpn" (tieng Nhat, VD: "農業", "主婦", "会社員")
- dc_nguoi_gh_vnm: Dich sang "dc_nguoi_gh_jpn" (dia chi tieng Nhat)
- nganh_nghe_vnm: Dich sang "nganh_nghe_jpn" (nganh nghe TTS sang tieng Nhat)
- kn_tom_tat_vnm: Dich sang "kn_tom_tat_jpn" (VD: "3 năm" -> "３年")
- muc_dich_vnm: Dich sang "muc_dich_jpn" (muc dich sang Nhat bang tieng Nhat)
- ke_hoach_vnm: Dich sang "ke_hoach_jpn" (ke hoach sau khi ve nuoc bang tieng Nhat)
- diem_manh_vnm: Dich sang "diem_manh_jpn" (tieng Nhat)
- diem_yeu_vnm: Dich sang "diem_yeu_jpn" (tieng Nhat)
- so_thich_vnm: Dich sang "so_thich_jpn" (tieng Nhat)
- ten_truong_X: Dich sang "ten_truong_X_jpn" (ten truong hoc sang tieng Nhat)
- ten_dn_X: Dich sang "ten_dn_X_jpn" (ten cong ty/doanh nghiep sang tieng Nhat)
- chuc_vu_X: Dich sang "chuc_vu_X_jpn" (chuc vu/nghe nghiep sang tieng Nhat)
- ky_nang_X: Dich sang "ky_nang_X_jpn" (ten ky nang nghe sang tieng Nhat)
- tv_ten_X: Dich sang "tv_ten_X_en" (ten nguoi than tieng Anh in hoa khong dau)
- tv_nghe_X: Dich sang "tv_nghe_X_en" (nghe nghiep nguoi than tieng Anh) va "tv_nghe_X_jpn" (nghe nghiep nguoi than tieng Nhat)
- custom_X: Dich gia tri truong tuy chinh sang tieng Nhat "custom_X_jpn"

Dau vao (JSON):
{input_json}

Tra ve JSON thuan tuy (khong co markdown ```json, khong giai thich) chua day du cac key tuong ung.
"""

OUTPUT_MAP = {
    "ten_phien_am":        "ten_phien_am",
    "ten_tieng_anh":       "full_name_eng",
    "dia_chi_jpn":         "dia_chi_jpn",
    "noi_sinh_jpn":        "noi_sinh_jpn",
    "noi_cap_cccd_jpn":    "noi_cap_cccd_jpn",
    "noi_cap_hc_jpn":      "noi_cap_hc_jpn",
    "nguoi_giam_ho_en":    "guardian_name_en",
    "nguoi_giam_ho_jpn":   "guardian_name_jp",
    "nghe_giam_ho_en":     "guardian_job_en",
    "nghe_giam_ho_jpn":    "guardian_job_jp",
    "dc_nguoi_gh_jpn":     "dc_nguoi_gh_jpn",
    "nganh_nghe_jpn":      "nganh_nghe_jpn",
    "kn_tom_tat_jpn":      "kn_tom_tat_jpn",
    "muc_dich_jpn":        "muc_dich_jpn",
    "ke_hoach_jpn":        "ke_hoach_jpn",
    "diem_manh_jpn":       "diem_manh_jpn",
    "diem_yeu_jpn":        "diem_yeu_jpn",
    "so_thich_jpn":        "so_thich_jpn",
}


def translate_fields(fields: dict, api_key: str) -> dict:
    to_translate = {k: v for k, v in fields.items() if v}
    if not to_translate:
        return {}

    prompt = TRANSLATE_PROMPT.replace(
        "{input_json}", json.dumps(to_translate, ensure_ascii=False, indent=2)
    )
    text = _generate(api_key, prompt)

    m = re.search(r'\{.*\}', text, re.DOTALL)
    if not m:
        raise ValueError(f"Gemini tra ve ket qua khong dung dinh dang JSON: {text[:200]}")

    raw = json.loads(m.group())
    result = {}
    for out_key, model_key in OUTPUT_MAP.items():
        val = raw.get(out_key)
        if val and val != "null":
            result[model_key] = val
    
    # Passthrough dynamic list keys (e.g. ten_truong_1_jpn, ten_dn_1_jpn, tv_nghe_1_en, etc.)
    for k, val in raw.items():
        if val and val != "null":
            result[k] = val
            # Also normalize aliases e.g. ten_truong_1_jpn -> ten_truong_1
            if k.endswith("_jpn"):
                base_k = k[:-4]
                if base_k not in result:
                    result[base_k] = val

    return result


def format_date_to_jp(value: str) -> Optional[str]:
    """Chuyển đổi các định dạng ngày tháng sang tiếng Nhật: YYYY年MM月DD日 hoặc YYYY年MM月."""
    if not value:
        return None
    s = str(value).strip()
    if not s:
        return None
    if "年" in s:
        return s

    from datetime import datetime
    # Full date formats
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y", "%d.%m.%Y", "%Y.%m.%d"):
        try:
            d = datetime.strptime(s, fmt)
            return f"{d.year}年{d.month:02d}月{d.day:02d}日"
        except ValueError:
            pass

    # Month/Year formats
    for fmt in ("%m/%Y", "%m-%Y", "%m.%Y", "%Y/%m", "%Y-%m", "%Y.%m"):
        try:
            d = datetime.strptime(s, fmt)
            return f"{d.year}年{d.month:02d}月"
        except ValueError:
            pass

    # Year only
    if re.match(r"^\d{4}$", s):
        return f"{s}年"

    # Regex search for date inside string (e.g. ISO timestamp 2000-10-28T00:00:00)
    m = re.search(r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", s)
    if m:
        y, mth, d = m.groups()
        return f"{int(y)}年{int(mth):02d}月{int(d):02d}日"

    m_ym = re.search(r"(\d{1,2})[-/.](\d{4})", s)
    if m_ym:
        mth, y = m_ym.groups()
        return f"{int(y)}年{int(mth):02d}月"

    return s


def translate_single(field_name: str, value: str, api_key: str = "") -> Optional[str]:
    fn_lower = field_name.lower()
    val_strip = value.strip() if value else ""
    if not val_strip:
        return ""

    # Direct date conversion if it's a date field or date string (does not require api_key)
    if any(k in fn_lower for k in ("date", "ngay", "sinh", "dob", "birth", "nam_sinh", "issue_date")):
        jp_date = format_date_to_jp(val_strip)
        if jp_date:
            return jp_date

    # Latin / No accent name conversion (does not require api_key)
    if "guardian" not in fn_lower and any(k in fn_lower for k in ("full_name_eng", "full_name_en", "latin_name", "latin", "ten_khong_dau", "tv_ten_en", "member_name")):
        return remove_vietnamese_accents(val_strip).upper()

    # Guardian name Japanese translation (Tên không dấu + quan hệ tiếng Nhật)
    if any(k in fn_lower for k in ("guardian_name_jp", "nguoi_giam_ho_jpn", "nguoi_giam_ho_jp", "giam_ho_jp", "guardian_jp")):
        if not api_key:
            return translate_guardian_name_jp_offline(val_strip)
        try:
            prompt = f"""Chuyen ten nguoi giam ho sau sang ten khong dau viet hoa kem quan he bang TIENG NHAT trong ngoac (vi du: Bo/Cha -> 父, Me -> 母, Anh -> 兄, Chi -> 姉, Em trai -> 弟, Em gai -> 妹, Chu/Bac -> 叔父/伯父, Co/Di -> 叔母):
Gia tri: {val_strip}
Vi du:
- "Pham Trong Hung (Bo)" -> "PHAM TRONG HUNG (父)"
- "Pham Trong Hung ( Bố)" -> "PHAM TRONG HUNG (父)"
- "Nguyen Van A (Cha)" -> "NGUYEN VAN A (父)"
- "Tran Thi B (Me)" -> "TRAN THI B (母)"
- "Nguyen Van C (Anh)" -> "NGUYEN VAN C (兄)"

Chi tra ve ten khong dau kem quan he tieng Nhat, khong giai thich."""
            return _generate(api_key, prompt)
        except Exception:
            return translate_guardian_name_jp_offline(val_strip)

    # Guardian name English translation (Tên không dấu + quan hệ tiếng Anh)
    if any(k in fn_lower for k in ("giam_ho_en", "guardian_name_en", "guardian_en", "nguoi_giam_ho_en", "guardian_name")):
        if not api_key:
            return translate_guardian_name_offline(val_strip)
        try:
            prompt = f"""Chuyen ten nguoi giam ho sau sang tieng Anh viet hoa khong dau (neu co quan he nhu Cha, Me thi dich quan he sang tieng Anh nhu FATHER, MOTHER):
Gia tri: {val_strip}
Vi du:
- "Pham Trong Hung (Bo)" -> "PHAM TRONG HUNG (FATHER)"
- "Nguyen Van A (Cha)" -> "NGUYEN VAN A (FATHER)"
- "Le Thi B (Me)" -> "LE THI B (MOTHER)"
- "Tran Van C" -> "TRAN VAN C"

Chi tra ve ten tieng Anh viet hoa, khong giai thich."""
            return _generate(api_key, prompt)
        except Exception:
            return translate_guardian_name_offline(val_strip)

    # Job / Occupation English translation
    if any(k in fn_lower for k in ("job_en", "occupation_en", "nghe_en", "nghe_nghiep_en", "guardian_job_en", "nghe_giam_ho_en")):
        val_lower = val_strip.lower()
        if val_lower in OFFLINE_JOB_EN:
            return OFFLINE_JOB_EN[val_lower]
        if not api_key:
            return val_strip.capitalize()
        try:
            prompt = f"""Dich nghe nghiep / cong viec sau tu tieng Viet sang TIENG ANH ngan gon, chuan xac cho ho so lao dong/TTS:
Gia tri: {val_strip}
Vi du:
- "Làm nông" -> "Farmer"
- "Nội trợ" -> "Housewife"
- "Thợ may" -> "Tailor"
- "Công nhân" -> "Worker"
- "Kinh doanh tự do" -> "Self-employed"
- "Học sinh" -> "Student"
- "Thợ xây" -> "Construction worker"
- "Lái xe" -> "Driver"
- "Nhân viên văn phòng" -> "Office worker"

Chi tra ve ten nghe nghiep bang tieng Anh, khong giai thich."""
            return _generate(api_key, prompt)
        except Exception:
            return OFFLINE_JOB_EN.get(val_lower, val_strip.capitalize())

    # Job / Occupation Japanese translation
    if any(k in fn_lower for k in ("job_jp", "occupation_jp", "nghe_jp", "nghe_nghiep_jp", "guardian_job_jp", "nghe_giam_ho_jp")):
        val_lower = val_strip.lower()
        if val_lower in OFFLINE_JOB_JP:
            return OFFLINE_JOB_JP[val_lower]
        if not api_key:
            return OFFLINE_JOB_JP.get(val_lower, val_strip)
        try:
            prompt = f"""Dich nghe nghiep / cong viec sau tu tieng Viet sang TIENG NHAT chuan xac cho ho so TTS:
Gia tri: {val_strip}
Vi du:
- "Làm nông" -> "農業"
- "Nội trợ" -> "主婦"
- "Thợ may" -> "縫製"
- "Công nhân" -> "会社員"
- "Kinh doanh tự do" -> "自営業"
- "Học sinh" -> "学生"
- "Thợ xây" -> "建設作業員"
- "Lái xe" -> "運転手"
- "Nhân viên văn phòng" -> "会社員"

Chi tra ve ten nghe nghiep bang tieng Nhat, khong giai thich."""
            return _generate(api_key, prompt)
        except Exception:
            return OFFLINE_JOB_JP.get(val_lower, val_strip)

    if not api_key:
        raise ValueError("Chưa cấu hình Gemini API Key. Vào tab Cài Đặt để nhập.")

    prompt = f"""Dich gia tri sau sang tieng Nhat cho ho so TTS:
Truong: {field_name}
Gia tri: {val_strip}

Quy tac:
- Ten nguoi -> Katakana
- Dia chi -> tieng Nhat tu nhien
- Ten to chuc -> phien am hoac dich
- Quan he gia dinh: Cha->父, Me->母, Anh->兄, Chi->姉, Em trai->弟, Em gai->妹, Vo->妻, Chong->夫

Chi tra ve ban dich, khong giai thich."""
    return _generate(api_key, prompt)
