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


def _generate(api_key: str, prompt: str) -> str:
    """Call Gemini API with the new or legacy SDK."""
    if not GENAI_AVAILABLE:
        raise RuntimeError("Chua cai thu vien google-genai. Chay: pip install google-genai")
    if not api_key:
        raise ValueError("Chua cau hinh Gemini API Key. Vao tab Cai Dat de nhap.")

    if _genai is not None:
        # New SDK: google-genai
        client = _genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        return response.text.strip()
    else:
        # Legacy SDK fallback
        _legacy_genai.configure(api_key=api_key)
        model = _legacy_genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text.strip()


TRANSLATE_PROMPT = """Ban la chuyen gia dich thuat ho so thuc tap sinh (TTS) Viet Nam sang tieng Nhat.
Hay dich cac truong thong tin sau sang tieng Nhat theo dung yeu cau:

- ten_vnm (ten nguoi): Chuyen sang Katakana phien am chuan (vi du: NGUYEN VAN A -> グエン ヴァン アー)
- dia_chi_vnm (dia chi): Dich sang tieng Nhat tu nhien, giu ten rieng
- noi_sinh_vnm (noi sinh): Dich ten tinh/thanh pho sang tieng Nhat
- noi_cap_cccd_vnm / noi_cap_hc_vnm: Dich sang tieng Nhat
- nguoi_giam_ho_vnm: Dich quan he sang tieng Nhat (Cha->父, Me->母, v.v.)
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


def translate_single(field_name: str, value: str, api_key: str) -> Optional[str]:
    prompt = f"""Dich gia tri sau sang tieng Nhat cho ho so TTS:
Truong: {field_name}
Gia tri: {value}

Quy tac:
- Ten nguoi -> Katakana
- Dia chi -> tieng Nhat tu nhien
- Ten to chuc -> phien am hoac dich
- Quan he gia dinh: Cha->父, Me->母, Anh->兄, Chi->姉, Em trai->弟, Em gai->妹, Vo->妻, Chong->夫

Chi tra ve ban dich, khong giai thich."""
    return _generate(api_key, prompt)
