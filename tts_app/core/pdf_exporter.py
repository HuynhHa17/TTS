"""
pdf_exporter.py — Tạo file PDF hồ sơ TTS dạng 履歴書 (Rirekisho / Nhật Bản)
Sử dụng thư viện fpdf2 + font NotoSansJP để hỗ trợ tiếng Nhật & tiếng Việt.
"""
import os
from io import BytesIO
from datetime import datetime
from fpdf import FPDF

# Path đến font
_FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "fonts")
_FONT_PATH = os.path.join(_FONT_DIR, "NotoSansJP-Regular.ttf")

# Màu sắc
_COLOR_HEADER_BG = (30, 58, 95)    # #1E3A5F
_COLOR_HEADER_FG = (255, 255, 255)
_COLOR_SECTION_BG = (240, 244, 250) # #F0F4FA
_COLOR_LABEL_BG = (220, 230, 245)
_COLOR_BORDER = (150, 150, 150)
_COLOR_TEXT = (30, 30, 30)
_COLOR_TITLE_BG = (20, 40, 80)

# Kích thước trang A4
PAGE_W = 210
PAGE_H = 297
MARGIN = 8
CONTENT_W = PAGE_W - 2 * MARGIN


from core.translator import remove_vietnamese_accents

_REL_MAP_VN_TO_JP = {
    "cha": "父", "bố": "父", "ba": "父", "bố/mẹ": "父", "father": "父",
    "mẹ": "母", "má": "母", "mother": "母",
    "anh": "兄", "anh trai": "兄", "brother": "兄",
    "chị": "姉", "chị gái": "姉", "sister": "姉",
    "em": "弟", "em trai": "弟",
    "em gái": "妹",
    "vợ": "妻", "wife": "妻",
    "chồng": "夫", "husband": "夫",
    "con": "子", "con trai": "子", "con gái": "子",
    "ông": "祖父", "ông nội": "祖父", "ông ngoại": "祖父",
    "bà": "祖母", "bà nội": "祖母", "bà ngoại": "祖母",
    "chú": "叔父", "bác": "伯父", "cậu": "叔父",
    "cô": "叔母", "dì": "叔母", "mợ": "叔母", "thím": "叔母",
}

def _rel_to_jp(rel_str: str) -> str:
    if not rel_str:
        return ""
    s = str(rel_str).strip()
    return _REL_MAP_VN_TO_JP.get(s.lower(), s)


def _fmt_date_jp(val: str) -> str:
    """Chuyển chuỗi ngày → dạng YYYY年MM月DD日."""
    if not val:
        return ""
    s = str(val).strip()
    if "年" in s and "月" in s:
        return s
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            d = datetime.strptime(s, fmt)
            return f"{d.year}年{d.month:02d}月{d.day:02d}日"
        except ValueError:
            pass
    return s


def _fmt_date_vn(val: str) -> str:
    """Chuyển chuỗi ngày → dạng DD/MM/YYYY."""
    if not val:
        return ""
    s = str(val).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            d = datetime.strptime(s, fmt)
            return d.strftime("%d/%m/%Y")
        except ValueError:
            pass
    return s


def _age(dob: str) -> str:
    """Tính tuổi từ ngày sinh."""
    if not dob:
        return ""
    s = str(dob).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y", "%Y年%m月%d日"):
        try:
            bd = datetime.strptime(s, fmt)
            today = datetime.today()
            age = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
            return str(age)
        except ValueError:
            pass
    return ""


def _v(val, fallback="") -> str:
    """Safe string conversion."""
    if val is None:
        return fallback
    return str(val).strip() or fallback


