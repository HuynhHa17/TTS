import os
import openpyxl
from datetime import datetime

from core.translator import remove_vietnamese_accents, format_date_to_jp

def _calculate_age(dob_str):
    if not dob_str:
        return ""
    try:
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
            try:
                dob = datetime.strptime(dob_str.strip(), fmt)
                return (datetime.now() - dob).days // 365
            except ValueError:
                pass
    except Exception:
        pass
    return ""

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
}

def _rel_to_jp(rel_str: str) -> str:
    if not rel_str:
        return ""
    s = str(rel_str).strip()
    return _REL_MAP_VN_TO_JP.get(s.lower(), s)

def _fmt_period_jp(dt_str: str) -> str:
    if not dt_str:
        return ""
    s = str(dt_str).strip()
    if not s or "年" in s:
        return s
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%m/%Y", "%m-%Y", "%Y-%m", "%Y.%m"):
        try:
            d = datetime.strptime(s, fmt)
            return f"{d.year}年{d.month:02d}月"
        except ValueError:
            pass
    return s

def set_val(ws, coord, val):
    try:
        ws[coord] = val
    except AttributeError:
        pass

def fill_rirekisho_excel(candidate, template_path, output_path):
    wb = openpyxl.load_workbook(template_path)
    ws = wb.active

    # Cơ bản
    set_val(ws, 'A1', f"番号：{candidate.profile_code or ''}")
    now = datetime.now()
    set_val(ws, 'P3', f"{now.year}年{now.month:02d}月{now.day:02d}日現在")
    
    set_val(ws, 'E4', candidate.full_name_katakana or "")
    set_val(ws, 'E5', candidate.full_name_eng or "")
    set_val(ws, 'E7', candidate.date_of_birth_jp or candidate.date_of_birth or "")
    
    age = _calculate_age(candidate.date_of_birth)
    if age:
        set_val(ws, 'M7', f"年齢 ({age})歳")

    # Giới tính
    gender_jp = str(candidate.gender).lower()
    if "nam" in gender_jp or "male" in gender_jp or "男" in gender_jp:
        set_val(ws, 'R7', "⭕男　・　女")
    elif "nữ" in gender_jp or "female" in gender_jp or "女" in gender_jp:
        set_val(ws, 'R7', "男　・　⭕女")
    else:
        set_val(ws, 'R7', "男　・　女")

    set_val(ws, 'E9', candidate.birthplace_jp or candidate.birthplace_vn or "")
    set_val(ws, 'E10', candidate.address_jp or candidate.address_vn or "")

    # Hôn nhân
    marital = str(candidate.marital_status).lower()
    if "đã" in marital or "married" in marital or "既婚" in marital:
        set_val(ws, 'E11', "⭕既婚　・ 未婚")
    elif marital and marital != "none":
        set_val(ws, 'E11', "既婚　・ ⭕未婚")
    else:
        set_val(ws, 'E11', "既婚　・ 未婚")

    # Con cái
    children = str(candidate.has_children).lower()
    if "có" in children or "yes" in children or "有" in children:
        set_val(ws, 'O11', "無　・　⭕有")
    elif children and children != "none":
        set_val(ws, 'O11', "⭕無　・　有")
    else:
        set_val(ws, 'O11', "無　・　有")

    set_val(ws, 'X11', candidate.ethnicity or "")

    # Học vấn
    edus = list(candidate.educations)[:3]
    for i, edu in enumerate(edus):
        row = 13 + i
        s_date = _fmt_period_jp(edu.start_date)
        e_date = _fmt_period_jp(edu.end_date)
        period = f"{s_date}   ～ {e_date}" if s_date or e_date else ""
        set_val(ws, f'E{row}', period)
        set_val(ws, f'K{row}', edu.school_name_jp or edu.school_name_vn or "")

    # Kinh nghiệm làm việc
    works = list(candidate.work_experiences)[:3]
    for i, w in enumerate(works):
        row = 17 + i
        s_date = _fmt_period_jp(w.start_date)
        e_date = _fmt_period_jp(w.end_date) or "現在に至る"
        period = f"{s_date}   ～ {e_date}" if s_date else ""
        set_val(ws, f'E{row}', period)
        set_val(ws, f'K{row}', w.company_name_jp or w.company_name_vn or "")
        set_val(ws, f'U{row}', w.job_title_jp or w.job_title_vn or "")

    # Gia đình
    fams = list(candidate.family_members)[:6]
    for i, f in enumerate(fams):
        row = 26 + i
        rel = f.relationship or ""
        rel_jp = _rel_to_jp(rel)
        set_val(ws, f'A{row}', rel_jp)
        # Ưu tiên họ tên Latin không dấu
        fam_name = f.full_name_en or (remove_vietnamese_accents(f.full_name).upper() if f.full_name else "")
        set_val(ws, f'C{row}', fam_name)
        set_val(ws, f'K{row}', str(f.age) if f.age is not None else "")
        is_live = str(f.living_together or "").lower() in ["có", "yes", "true", "1", "o", "⭕"]
        set_val(ws, f'M{row}', "⭕" if is_live else "")
        # Ưu tiên nghề nghiệp tiếng Nhật
        fam_occ = f.occupation_jp or f.occupation or f.workplace or ""
        set_val(ws, f'O{row}', fam_occ)
        if hasattr(f, 'monthly_income') and f.monthly_income:
            set_val(ws, f'X{row}', str(f.monthly_income))

    # Sức khoẻ & Thể chất
    if candidate.height_cm:
        set_val(ws, 'D35', str(candidate.height_cm))
    if candidate.weight_kg:
        set_val(ws, 'D36', str(candidate.weight_kg))
    if candidate.blood_type:
        set_val(ws, 'D37', str(candidate.blood_type))
    
    if candidate.preferred_hand:
        h = str(candidate.preferred_hand).lower()
        if "trái" in h or "left" in h or "左" in h:
            set_val(ws, 'G35', "⭕左  ・  右")
        elif "phải" in h or "right" in h or "右" in h:
            set_val(ws, 'G35', "左  ・  ⭕右")

    set_val(ws, 'N35', candidate.vision_left or "")
    set_val(ws, 'Q35', candidate.vision_right or "")

    health = str(candidate.health_status).lower()
    if "tốt" in health or "good" in health or "良好" in health:
        set_val(ws, 'V35', "⭕良好　　普通　　不健康")
    elif "bình thường" in health or "normal" in health or "普通" in health:
        set_val(ws, 'V35', "良好　　⭕普通　　不健康")
    elif health and health != "none":
        set_val(ws, 'V35', "良好　　普通　　⭕不健康")

    # Nguyện vọng
    set_val(ws, 'J40', candidate.purpose_to_japan_jp or candidate.purpose_to_japan_vn or "お金を稼いで、家族に支援する")
    set_val(ws, 'J41', candidate.plan_after_return_jp or candidate.plan_after_return_vn or "")
    set_val(ws, 'D42', candidate.strengths_jp or candidate.strengths_vn or "")
    set_val(ws, 'P42', candidate.weaknesses_jp or candidate.weaknesses_vn or "")
    set_val(ws, 'X42', candidate.hobbies_jp or candidate.hobbies_vn or "")

    wb.save(output_path)
    return output_path
