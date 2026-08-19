"""
translator.py — Gemini API auto-translate Vietnamese → Japanese
Uses google-genai (new SDK, replaces google-generativeai)
"""
import json
import re
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
Hay dich cac truong thong tin sau theo dung yeu cau:

- ten_vnm (ten nguoi): Chuyen sang Katakana phien am chuan (vi du: NGUYEN VAN A -> グエン ヴァン アー)
- dia_chi_vnm (dia chi): Dich sang tieng Nhat tu nhien, giu ten rieng
- noi_sinh_vnm (noi sinh): Dich ten tinh/thanh pho sang tieng Nhat
- noi_cap_cccd_vnm / noi_cap_hc_vnm: Dich sang tieng Nhat
- nguoi_giam_ho_vnm (ten nguoi giam ho): Chuyen ten nguoi giam ho sang TIENG ANH viet hoa khong dau (co the kem quan he tieng Anh, vi du: "Nguyen Van B (Cha)" -> "NGUYEN VAN B (FATHER)" hoac "NGUYEN VAN B", "Tran Thi C (Me)" -> "TRAN THI C (MOTHER)")
- ten_truong_X: Phien am hoac dich sang tieng Nhat
- ten_dn_X: Phien am hoac dich ten cong ty sang tieng Nhat
- nganh_nghe_vnm: Dich sang tieng Nhat chuyen nganh

Dau vao (JSON):
{input_json}

Tra ve JSON thuan tuy (khong co markdown, khong giai thich) voi cac key sau:
{{
  "ten_phien_am": "...",
  "dia_chi_jpn": "...",
  "noi_sinh_jpn": "...",
  "noi_cap_cccd_jpn": "...",
  "noi_cap_hc_jpn": "...",
  "nguoi_giam_ho_jpn": "...",
  "dc_nguoi_gh_jpn": "...",
  "ten_truong_1_jpn": "...",
  "ten_truong_2_jpn": "...",
  "ten_truong_3_jpn": "...",
  "ten_dn_1_jpn": "...",
  "ten_dn_2_jpn": "...",
  "ten_dn_3_jpn": "...",
  "nganh_nghe_jpn": "..."
}}
Chi dien cac truong co du lieu dau vao, de null neu khong co.
"""

OUTPUT_MAP = {
    "ten_phien_am":    "ten_phien_am",
    "dia_chi_jpn":     "dia_chi_jpn",
    "noi_sinh_jpn":    "noi_sinh_jpn",
    "noi_cap_cccd_jpn":"noi_cap_cccd_jpn",
    "noi_cap_hc_jpn":  "noi_cap_hc_jpn",
    "nguoi_giam_ho_jpn":"nguoi_giam_ho_jpn",
    "dc_nguoi_gh_jpn": "dc_nguoi_gh_jpn",
    "ten_truong_1_jpn":"ten_truong_1",
    "ten_truong_2_jpn":"ten_truong_2",
    "ten_truong_3_jpn":"ten_truong_3",
    "ten_dn_1_jpn":    "ten_dn_1",
    "ten_dn_2_jpn":    "ten_dn_2",
    "ten_dn_3_jpn":    "ten_dn_3",
    "nganh_nghe_jpn":  "nganh_nghe_jpn",
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

    # Direct date conversion if it's a date field or date string (does not require api_key)
    if any(k in fn_lower for k in ("date", "ngay", "sinh", "dob", "birth", "nam_sinh", "issue_date")):
        jp_date = format_date_to_jp(val_strip)
        if jp_date:
            return jp_date

    # Guardian name English translation
    if "giam_ho" in fn_lower or "guardian" in fn_lower:
        if not api_key:
            # Fallback simple uppercase without accents if no API key
            return val_strip.upper()
        prompt = f"""Chuyen ten nguoi giam ho sau sang tieng Anh viet hoa khong dau (neu co quan he nhu Cha, Me thi dich quan he sang tieng Anh nhu FATHER, MOTHER):
Gia tri: {val_strip}
Vi du:
- "Nguyen Van A (Cha)" -> "NGUYEN VAN A (FATHER)"
- "Le Thi B (Me)" -> "LE THI B (MOTHER)"
- "Tran Van C" -> "TRAN VAN C"

Chi tra ve ten tieng Anh viet hoa, khong giai thich."""
        return _generate(api_key, prompt)

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