class RirekishoPDF(FPDF):
    """PDF document class for 履歴書 format."""

    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_margins(MARGIN, MARGIN, MARGIN)
        self.set_auto_page_break(auto=True, margin=MARGIN)
        # Add font
        if os.path.exists(_FONT_PATH):
            self.add_font("NotoSansJP", "", _FONT_PATH)
            self._has_jp_font = True
        else:
            self._has_jp_font = False

    def set_jp_font(self, size: float):
        if self._has_jp_font:
            self.set_font("NotoSansJP", size=size)
        else:
            self.set_font("Helvetica", size=size)

    # ── Drawing helpers ────────────────────────────────────────────────────────

    def draw_cell(self, x, y, w, h, text="", fill_color=None, text_color=None,
                  font_size=7.5, align="L", border=1, multiline=False):
        """Draw a single cell at absolute position (x, y)."""
        self.set_xy(x, y)
        if fill_color:
            self.set_fill_color(*fill_color)
        else:
            self.set_fill_color(255, 255, 255)
        if text_color:
            self.set_text_color(*text_color)
        else:
            self.set_text_color(*_COLOR_TEXT)
        self.set_jp_font(font_size)
        self.set_draw_color(*_COLOR_BORDER)
        if multiline:
            self.multi_cell(w, h / max(1, text.count("\n") + 1) if text else h,
                            text, border=border, align=align,
                            fill=fill_color is not None, max_line_height=h)
        else:
            self.cell(w, h, text, border=border, align=align,
                      fill=fill_color is not None)

    def section_header(self, x, y, w, h, text, font_size=8):
        """Draw a section header (dark background)."""
        self.draw_cell(x, y, w, h, text,
                       fill_color=_COLOR_TITLE_BG,
                       text_color=_COLOR_HEADER_FG,
                       font_size=font_size, align="C")

    def label_cell(self, x, y, w, h, text, font_size=7):
        """Draw a label cell (light blue-grey background)."""
        self.draw_cell(x, y, w, h, text,
                       fill_color=_COLOR_LABEL_BG,
                       font_size=font_size, align="C")

    def value_cell(self, x, y, w, h, text, font_size=7.5, align="L"):
        """Draw a value cell (white background)."""
        self.draw_cell(x, y, w, h, text, font_size=font_size, align=align)


# ── Main builder ───────────────────────────────────────────────────────────────

