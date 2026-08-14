import os
import openpyxl
from datetime import datetime

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
        set_val(ws, f'E{row}', f"{edu.start_date or ''}   ～ {edu.end_date or ''}")
        set_val(ws, f'K{row}', edu.school_name_jp or edu.school_name_vn or "")

    # Kinh nghiệm làm việc
    works = list(candidate.work_experiences)[:3]
    for i, w in enumerate(works):
        row = 17 + i
        start = w.start_date or ""
        end = w.end_date or "現在に至る"
        set_val(ws, f'E{row}', f"{start}   ～ {end}")
        set_val(ws, f'K{row}', w.company_name_jp or w.company_name_vn or "")
        set_val(ws, f'U{row}', w.job_title_jp or w.job_title_vn or "")

    # Gia đình
    fams = list(candidate.family_members)[:4]
    for i, f in enumerate(fams):
        row = 26 + i
        set_val(ws, f'A{row}', f.relationship_jp or f.relationship_vn or "")
        set_val(ws, f'C{row}', f.full_name or "")
        set_val(ws, f'K{row}', f.age or "")
        set_val(ws, f'M{row}', "⭕" if str(f.is_living_together).lower() in ["có", "yes", "true", "1"] else "")
        set_val(ws, f'O{row}', f.job_jp or f.job_vn or "")

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
