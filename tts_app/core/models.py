from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship as sqla_relationship
from datetime import datetime

from core.database import Base

def to_dict(obj):
    if not obj:
        return None
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

class Candidate(Base):
    __tablename__ = 'candidates'
    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_code = Column(String(50), nullable=True)
    full_name_vn = Column(String(100), nullable=False)
    full_name_eng = Column(String(100), nullable=True)
    full_name_katakana = Column(String(100), nullable=True)
    gender = Column(String(20), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    date_of_birth_jp = Column(String(30), nullable=True)       # dạng 2000年10月28日
    nationality = Column(String(50), default="Việt Nam")
    ethnicity = Column(String(50), nullable=True)              # dân tộc (キン族 etc.)
    mother_tongue = Column(String(50), default="Tiếng Việt")
    birthplace_vn = Column(String(200), nullable=True)
    birthplace_jp = Column(String(200), nullable=True)
    address_vn = Column(String(200), nullable=True)
    address_jp = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    marital_status = Column(String(50), nullable=True)
    has_children = Column(String(10), nullable=True)           # Có/Không
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    blood_type = Column(String(10), nullable=True)
    vision_left = Column(String(10), nullable=True)
    vision_right = Column(String(10), nullable=True)
    preferred_hand = Column(String(20), nullable=True)
    tattoos = Column(String(200), nullable=True)
    smoking = Column(String(50), nullable=True)
    alcohol = Column(String(50), nullable=True)
    # Sức khoẻ
    health_status = Column(String(20), nullable=True)          # 良好/普通/不健康
    hearing = Column(String(20), nullable=True)                # 正常/異常
    chronic_disease = Column(String(10), nullable=True)        # 有/無
    chronic_disease_name = Column(String(200), nullable=True)
    dental_treatment = Column(String(10), nullable=True)       # 有/無
    # Người giám hộ
    guardian_name_vn = Column(String(200), nullable=True)
    guardian_name_jp = Column(String(200), nullable=True)
    guardian_address_vn = Column(String(300), nullable=True)
    guardian_address_jp = Column(String(300), nullable=True)
    guardian_phone = Column(String(50), nullable=True)
    # Ngoại ngữ & quan hệ Nhật
    foreign_languages = Column(String(300), nullable=True)
    japan_relative_flag = Column(String(10), nullable=True)    # 有/無
    japan_relative_info = Column(Text, nullable=True)          # tên/tuổi/quan hệ/trú xứ/tư cách lưu trú
    # Kinh nghiệm Nhật
    japan_experience_flag = Column(Integer, default=0)
    japan_intern_flag = Column(Integer, default=0)
    coe_refusal_flag = Column(Integer, default=0)
    overseas_experience_flag = Column(String(10), nullable=True) # 有/無
    overseas_experience_info = Column(String(300), nullable=True)
    # Tóm tắt KN nghề (hiển thị trong Excel)
    skill_summary_vn = Column(String(300), nullable=True)      # VD: 3 năm
    skill_summary_jp = Column(String(300), nullable=True)      # VD: ３年
    # Mục đích, kế hoạch, tính cách
    purpose_to_japan_vn = Column(Text, nullable=True)
    purpose_to_japan_jp = Column(Text, nullable=True)
    plan_after_return_vn = Column(Text, nullable=True)
    plan_after_return_jp = Column(Text, nullable=True)
    strengths_vn = Column(String(300), nullable=True)
    strengths_jp = Column(String(300), nullable=True)
    weaknesses_vn = Column(String(300), nullable=True)
    weaknesses_jp = Column(String(300), nullable=True)
    hobbies_vn = Column(String(300), nullable=True)
    hobbies_jp = Column(String(300), nullable=True)
    status = Column(String(20), default='draft') # draft, reviewing, completed
    custom_fields = Column(Text, nullable=True) # JSON store for dynamic fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    identity_documents = sqla_relationship("IdentityDocument", back_populates="candidate", cascade="all, delete-orphan")
    educations = sqla_relationship("Education", back_populates="candidate", cascade="all, delete-orphan")
    work_experiences = sqla_relationship("WorkExperience", back_populates="candidate", cascade="all, delete-orphan")
    skill_experiences = sqla_relationship("SkillExperience", back_populates="candidate", cascade="all, delete-orphan")
    japan_experiences = sqla_relationship("JapanExperience", back_populates="candidate", cascade="all, delete-orphan")
    family_members = sqla_relationship("FamilyMember", back_populates="candidate", cascade="all, delete-orphan")
    assignment = sqla_relationship("CandidateAssignment", back_populates="candidate", uselist=False, cascade="all, delete-orphan")

class IdentityDocument(Base):
    __tablename__ = 'identity_documents'
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=False)
    document_type = Column(String(50), nullable=False) # CCCD, Passport, vb.
    document_number = Column(String(50), nullable=False)
    issue_date = Column(String(50), nullable=True)
    issue_date_jp = Column(String(50), nullable=True)
    issue_place_vn = Column(String(200), nullable=True)
    issue_place_jp = Column(String(200), nullable=True)

    candidate = sqla_relationship("Candidate", back_populates="identity_documents")