def build_rirekisho_pdf(profile: dict) -> bytes:
    """
    Tạo PDF hồ sơ 履歴書 từ dữ liệu profile (dict chứa candidate, educations,
    workExperiences, familyMembers, skillExperiences, japanExperiences, v.v.)
    Trả về bytes của file PDF.
    """
    c   = profile.get("candidate", {}) or {}
    edu = profile.get("educations", []) or []
    wrk = profile.get("workExperiences", []) or []
    fam = profile.get("familyMembers", []) or []
    skills = profile.get("skillExperiences", []) or []
    japan_exps = profile.get("japanExperiences", []) or []
    assignment = profile.get("assignment") or {}

    pdf = RirekishoPDF()
    pdf.add_page()

    x0 = MARGIN
    y  = MARGIN
    W  = CONTENT_W

    # ── 1. TIÊU ĐỀ ─────────────────────────────────────────────────────────────
    now = datetime.now()
    today_str = f"{now.year}\u5e74{now.month:02d}\u6708{now.day:02d}\u65e5\u73fe\u5728"
    stt_str = f"番号：{_v(c.get('profile_code'), '—')}"

    # Hàng tiêu đề
    pdf.set_fill_color(*_COLOR_TITLE_BG)
    pdf.set_text_color(*_COLOR_HEADER_FG)
    pdf.set_draw_color(*_COLOR_BORDER)
    pdf.set_xy(x0, y)
    pdf.set_jp_font(8)
    pdf.cell(40, 7, stt_str, border=1, align="L", fill=True)
    pdf.set_jp_font(14)
    pdf.cell(W - 80, 7, "履  歴  書", border=1, align="C", fill=True)
    pdf.set_jp_font(7.5)
    pdf.cell(40, 7, today_str, border=1, align="R", fill=True)
    y += 7

    # ── 2. TÊN + NGÀY SINH ─────────────────────────────────────────────────────
    name_jp   = _v(c.get("full_name_katakana"), "—")
    name_eng  = _v(c.get("full_name_eng") or (remove_vietnamese_accents(c.get("full_name_vn", "")).upper() if c.get("full_name_vn") else ""), "—")
    dob_str   = _fmt_date_jp(_v(c.get("date_of_birth_jp") or c.get("date_of_birth")))
    age_str   = _age(_v(c.get("date_of_birth_jp") or c.get("date_of_birth")))
    gender    = _v(c.get("gender"), "")

    R_H = 6  # row height
    # Tên
    pdf.label_cell(x0, y, 30, R_H, "フリガナ")
    pdf.value_cell(x0+30, y, W-30, R_H, name_jp)
    y += R_H

    pdf.label_cell(x0, y, 8, R_H, "姓")
    pdf.label_cell(x0+8, y, 8, R_H, "名")
    pdf.value_cell(x0+16, y, 50, R_H, "")
    pdf.label_cell(x0+66, y, 20, R_H, "英字表記")
    pdf.value_cell(x0+86, y, W-86, R_H, name_eng)
    y += R_H

    # Ngày sinh / tuổi / giới tính
    pdf.label_cell(x0, y, 20, R_H, "生年月日")
    pdf.value_cell(x0+20, y, 40, R_H, dob_str)
    pdf.label_cell(x0+60, y, 18, R_H, "年齢")
    pdf.value_cell(x0+78, y, 15, R_H, f"({age_str})歳" if age_str else "")
    pdf.label_cell(x0+93, y, 15, R_H, "性別")
    gender_jp = "男" if gender in ("Nam", "Male", "男") else "女" if gender in ("Nữ", "Female", "女") else gender
    pdf.value_cell(x0+108, y, W-108, R_H, gender_jp, align="C")
    y += R_H

    # Nơi sinh
    pdf.label_cell(x0, y, 20, R_H, "出生地")
    pdf.value_cell(x0+20, y, W-20, R_H, _v(c.get("birthplace_jp") or c.get("birthplace_vn")))
    y += R_H

    # Địa chỉ
    pdf.label_cell(x0, y, 20, R_H, "現住所")
    pdf.value_cell(x0+20, y, W-20, R_H, _v(c.get("address_jp") or c.get("address_vn")))
    y += R_H

    # Hôn nhân / con cái / dân tộc
    ms = _v(c.get("marital_status"), "")
    ms_jp = "既婚" if ms in ("Đã kết hôn", "既婚") else "未婚" if ms in ("Độc thân", "Chưa kết hôn", "未婚") else ms
    ch = _v(c.get("has_children"), "")
    ch_jp = "有" if ch in ("Có", "有") else "無" if ch in ("Không", "無") else ch
    ethn = _v(c.get("ethnicity"), "キン")

    pdf.label_cell(x0, y, 20, R_H, "婚 姻")
    pdf.value_cell(x0+20, y, 25, R_H, ms_jp)
    pdf.label_cell(x0+45, y, 20, R_H, "子 供")
    pdf.value_cell(x0+65, y, 25, R_H, ch_jp)
    pdf.label_cell(x0+90, y, 20, R_H, "民 族")
    pdf.value_cell(x0+110, y, W-110, R_H, ethn)
    y += R_H

    y += 1  # small gap

    # ── 3. HỌC VẤN ──────────────────────────────────────────────────────────────
    pdf.section_header(x0, y, W, R_H, "学 歴", font_size=8)
    y += R_H

    pdf.label_cell(x0, y, 55, R_H-1, "期 間", font_size=6.5)
    pdf.label_cell(x0+55, y, W-55, R_H-1, "学校名", font_size=6.5)
    y += R_H - 1

    for e in edu[:4]:
        s = _fmt_date_jp(_v(e.get("start_date")))
        en = _fmt_date_jp(_v(e.get("end_date")))
        period = f"{s} ～ {en}" if s or en else ""
        school = _v(e.get("school_name_jp") or e.get("school_name_vn"))
        pdf.value_cell(x0, y, 55, R_H, period, font_size=7)
        pdf.value_cell(x0+55, y, W-55, R_H, school)
        y += R_H

    # Nếu ít hơn 3 hàng, thêm hàng trống
    for _ in range(max(0, 3 - len(edu))):
        pdf.value_cell(x0, y, 55, R_H, "")
        pdf.value_cell(x0+55, y, W-55, R_H, "")
        y += R_H

    y += 1

    # ── 4. KINH NGHIỆM LÀM VIỆC ─────────────────────────────────────────────────
    pdf.section_header(x0, y, W, R_H, "職 歴", font_size=8)
    y += R_H

    pdf.label_cell(x0, y, 40, R_H-1, "期 間", font_size=6.5)
    pdf.label_cell(x0+40, y, 80, R_H-1, "勤 務 先", font_size=6.5)
    pdf.label_cell(x0+120, y, W-120, R_H-1, "職 種", font_size=6.5)
    y += R_H - 1

    for w in wrk[:5]:
        s = _fmt_date_jp(_v(w.get("start_date")))
        en = _fmt_date_jp(_v(w.get("end_date")))
        period = f"{s} ～ {en}" if s or en else ""
        if not period and not s and not en:
            period = f"{_v(w.get('start_date'))} ～ {_v(w.get('end_date'))}"
        company = _v(w.get("company_name_jp") or w.get("company_name_vn"))
        job = _v(w.get("job_title_jp") or w.get("job_title_vn"))
        pdf.value_cell(x0, y, 40, R_H, period, font_size=6.5)
        pdf.value_cell(x0+40, y, 80, R_H, company, font_size=7)
        pdf.value_cell(x0+120, y, W-120, R_H, job, font_size=7)
        y += R_H

    for _ in range(max(0, 3 - len(wrk))):
        pdf.value_cell(x0, y, 40, R_H, "")
        pdf.value_cell(x0+40, y, 80, R_H, "")
        pdf.value_cell(x0+120, y, W-120, R_H, "")
        y += R_H

    y += 1

    # ── 5. NGOẠI NGỮ + KINH NGHIỆM NHẬT ────────────────────────────────────────
    lang = _v(c.get("foreign_languages"))
    jp_exp = japan_exps[0] if japan_exps else {}
    has_jp = bool(jp_exp) and bool(_v(jp_exp.get("start_date")))
    jp_period = ""
    if has_jp:
        jp_period = f"{_fmt_date_jp(_v(jp_exp.get('start_date')))} ～ {_fmt_date_jp(_v(jp_exp.get('end_date')))}"

    pdf.label_cell(x0, y, 20, R_H, "外国語")
    pdf.value_cell(x0+20, y, 55, R_H, lang)
    pdf.label_cell(x0+75, y, 20, R_H, "訪日経験")
    pdf.value_cell(x0+95, y, 5, R_H, "有" if has_jp else "", align="C")
    pdf.draw_cell(x0+100, y, 40, R_H, jp_period if has_jp else "", font_size=7)
    pdf.value_cell(x0+140, y, 5, R_H, "" if has_jp else "無", align="C")
    pdf.draw_cell(x0+145, y, W-145, R_H, "", font_size=7)
    y += R_H

    overseas = _v(c.get("overseas_experience_flag"), "")
    overseas_info = _v(c.get("overseas_experience_info"), "")
    pdf.label_cell(x0, y, 20, R_H, "渡航経験")
    pdf.value_cell(x0+20, y, 5, R_H, "有" if overseas in ("有", "Có") else "", align="C")
    pdf.value_cell(x0+25, y, 50, R_H, overseas_info if overseas in ("有", "Có") else "")
    pdf.value_cell(x0+75, y, 5, R_H, "" if overseas in ("有", "Có") else "無", align="C")
    pdf.draw_cell(x0+80, y, W-80, R_H, "")
    y += R_H

    y += 1

    # ── 6. GIA ĐÌNH ─────────────────────────────────────────────────────────────
    pdf.section_header(x0, y, W, R_H, "家 族 構 成", font_size=8)
    y += R_H

    # Header row
    COL_FAM = [15, 45, 12, 12, 70, 40]  # 続柄, 姓名, 年齢, 同居, 職業, 月収
    labels_fam = ["続柄", "姓 名", "年齢", "同居", "職 業 ・ 勤務先", "月 収"]
    xc = x0
    for lbl, cw in zip(labels_fam, COL_FAM):
        pdf.label_cell(xc, y, cw, R_H-1, lbl, font_size=6.5)
        xc += cw
    y += R_H - 1

    fam_rows = fam[:6]
    for fm in fam_rows:
        rel   = _rel_to_jp(_v(fm.get("relationship")))
        name  = _v(fm.get("full_name_en") or (remove_vietnamese_accents(fm.get("full_name", "")).upper() if fm.get("full_name") else ""))
        age   = _v(fm.get("age"))
        live_raw = _v(fm.get("living_together"))
        live  = "⭕" if str(live_raw).lower() in ["có", "yes", "true", "1", "o", "⭕"] else ""
        occ   = _v(fm.get("occupation_jp") or fm.get("occupation"))
        wp    = _v(fm.get("workplace"))
        occ_full = f"{occ}・{wp}" if occ and wp else occ or wp
        inc   = _v(fm.get("monthly_income"))
        vals  = [rel, name, str(age) if age else "", live, occ_full, inc]
        xc = x0
        for val, cw in zip(vals, COL_FAM):
            pdf.value_cell(xc, y, cw, R_H, val, font_size=7, align="C" if cw <= 15 else "L")
            xc += cw
        y += R_H

    # Empty rows to fill up to 5
    for _ in range(max(0, 4 - len(fam_rows))):
        xc = x0
        for cw in COL_FAM:
            pdf.value_cell(xc, y, cw, R_H, "")
            xc += cw
        y += R_H

    y += 1

    # ── 7. NGƯỜI THÂN Ở NHẬT ────────────────────────────────────────────────────
    pdf.label_cell(x0, y, 35, R_H, "在日親戚・知人の有無")
    rel_flag = _v(c.get("japan_relative_flag"), "無")
    rel_flag_jp = "有" if rel_flag in ("有", "Có") else "無"
    rel_info = _v(c.get("japan_relative_info"), "")
    pdf.value_cell(x0+35, y, 10, R_H, rel_flag_jp, align="C")
    pdf.label_cell(x0+45, y, 15, R_H, "姓名等:", font_size=6.5)
    pdf.value_cell(x0+60, y, W-60, R_H, rel_info, font_size=7)
    y += R_H

    y += 1

    # ── 8. SỨC KHOẺ ──────────────────────────────────────────────────────────────
    pdf.section_header(x0, y, W, R_H, "健 康 状 態", font_size=8)
    y += R_H

    ht = _v(c.get("height_cm"))
    wt = _v(c.get("weight_kg"))
    bt = _v(c.get("blood_type"))
    hand = _v(c.get("preferred_hand"), "右")
    hand_jp = "右" if hand in ("Phải", "Right", "右") else "左" if hand in ("Trái", "Left", "左") else hand
    vl = _v(c.get("vision_left"))
    vr = _v(c.get("vision_right"))
    hs = _v(c.get("health_status"), "良好")
    hs_map = {"Tốt": "良好", "Bình thường": "普通", "Không tốt": "不健康",
              "良好": "良好", "普通": "普通", "不健康": "不健康"}
    hs_jp = hs_map.get(hs, hs)
    hearing = _v(c.get("hearing"), "正常")
    hearing_map = {"Bình thường": "正常", "Bất thường": "異常", "正常": "正常", "異常": "異常"}
    hearing_jp = hearing_map.get(hearing, hearing)
    chronic = _v(c.get("chronic_disease"), "無")
    chronic_jp = "有" if chronic in ("Có", "有") else "無"
    chronic_name = _v(c.get("chronic_disease_name"))
    dental = _v(c.get("dental_treatment"), "無")
    dental_jp = "有" if dental in ("Có", "有") else "無"
    tattoos = _v(c.get("tattoos"))
    smoking = _v(c.get("smoking"))
    alcohol = _v(c.get("alcohol"))

    # Row 1: height, weight, preferred hand, vision, health
    r1_h = R_H
    pdf.label_cell(x0, y, 15, r1_h, "身 長", font_size=6.5)
    pdf.value_cell(x0+15, y, 18, r1_h, f"{ht} cm" if ht else "", align="C", font_size=7)
    pdf.label_cell(x0+33, y, 15, r1_h, "利き手", font_size=6.5)
    pdf.value_cell(x0+48, y, 10, r1_h, hand_jp, align="C", font_size=7)
    pdf.label_cell(x0+58, y, 12, r1_h, "視力", font_size=6.5)
    pdf.label_cell(x0+70, y, 8, r1_h, "左", font_size=6.5)
    pdf.value_cell(x0+78, y, 12, r1_h, vl or "", align="C", font_size=7)
    pdf.label_cell(x0+90, y, 8, r1_h, "右", font_size=6.5)
    pdf.value_cell(x0+98, y, 12, r1_h, vr or "", align="C", font_size=7)
    pdf.label_cell(x0+110, y, 15, r1_h, "健康状態", font_size=6)
    pdf.value_cell(x0+125, y, W-125, r1_h, hs_jp, align="C", font_size=7)
    y += r1_h

    # Row 2: weight, hearing, chronic disease
    pdf.label_cell(x0, y, 15, r1_h, "体 重", font_size=6.5)
    pdf.value_cell(x0+15, y, 18, r1_h, f"{wt} kg" if wt else "", align="C", font_size=7)
    pdf.label_cell(x0+33, y, 15, r1_h, "血液型", font_size=6.5)
    pdf.value_cell(x0+48, y, 10, r1_h, bt or "", align="C", font_size=7)
    pdf.label_cell(x0+58, y, 12, r1_h, "聴力", font_size=6.5)
    pdf.value_cell(x0+70, y, 40, r1_h, hearing_jp, align="C", font_size=7)
    pdf.label_cell(x0+110, y, 15, r1_h, "慢性病", font_size=6.5)
    pdf.value_cell(x0+125, y, 10, r1_h, chronic_jp, align="C", font_size=7)
    if chronic_jp == "有":
        pdf.value_cell(x0+135, y, W-135, r1_h, f"病名: {chronic_name}", font_size=7)
    else:
        pdf.value_cell(x0+135, y, W-135, r1_h, "", font_size=7)
    y += r1_h

    # Row 3: dental
    pdf.label_cell(x0, y, 30, r1_h, "歯科治療", font_size=6.5)
    pdf.value_cell(x0+30, y, 15, r1_h, dental_jp, align="C", font_size=7)
    pdf.label_cell(x0+45, y, 20, r1_h, "タトゥー", font_size=6.5)
    pdf.value_cell(x0+65, y, 40, r1_h, tattoos or "無", font_size=7)
    pdf.label_cell(x0+105, y, 20, r1_h, "喫煙", font_size=6.5)
    pdf.value_cell(x0+125, y, W-125, r1_h, smoking or "", font_size=7)
    y += r1_h

    y += 1

    # ── 9. MỤC ĐÍCH / KẾ HOẠCH / ĐIỂM MẠNH ──────────────────────────────────────
    def text_section(label, content, label_w=55, content_w=None, h=10):
        nonlocal y
        if content_w is None:
            content_w = W - label_w
        pdf.label_cell(x0, y, label_w, h, label, font_size=7)
        # Multi-line value
        pdf.set_xy(x0 + label_w, y)
        pdf.set_fill_color(255, 255, 255)
        pdf.set_text_color(*_COLOR_TEXT)
        pdf.set_jp_font(7.5)
        pdf.set_draw_color(*_COLOR_BORDER)
        pdf.multi_cell(content_w, h, content, border=1, align="L", fill=True)
        used_h = pdf.get_y() - y
        y += max(used_h, h)

    purpose_jp = _v(c.get("purpose_to_japan_jp") or c.get("purpose_to_japan_vn"))
    plan_jp    = _v(c.get("plan_after_return_jp") or c.get("plan_after_return_vn"))
    strong_jp  = _v(c.get("strengths_jp") or c.get("strengths_vn"))
    weak_jp    = _v(c.get("weaknesses_jp") or c.get("weaknesses_vn"))
    hobbies_jp = _v(c.get("hobbies_jp") or c.get("hobbies_vn"))

    text_section("日本に行く目的・動機", purpose_jp, label_w=50, h=9)
    text_section("帰国後の予定", plan_jp, label_w=50, h=9)

    # 長所 / 短所 / 趣味 on same row
    pdf.label_cell(x0, y, 12, R_H, "長所", font_size=7)
    pdf.value_cell(x0+12, y, 50, R_H, strong_jp, font_size=7)
    pdf.label_cell(x0+62, y, 12, R_H, "短所", font_size=7)
    pdf.value_cell(x0+74, y, 50, R_H, weak_jp, font_size=7)
    pdf.label_cell(x0+124, y, 12, R_H, "趣味", font_size=7)
    pdf.value_cell(x0+136, y, W-136, R_H, hobbies_jp, font_size=7)
    y += R_H

    # ── Output ────────────────────────────────────────────────────────────────────
    buf = BytesIO()
    pdf.output(buf)
    return buf.getvalue()