class Education(Base):
    __tablename__ = 'educations'
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=False)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    school_name_vn = Column(String(200), nullable=True)
    school_name_jp = Column(String(200), nullable=True)
    education_level = Column(String(50), nullable=True)

    candidate = sqla_relationship("Candidate", back_populates="educations")

class WorkExperience(Base):
    __tablename__ = 'work_experiences'
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=False)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    company_name_vn = Column(String(200), nullable=True)
    company_name_jp = Column(String(200), nullable=True)
    job_title_vn = Column(String(200), nullable=True)
    job_title_jp = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)

    candidate = sqla_relationship("Candidate", back_populates="work_experiences")

class SkillExperience(Base):
    __tablename__ = 'skill_experiences'
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=False)
    skill_name_vn = Column(String(100), nullable=True)
    skill_name_jp = Column(String(100), nullable=True)
    experience_years = Column(Integer, default=0)
    experience_months = Column(Integer, default=0)
    target_skill_flag = Column(Integer, default=0)

    candidate = sqla_relationship("Candidate", back_populates="skill_experiences")

class JapanExperience(Base):
    __tablename__ = 'japan_experiences'
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=False)
    has_japan_experience = Column(Integer, default=0)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    residence_status = Column(String(100), nullable=True)
    purpose_or_type = Column(String(200), nullable=True)

    candidate = sqla_relationship("Candidate", back_populates="japan_experiences")

class FamilyMember(Base):
    __tablename__ = 'family_members'
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=False)
    relationship = Column(String(50), nullable=True)
    full_name = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    living_together = Column(String(50), nullable=True)
    occupation = Column(String(100), nullable=True)
    workplace = Column(String(200), nullable=True)
    monthly_income = Column(String(50), nullable=True)

    candidate = sqla_relationship("Candidate", back_populates="family_members")

class Organization(Base):
    __tablename__ = 'organizations'
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(50), nullable=False) # supervising, accepting, sending
    name_vn = Column(String(200), nullable=True)
    name_jp = Column(String(200), nullable=True)
    representative_vn = Column(String(200), nullable=True)
    representative_jp = Column(String(200), nullable=True)
    address_vn = Column(String(200), nullable=True)
    address_jp = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)

class CandidateAssignment(Base):
    __tablename__ = 'candidate_assignments'
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=False)
    supervising_org_id = Column(Integer, ForeignKey('organizations.id'), nullable=True)
    accepting_org_id = Column(Integer, ForeignKey('organizations.id'), nullable=True)
    sending_org_id = Column(Integer, ForeignKey('organizations.id'), nullable=True)
    internship_field_vn = Column(String(200), nullable=True)
    internship_field_jp = Column(String(200), nullable=True)
    interview_date = Column(String(50), nullable=True)
    pass_date = Column(String(50), nullable=True)
    expected_entry_date = Column(String(50), nullable=True)

    candidate = sqla_relationship("Candidate", back_populates="assignment")
    supervising_org = sqla_relationship("Organization", foreign_keys=[supervising_org_id])
    accepting_org = sqla_relationship("Organization", foreign_keys=[accepting_org_id])
    sending_org = sqla_relationship("Organization", foreign_keys=[sending_org_id])

class TranslationLog(Base):
    __tablename__ = 'translation_logs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=False)
    field_name = Column(String(100), nullable=False)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False)
    language = Column(String(20), default='ja')
    ai_model = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(String(20), default='suggested')
    edited_by_user = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class DocumentTemplate(Base):
    __tablename__ = 'document_templates'
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False) # docx, xlsx
    version = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Integer, default=1)

class ImportJob(Base):
    __tablename__ = 'import_jobs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    source_type = Column(String(50), nullable=False) # google_sheet, excel, csv
    source_name = Column(String(200), nullable=False)
    sheet_name = Column(String(100), nullable=True)
    status = Column(String(20), default='pending') # pending, staged, completed, failed
    total_rows = Column(Integer, default=0)
    success_rows = Column(Integer, default=0)
    warning_rows = Column(Integer, default=0)
    error_rows = Column(Integer, default=0)
    mapping_config = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ImportRow(Base):
    __tablename__ = 'import_rows'
    id = Column(Integer, primary_key=True, autoincrement=True)
    import_job_id = Column(Integer, ForeignKey('import_jobs.id'), nullable=False)
    row_number = Column(Integer, nullable=False)
    raw_data = Column(Text, nullable=True) # JSON
    normalized_data = Column(Text, nullable=True) # JSON
    status = Column(String(20), default='valid') # valid, warning, error, duplicate
    duplicate_action = Column(String(20), nullable=True) # skip, update, create_new
    existing_candidate_id = Column(Integer, nullable=True)
    existing_candidate_name = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)

    job = sqla_relationship("ImportJob", backref="rows")

class AppSettings(Base):
    __tablename__ = 'app_settings'
    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=True)
    description = Column(String(200), nullable=True)
