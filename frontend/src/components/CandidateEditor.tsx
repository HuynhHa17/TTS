import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Trash2, Calendar } from 'lucide-react';
import {
  toISODate,
  toJapaneseDate,
  formatDateVN,
  removeVietnameseAccents,
  translateGuardianNameOffline,
  OFFLINE_JOBS_EN,
  OFFLINE_JOBS_JP,
} from '../utils/dateFormat';
import type {
  FullCandidateProfile,
  Candidate,
  IdentityDocument,
  Education,
  WorkExperience,
  FamilyMember,
  SkillExperience,
  CustomFieldDef,
} from '../types';

interface CandidateEditorProps {
  profile: FullCandidateProfile | null;
  onSave: (data: FullCandidateProfile) => void;
  onBack: () => void;
  onDelete?: (id: number) => void;
  onDownloadRirekisho: (id: number) => void;
  onDownloadTcmmxd: (id: number) => void;
}

// ─── blank factories ───────────────────────────────────────────────
const blankCandidate = (): Candidate => ({
  id: 0,
  profile_code: '',
  full_name_vn: '',
  full_name_eng: '',
  full_name_katakana: '',
  gender: '',
  date_of_birth: '',
  date_of_birth_jp: '',
  nationality: 'Việt Nam',
  ethnicity: 'Kinh',
  mother_tongue: 'Tiếng Việt',
  birthplace_vn: '',
  birthplace_jp: '',
  address_vn: '',
  address_jp: '',
  phone: '',
  marital_status: '',
  has_children: 'Không',
  height_cm: undefined,
  weight_kg: undefined,
  blood_type: '',
  vision_left: '',
  vision_right: '',
  preferred_hand: '',
  tattoos: 'Không',
  smoking: 'Không',
  alcohol: 'Không',
  health_status: 'Tốt',
  hearing: 'Bình thường',
  chronic_disease: 'Không',
  chronic_disease_name: '',
  dental_treatment: 'Không',
  guardian_name_vn: '',
  guardian_name_en: '',
  guardian_name_jp: '',
  guardian_relationship: '',
  guardian_job_vn: '',
  guardian_job_en: '',
  guardian_job_jp: '',
  guardian_address_vn: '',
  guardian_address_jp: '',
  guardian_phone: '',
  foreign_languages: '',
  japan_relative_flag: 'Không',
  japan_relative_info: '',
  japan_experience_flag: 0,
  japan_intern_flag: 0,
  coe_refusal_flag: 0,
  overseas_experience_flag: 'Không',
  overseas_experience_info: '',
  skill_summary_vn: '',
  skill_summary_jp: '',
  purpose_to_japan_vn: '',
  purpose_to_japan_jp: '',
  plan_after_return_vn: '',
  plan_after_return_jp: '',
  strengths_vn: '',
  strengths_jp: '',
  weaknesses_vn: '',
  weaknesses_jp: '',
  hobbies_vn: '',
  hobbies_jp: '',
  status: 'draft',
});

const blankDoc = (): IdentityDocument => ({
  candidate_id: 0, document_type: 'CCCD', document_number: '',
  issue_date: '', issue_date_jp: '', issue_place_vn: '', issue_place_jp: '',
});
const blankEdu = (): Education => ({
  candidate_id: 0, start_date: '', end_date: '',
  school_name_vn: '', school_name_jp: '', education_level: '',
});
const blankWork = (): WorkExperience => ({
  candidate_id: 0, start_date: '', end_date: '',
  company_name_vn: '', company_name_jp: '',
  job_title_vn: '', job_title_jp: '', description: '',
});
const blankFamily = (): FamilyMember => ({
  candidate_id: 0, relationship: '', full_name: '', full_name_en: '',
  age: 0, living_together: '', occupation: '', occupation_en: '', occupation_jp: '', workplace: '', monthly_income: '',
});
const blankSkill = (): SkillExperience => ({
  candidate_id: 0, skill_name_vn: '', skill_name_jp: '',
  experience_years: 0, experience_months: 0, target_skill_flag: 0,
});

// ─── UI atoms ─────────────────────────────────────────────────────
function Field({ label, jp, en, children }: { label: string; jp?: boolean; en?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-[#444]">
        {label}
        {jp && <span className="ml-1 text-[#7C3AED] font-extrabold text-[10px]">JP</span>}
        {en && <span className="ml-1 text-[#0284C7] font-extrabold text-[10px]">EN</span>}
      </label>
      {children}
    </div>
  );
}

function Inp({ value, onChange, placeholder = '', type = 'text', jp = false, en = false, rows }:
  { value: string | number | undefined; onChange: (v: string) => void; placeholder?: string; type?: string; jp?: boolean; en?: boolean; rows?: number }) {
  const cls = `artistic-input py-2 px-3 font-medium w-full text-sm
    ${jp ? 'border-[#7C3AED] bg-[#FAF8FF] focus:shadow-[3px_3px_0_#7C3AED]' : ''}
    ${en ? 'border-[#0284C7] bg-[#F0F9FF] focus:shadow-[3px_3px_0_#0284C7]' : ''}`;
  if (rows) {
    return (
      <textarea rows={rows} value={value ?? ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className={cls + ' resize-none'} />
    );
  }
  if (type === 'date') {
    const dateRef = React.useRef<HTMLInputElement>(null);
    const rawVal = value != null ? String(value) : '';
    const isoVal = toISODate(rawVal);
    const vnFormatted = formatDateVN(rawVal);
    return (
      <div className="flex flex-col gap-1 w-full relative">
        <div className="relative flex items-center w-full">
          <input 
            type="text" 
            value={rawVal} 
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || 'DD/MM/YYYY (VD: 15/01/2000)'} 
            className={`${cls} pr-9`} 
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (dateRef.current) {
                if ('showPicker' in HTMLInputElement.prototype) {
                  try {
                    dateRef.current.showPicker();
                  } catch {
                    dateRef.current.focus();
                  }
                } else {
                  dateRef.current.focus();
                }
              }
            }}
            className="absolute right-2.5 text-[#888] hover:text-[#FF4D00] transition-colors p-1"
            title="Chọn ngày từ lịch"
          >
            <Calendar size={15} />
          </button>
          {/* Hidden native date input for optional calendar picker */}
          <input
            ref={dateRef}
            type="date"
            value={isoVal}
            onChange={e => {
              const val = e.target.value;
              if (val) {
                const formatted = formatDateVN(val);
                onChange(formatted || val);
              }
            }}
            className="sr-only absolute pointer-events-none opacity-0"
            tabIndex={-1}
          />
        </div>
        {rawVal && vnFormatted && vnFormatted !== rawVal && !rawVal.includes('/') && (
          <span className="text-[11px] font-bold text-[#FF4D00] flex items-center gap-1">
            <Calendar size={11} /> Định dạng: {vnFormatted}
          </span>
        )}
      </div>
    );
  }
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} className={cls} />
  );
}

function Sel({ value, onChange, opts }: { value: string | undefined; onChange: (v: string) => void; opts: string[] | { label: string; value: string }[] }) {
  const options = (opts as unknown[]).map((o): { label: string; value: string } =>
    typeof o === 'string' ? { label: o, value: o } : o as { label: string; value: string }
  );
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)}
      className="artistic-input py-2 px-3 font-medium w-full text-sm bg-white">
      <option value="">-- Chọn --</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between border-b-2 border-[#1A1A1A]/10 pb-2 mb-4">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#FF4D00]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddRowBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="mt-3 text-sm font-bold text-[#FF4D00] border-2 border-dashed border-[#FF4D00] rounded px-4 py-2 hover:bg-[#FF4D00] hover:text-white transition-colors">
      + {label}
    </button>
  );
}

function RemBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="text-xs font-bold text-red-500 border border-red-300 rounded px-2 py-1 hover:bg-red-50">
      Xóa
    </button>
  );
}

// ─── helpers ──────────────────────────────────────────────────────
const GENDERS = ['Nam', 'Nữ'];
const MARITAL = ['Độc thân', 'Đã kết hôn', 'Ly hôn'];
const YN = ['Có', 'Không'];
const BLOOD = ['A', 'B', 'AB', 'O'];
const HANDS = ['Phải', 'Trái', 'Hai tay'];
const HEALTH = ['Tốt', 'Bình thường', 'Không tốt'];
const HEARING = ['Bình thường', 'Bất thường'];
const EDU_LEVELS = ['THCS', 'THPT', 'Trung cấp', 'Cao đẳng', 'Đại học', 'Sau đại học'];
const RELATIONSHIPS = ['Bố', 'Mẹ', 'Anh', 'Chị', 'Em', 'Vợ/Chồng', 'Con', 'Ông', 'Bà', 'Khác'];
const ALCOHOL_OPTS = ['Không', 'Thỉnh thoảng', 'Thường xuyên'];

// ─── main component ────────────────────────────────────────────────
export function CandidateEditor({ profile, onSave, onBack, onDelete, onDownloadRirekisho, onDownloadTcmmxd }: CandidateEditorProps) {
  const [tab, setTab] = useState('personal');
  const [cand, setCand] = useState<Candidate>(blankCandidate());
  const [docs, setDocs] = useState<IdentityDocument[]>([{ ...blankDoc(), document_type: 'CCCD' }, { ...blankDoc(), document_type: 'Passport' }]);
  const [edus, setEdus] = useState<Education[]>([blankEdu()]);
  const [works, setWorks] = useState<WorkExperience[]>([blankWork()]);
  const [skills, setSkills] = useState<SkillExperience[]>([blankSkill()]);
  const [family, setFamily] = useState<FamilyMember[]>([blankFamily()]);
  const [internshipFieldVn, setInternshipFieldVn] = useState('');
  const [internshipFieldJp, setInternshipFieldJp] = useState('');
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);

  // ── Toast state ────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Translating state — which field is pending ─────────────
  const [translating, setTranslating] = useState<string | null>(null);
  const [translatingAll, setTranslatingAll] = useState(false);

  // ── Translate single field inline ──────────────────────────
  const translateSingle = useCallback(async (fieldName: string, value: string, onResult: (v: string) => void) => {
    if (!value.trim()) { showToast('Chưa có nội dung để dịch', 'info'); return; }
    setTranslating(fieldName);
    try {
      const res = await fetch('/api/translate/field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_name: fieldName, value }),
      });
      const d = await res.json();
      if (res.ok) { onResult(d.translation); showToast('✅ Dịch thành công!'); }
      else showToast(`❌ ${d.error}`, 'error');
    } catch { showToast('❌ Không kết nối được backend', 'error'); }
    finally { setTranslating(null); }
  }, [showToast]);

  // ── Translate all VN fields at once ────────────────────────
  const translateAll = useCallback(async () => {
    setTranslatingAll(true);
    showToast('🔄 Đang dịch toàn bộ thông tin hồ sơ...', 'info');

    // 1. Chuẩn bị payload gửi Gemini
    const fields: Record<string, string> = {};
    if (cand.full_name_vn)        fields.ten_vnm           = cand.full_name_vn;
    if (cand.address_vn)          fields.dia_chi_vnm       = cand.address_vn;
    if (cand.birthplace_vn)       fields.noi_sinh_vnm      = cand.birthplace_vn;
    if (cand.guardian_name_vn)    fields.nguoi_giam_ho_vnm = cand.guardian_name_vn;
    if (cand.guardian_job_vn)     fields.nghe_giam_ho_vnm  = cand.guardian_job_vn;
    if (cand.guardian_address_vn) fields.dc_nguoi_gh_vnm   = cand.guardian_address_vn;
    if (internshipFieldVn)        fields.nganh_nghe_vnm    = internshipFieldVn;
    if (cand.skill_summary_vn)    fields.kn_tom_tat_vnm    = cand.skill_summary_vn;
    if (cand.purpose_to_japan_vn) fields.muc_dich_vnm      = cand.purpose_to_japan_vn;
    if (cand.plan_after_return_vn)fields.ke_hoach_vnm     = cand.plan_after_return_vn;
    if (cand.strengths_vn)        fields.diem_manh_vnm     = cand.strengths_vn;
    if (cand.weaknesses_vn)       fields.diem_yeu_vnm      = cand.weaknesses_vn;
    if (cand.hobbies_vn)          fields.so_thich_vnm      = cand.hobbies_vn;

    // Học vấn
    edus.forEach((e, i) => {
      if (e.school_name_vn) fields[`ten_truong_${i + 1}`] = e.school_name_vn;
    });

    // Quá trình làm việc
    works.forEach((w, i) => {
      if (w.company_name_vn) fields[`ten_dn_${i + 1}`] = w.company_name_vn;
      if (w.job_title_vn)    fields[`chuc_vu_${i + 1}`] = w.job_title_vn;
    });

    // Kỹ năng
    skills.forEach((s, i) => {
      if (s.skill_name_vn) fields[`ky_nang_${i + 1}`] = s.skill_name_vn;
    });

    // Thành viên gia đình
    family.forEach((fm, i) => {
      if (fm.full_name)  fields[`tv_ten_${i + 1}`]  = fm.full_name;
      if (fm.occupation) fields[`tv_nghe_${i + 1}`] = fm.occupation;
    });

    // Giấy tờ
    docs.forEach((d, i) => {
      if (d.document_type === 'CCCD' && d.issue_place_vn) fields.noi_cap_cccd_vnm = d.issue_place_vn;
      else if (d.document_type === 'Passport' && d.issue_place_vn) fields.noi_cap_hc_vnm = d.issue_place_vn;
      else if (d.issue_place_vn) fields[`noi_cap_doc_${i + 1}`] = d.issue_place_vn;
    });

    // Trường tùy chỉnh
    customFieldDefs.forEach(f => {
      if (f.requireJp && cand.custom_fields?.[f.id]) {
        fields[`custom_${f.id}`] = cand.custom_fields[f.id];
      }
    });

    let t: Record<string, string> = {};
    let isAiSuccess = false;

    if (Object.keys(fields).length > 0) {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        });
        const data = await res.json();
        if (res.ok && data.translations) {
          t = data.translations as Record<string, string>;
          isAiSuccess = true;
        }
      } catch (err) {
        console.warn('Translate API call warning, falling back to offline normalization:', err);
      }
    }

    // 2. Cập nhật dữ liệu vào state với quy tắc dự phòng ngoại tuyến đầy đủ
    const dobJp = cand.date_of_birth ? toJapaneseDate(cand.date_of_birth) : undefined;
    const nameEng = t.full_name_eng || (cand.full_name_vn ? removeVietnameseAccents(cand.full_name_vn).toUpperCase() : cand.full_name_eng);
    const guardianNameEng = t.guardian_name_en || (cand.guardian_name_vn ? translateGuardianNameOffline(cand.guardian_name_vn) : cand.guardian_name_en);
    const guardianJobEng = t.guardian_job_en || (cand.guardian_job_vn ? OFFLINE_JOBS_EN[cand.guardian_job_vn.toLowerCase()] || cand.guardian_job_vn : cand.guardian_job_en);
    const guardianJobJp = t.guardian_job_jp || (cand.guardian_job_vn ? OFFLINE_JOBS_JP[cand.guardian_job_vn.toLowerCase()] || cand.guardian_job_vn : cand.guardian_job_jp);

    setCand(prev => {
      const updatedCustom: Record<string, string> = { ...(prev.custom_fields || {}) };
      customFieldDefs.forEach(f => {
        if (f.requireJp && prev.custom_fields?.[f.id]) {
          const jpKey = `${f.id}_jp`;
          const translatedVal = t[`custom_${f.id}_jpn`] || t[`custom_${f.id}`] || t[jpKey];
          if (translatedVal) {
            updatedCustom[jpKey] = translatedVal;
          }
        }
      });

      return {
        ...prev,
        date_of_birth_jp:    dobJp ?? prev.date_of_birth_jp,
        full_name_eng:       nameEng ?? prev.full_name_eng,
        full_name_katakana:  t.ten_phien_am ?? prev.full_name_katakana,
        address_jp:          t.dia_chi_jpn ?? prev.address_jp,
        birthplace_jp:       t.noi_sinh_jpn ?? prev.birthplace_jp,
        guardian_name_en:    guardianNameEng ?? prev.guardian_name_en,
        guardian_name_jp:    t.guardian_name_jp ?? prev.guardian_name_jp,
        guardian_job_en:     guardianJobEng ?? prev.guardian_job_en,
        guardian_job_jp:     guardianJobJp ?? prev.guardian_job_jp,
        guardian_address_jp: t.dc_nguoi_gh_jpn ?? prev.guardian_address_jp,
        skill_summary_jp:    t.kn_tom_tat_jpn ?? prev.skill_summary_jp,
        purpose_to_japan_jp: t.muc_dich_jpn ?? prev.purpose_to_japan_jp,
        plan_after_return_jp:t.ke_hoach_jpn ?? prev.plan_after_return_jp,
        strengths_jp:        t.diem_manh_jpn ?? prev.strengths_jp,
        weaknesses_jp:       t.diem_yeu_jpn ?? prev.weaknesses_jp,
        hobbies_jp:          t.so_thich_jpn ?? prev.hobbies_jp,
        custom_fields:       updatedCustom,
      };
    });

    if (t.nganh_nghe_jpn) setInternshipFieldJp(t.nganh_nghe_jpn);

    // Học vấn
    setEdus(prev => prev.map((e, i) => {
      const jp = t[`ten_truong_${i + 1}_jpn`] || t[`ten_truong_${i + 1}`];
      return jp ? { ...e, school_name_jp: jp } : e;
    }));

    // Quá trình làm việc
    setWorks(prev => prev.map((w, i) => {
      const compJp = t[`ten_dn_${i + 1}_jpn`] || t[`ten_dn_${i + 1}`];
      const jobJp = t[`chuc_vu_${i + 1}_jpn`] || t[`chuc_vu_${i + 1}`] || (w.job_title_vn ? OFFLINE_JOBS_JP[w.job_title_vn.toLowerCase()] : undefined);
      return {
        ...w,
        company_name_jp: compJp ?? w.company_name_jp,
        job_title_jp: jobJp ?? w.job_title_jp,
      };
    }));

    // Kỹ năng
    setSkills(prev => prev.map((s, i) => {
      const skillJp = t[`ky_nang_${i + 1}_jpn`] || t[`ky_nang_${i + 1}`];
      return skillJp ? { ...s, skill_name_jp: skillJp } : s;
    }));

    // Thành viên gia đình
    setFamily(prev => prev.map((fm, i) => {
      const nameEn = t[`tv_ten_${i + 1}_en`] || t[`tv_ten_${i + 1}`] || (fm.full_name ? removeVietnameseAccents(fm.full_name).toUpperCase() : fm.full_name_en);
      const jobEn = t[`tv_nghe_${i + 1}_en`] || (fm.occupation ? OFFLINE_JOBS_EN[fm.occupation.toLowerCase()] : fm.occupation_en);
      const jobJp = t[`tv_nghe_${i + 1}_jpn`] || t[`tv_nghe_${i + 1}`] || (fm.occupation ? OFFLINE_JOBS_JP[fm.occupation.toLowerCase()] : fm.occupation_jp);
      return {
        ...fm,
        full_name_en: nameEn ?? fm.full_name_en,
        occupation_en: jobEn ?? fm.occupation_en,
        occupation_jp: jobJp ?? fm.occupation_jp,
      };
    }));

    // Giấy tờ
    setDocs(prev => prev.map((d, i) => {
      const docJpDate = d.issue_date ? toJapaneseDate(d.issue_date) : undefined;
      let placeJp = d.issue_place_jp;
      if (d.document_type === 'CCCD') {
        placeJp = t.noi_cap_cccd_jpn || 'ベトナム社会秩序行政管理警察局';
      } else if (d.document_type === 'Passport') {
        placeJp = t.noi_cap_hc_jpn || 'ベトナム出入国管理局';
      } else {
        placeJp = t[`noi_cap_doc_${i + 1}`] || placeJp;
      }
      return {
        ...d,
        issue_date_jp: docJpDate ?? d.issue_date_jp,
        issue_place_jp: placeJp,
      };
    }));

    if (isAiSuccess) {
      showToast('✅ Đã dịch toàn bộ các trường thành công!');
    } else {
      showToast('✅ Đã tự động chuẩn hóa & dịch tất cả các trường (tên EN, ngày tháng JP, nghề nghiệp)!');
    }
    setTranslatingAll(false);
  }, [cand, edus, works, skills, family, docs, internshipFieldVn, customFieldDefs, showToast]);

  useEffect(() => {
    // Fetch custom field definitions
    fetch('/api/settings')
      .then(res => res.json())
      .then(d => {
        if (d.custom_field_defs) {
          try {
            setCustomFieldDefs(JSON.parse(d.custom_field_defs));
          } catch {
            setCustomFieldDefs([]);
          }
        }
      })
      .catch(() => {});

    if (profile) {
      setCand(profile.candidate);
      if (profile.identityDocuments?.length) {
        setDocs(profile.identityDocuments);
      }
      if (profile.educations?.length) setEdus(profile.educations);
      if (profile.workExperiences?.length) setWorks(profile.workExperiences);
      if (profile.skillExperiences?.length) setSkills(profile.skillExperiences);
      if (profile.familyMembers?.length) setFamily(profile.familyMembers);
      if (profile.assignment) {
        setInternshipFieldVn(profile.assignment.internship_field_vn ?? '');
        setInternshipFieldJp(profile.assignment.internship_field_jp ?? '');
      }
    } else {
      setCand(blankCandidate());
      setDocs([{ ...blankDoc(), document_type: 'CCCD' }, { ...blankDoc(), document_type: 'Passport' }]);
      setEdus([blankEdu()]);
      setWorks([blankWork()]);
      setSkills([blankSkill()]);
      setFamily([blankFamily()]);
      setInternshipFieldVn('');
      setInternshipFieldJp('');
    }
    setTab('personal');
  }, [profile]);

  const setC = (field: keyof Candidate, value: unknown) =>
    setCand(prev => ({ ...prev, [field]: value }));

  // ── Soft validation: warn but don't block ──────────────────
  const [showMissingConfirm, setShowMissingConfirm] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const doSave = () => {
    setShowMissingConfirm(false);
    onSave({
      candidate: cand,
      identityDocuments: docs,
      educations: edus,
      workExperiences: works,
      skillExperiences: skills,
      japanExperiences: profile?.japanExperiences ?? [],
      familyMembers: family,
      assignment: {
        ...(profile?.assignment ?? { candidate_id: cand.id }),
        candidate_id: cand.id,
        internship_field_vn: internshipFieldVn,
        internship_field_jp: internshipFieldJp,
      },
    });
  };

  const handleSave = () => {
    const missing: string[] = [];
    if (!cand.full_name_vn?.trim()) missing.push('Họ tên (Tiếng Việt)');
    if (!cand.gender?.trim()) missing.push('Giới tính');
    if (!cand.date_of_birth?.trim()) missing.push('Ngày sinh');
    if (!cand.phone?.trim()) missing.push('Số điện thoại');
    if (!cand.address_vn?.trim()) missing.push('Địa chỉ VN');
    if (!cand.marital_status?.trim()) missing.push('Tình trạng hôn nhân');

    // CCCD
    const cccd = docs.find(d => d.document_type === 'CCCD');
    if (!cccd?.document_number?.trim()) missing.push('Số CCCD');

    // Passport  
    const psp = docs.find(d => d.document_type === 'Passport');
    if (!psp?.document_number?.trim()) missing.push('Số Passport');

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowMissingConfirm(true);
    } else {
      doSave();
    }
  };

  const TABS = [
    { id: 'personal', label: '👤 Cá Nhân' },
    { id: 'guardian', label: '🏠 Gia Đình' },
    { id: 'docs',     label: '🪪 Giấy Tờ' },
    { id: 'edu',      label: '🎓 Học Vấn' },
    { id: 'work',     label: '💼 Kinh Nghiệm' },
    { id: 'health',   label: '❤️ Sức Khoẻ' },
    { id: 'misc',     label: '✨ Khác' },
  ];

  // ── TranslateBtn atom (used inline) ─────────────────────────
  const TranslateBtn = ({
    fieldName,
    value,
    onResult,
    lang = 'ja',
    label
  }: {
    fieldName: string;
    value: string;
    onResult: (v: string) => void;
    lang?: 'ja' | 'en';
    label?: string;
  }) => {
    const isEn = lang === 'en';
    return (
      <button
        type="button"
        title={isEn ? "Dịch sang tiếng Anh" : "Dịch sang tiếng Nhật"}
        disabled={translating === fieldName}
        onClick={() => translateSingle(fieldName, value, onResult)}
        className={`flex-shrink-0 h-8 px-2 rounded-md border-2 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait ${
          isEn
            ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0284C7] hover:bg-[#0284C7] hover:text-white'
            : 'border-[#7C3AED] bg-[#FAF8FF] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white'
        }`}
      >
        {translating === fieldName ? (
          <span className={`animate-spin inline-block w-3 h-3 border-2 rounded-full ${isEn ? 'border-[#0284C7]/30 border-t-[#0284C7]' : 'border-[#7C3AED]/30 border-t-[#7C3AED]'}`} />
        ) : (
          <Zap size={11} />
        )}
        {translating === fieldName ? '' : (label || (isEn ? 'Dịch EN' : 'Dịch JP'))}
      </button>
    );
  };

  return (
    <div className="artistic-card flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>

      {/* Toast */}
      {toast && (
        <div className={`toast ${ toast.type === 'success' ? 'toast-success' : toast.type === 'error' ? 'toast-error' : 'toast-info' }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-3.5 border-b-2 border-[#1A1A1A] flex justify-between items-center bg-[#F8F7F2] rounded-t-[10px] flex-shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="h-9 px-3 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:bg-[#FFD700] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all flex items-center gap-1.5"
          >
            ← Quay Lại
          </button>
          
          <h2 className="text-base font-black uppercase tracking-tight text-[#1A1A1A]">
            {profile ? `Sửa: ${profile.candidate.full_name_vn}` : '✨ Thêm Hồ Sơ Mới'}
          </h2>

          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            cand.status === 'completed' 
              ? 'bg-[#E8F5E9] text-[#1B8A3F] border-[#A5D6A7]' 
              : cand.status === 'reviewing' 
                ? 'bg-[#FFF8E1] text-[#B8760A] border-[#FFE082]' 
                : 'bg-[#F5F5F5] text-[#555] border-[#DDD]'
          }`}>
            {cand.status === 'completed' ? '● Hoàn thành' : cand.status === 'reviewing' ? '◐ Xét duyệt' : '○ Nháp'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Dịch Toàn Bộ */}
          <button
            onClick={translateAll}
            disabled={translatingAll}
            className="h-9 px-3 text-xs font-black rounded-lg border-2 border-[#7C3AED] bg-[#FAF8FF] text-[#7C3AED] shadow-[2px_2px_0_0_#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-all flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-60 disabled:cursor-wait"
          >
            {translatingAll
              ? <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full" />
              : <Zap size={14} />}
            <span>{translatingAll ? 'Đang dịch...' : 'Dịch Toàn Bộ'}</span>
          </button>

          {cand.id > 0 && (
            <>
              <button 
                onClick={() => onDownloadRirekisho(cand.id)} 
                className="h-9 px-3 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:bg-[#E8F5E9] hover:border-[#00C853] hover:text-[#1B8A3F] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all"
              >
                📄 Rirekisho
              </button>

              <button 
                onClick={() => onDownloadTcmmxd(cand.id)} 
                className="h-9 px-3 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:bg-[#E3F2FD] hover:border-[#2196F3] hover:text-[#1976D2] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all"
              >
                📋 TC MMXD
              </button>

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(cand.id)}
                  className="h-9 px-3 text-xs font-black rounded-lg border-2 border-[#D32F2F] bg-[#FFF5F5] text-[#D32F2F] shadow-[2px_2px_0_0_#D32F2F] hover:bg-[#D32F2F] hover:text-white transition-all flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <Trash2 size={14} /> Xóa
                </button>
              )}
            </>
          )}

          <button 
            onClick={handleSave} 
            className="h-9 px-4 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-[#FF4D00] text-white shadow-[2px_2px_0_0_#1A1A1A] hover:bg-[#E64500] hover:shadow-[3px_3px_0_0_#1A1A1A] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all flex items-center gap-1.5"
          >
            💾 Lưu Hồ Sơ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-[#1A1A1A] bg-white px-1 flex-shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors whitespace-nowrap
              ${tab === t.id ? 'border-[#FF4D00] text-[#FF4D00]' : 'border-transparent text-[#555] hover:text-[#1A1A1A]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-[#FAFAF5]">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ════ CÁ NHÂN ════ */}
          {tab === 'personal' && (
            <>
              <Section title="Thông tin cơ bản" action={
                <Sel value={cand.status} onChange={v => setC('status', v as Candidate['status'])}
                  opts={[{ label: 'Nháp', value: 'draft' }, { label: 'Đang xử lý', value: 'reviewing' }, { label: 'Hoàn thành', value: 'completed' }]} />
              }>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Mã hồ sơ"><Inp value={cand.profile_code} onChange={v => setC('profile_code', v)} placeholder="VD: MRK001" /></Field>
                  <Field label="Giới tính"><Sel value={cand.gender} onChange={v => setC('gender', v)} opts={GENDERS} /></Field>
                  <Field label="Họ tên (Tiếng Việt)"><Inp value={cand.full_name_vn} onChange={v => setC('full_name_vn', v)} placeholder="NGUYỄN VĂN A" /></Field>
                  <Field label="Họ tên (Tiếng Anh)"><Inp value={cand.full_name_eng} onChange={v => setC('full_name_eng', v)} placeholder="NGUYEN VAN A" /></Field>
                  <Field label="Phiên âm Katakana" jp>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.full_name_katakana} onChange={v => setC('full_name_katakana', v)} placeholder="グエン バン エー" jp />
                      <TranslateBtn fieldName="ten_vnm" value={cand.full_name_vn} onResult={v => setC('full_name_katakana', v)} />
                    </div>
                  </Field>
                  <Field label="Số điện thoại TTS"><Inp value={cand.phone} onChange={v => setC('phone', v)} placeholder="0912 345 678" /></Field>
                  <Field label="Ngày sinh (VN)">
                    <Inp 
                      value={cand.date_of_birth} 
                      onChange={v => {
                        setC('date_of_birth', v);
                        const jp = toJapaneseDate(v);
                        if (jp) {
                          setC('date_of_birth_jp', jp);
                        }
                      }} 
                      type="date" 
                    />
                  </Field>
                  <Field label="Ngày sinh (JP)" jp>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.date_of_birth_jp} onChange={v => setC('date_of_birth_jp', v)} placeholder="2000年10月28日" jp />
                      <TranslateBtn fieldName="date_of_birth_jp" value={cand.date_of_birth} onResult={v => setC('date_of_birth_jp', toJapaneseDate(v) || v)} />
                    </div>
                  </Field>
                  <Field label="Quốc tịch"><Inp value={cand.nationality} onChange={v => setC('nationality', v)} /></Field>
                  <Field label="Dân tộc"><Inp value={cand.ethnicity} onChange={v => setC('ethnicity', v)} placeholder="Kinh" /></Field>
                  <Field label="Tiếng mẹ đẻ"><Inp value={cand.mother_tongue} onChange={v => setC('mother_tongue', v)} /></Field>
                  <Field label="Tình trạng hôn nhân"><Sel value={cand.marital_status} onChange={v => setC('marital_status', v)} opts={MARITAL} /></Field>
                  <Field label="Có con"><Sel value={cand.has_children ?? 'Không'} onChange={v => setC('has_children', v)} opts={YN} /></Field>
                  <Field label="Ngoại ngữ"><Inp value={cand.foreign_languages} onChange={v => setC('foreign_languages', v)} placeholder="Tiếng Nhật sơ cấp, Tiếng Anh cơ bản" /></Field>
                </div>
              </Section>

              <Section title="Địa chỉ & Nơi sinh">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Địa chỉ thường trú (VN)"><Inp value={cand.address_vn} onChange={v => setC('address_vn', v)} placeholder="123 Phố X, Quận Y, TP HCM" /></Field>
                  <Field label="Địa chỉ (JP)" jp>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.address_jp} onChange={v => setC('address_jp', v)} jp />
                      <TranslateBtn fieldName="dia_chi_vnm" value={cand.address_vn} onResult={v => setC('address_jp', v)} />
                    </div>
                  </Field>
                  <Field label="Nơi sinh (VN)"><Inp value={cand.birthplace_vn} onChange={v => setC('birthplace_vn', v)} placeholder="TP. Hồ Chí Minh" /></Field>
                  <Field label="Nơi sinh (JP)" jp>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.birthplace_jp} onChange={v => setC('birthplace_jp', v)} jp />
                      <TranslateBtn fieldName="noi_sinh_vnm" value={cand.birthplace_vn} onResult={v => setC('birthplace_jp', v)} />
                    </div>
                  </Field>
                </div>
              </Section>

              <Section title="Kinh nghiệm Nhật Bản">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <Field label="Đã từng đến Nhật">
                    <Sel value={String(cand.japan_experience_flag)} onChange={v => setC('japan_experience_flag', Number(v))}
                      opts={[{ label: 'Chưa', value: '0' }, { label: 'Đã từng', value: '1' }]} />
                  </Field>
                  <Field label="Từng là TTS tại Nhật">
                    <Sel value={String(cand.japan_intern_flag)} onChange={v => setC('japan_intern_flag', Number(v))}
                      opts={[{ label: 'Chưa', value: '0' }, { label: 'Đã từng', value: '1' }]} />
                  </Field>
                  <Field label="Từng bị từ chối COE">
                    <Sel value={String(cand.coe_refusal_flag)} onChange={v => setC('coe_refusal_flag', Number(v))}
                      opts={[{ label: 'Không', value: '0' }, { label: 'Có', value: '1' }]} />
                  </Field>
                  <Field label="Kinh nghiệm nước ngoài">
                    <Sel value={cand.overseas_experience_flag ?? 'Không'} onChange={v => setC('overseas_experience_flag', v)} opts={YN} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Chi tiết kinh nghiệm nước ngoài">
                      <Inp value={cand.overseas_experience_info} onChange={v => setC('overseas_experience_info', v)} placeholder="Nước nào, thời gian bao lâu..." />
                    </Field>
                  </div>
                </div>
              </Section>

              <Section title="Người thân tại Nhật Bản">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <Field label="Có người thân tại Nhật">
                    <Sel value={cand.japan_relative_flag ?? 'Không'} onChange={v => setC('japan_relative_flag', v)} opts={YN} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Thông tin người thân (tên, giới tính, tuổi, quan hệ, nơi ở, tư cách lưu trú)">
                      <Inp value={cand.japan_relative_info} onChange={v => setC('japan_relative_info', v)} rows={2} />
                    </Field>
                  </div>
                </div>
              </Section>

              {customFieldDefs.length > 0 && (
                <Section title="Thông tin Khác (Tùy Chỉnh)">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {customFieldDefs.map(f => (
                      <React.Fragment key={f.id}>
                        <Field label={f.label}>
                          <Inp 
                            type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                            value={cand.custom_fields?.[f.id] ?? ''} 
                            onChange={v => setC('custom_fields', { ...cand.custom_fields, [f.id]: v })} 
                          />
                        </Field>
                        {f.requireJp && (
                          <Field label={`${f.label} (JP)`} jp>
                            <div className="flex gap-2 items-end">
                              <Inp 
                                value={cand.custom_fields?.[`${f.id}_jp`] ?? ''} 
                                onChange={v => setC('custom_fields', { ...cand.custom_fields, [`${f.id}_jp`]: v })} 
                                jp 
                              />
                              <TranslateBtn 
                                fieldName={f.label} 
                                value={cand.custom_fields?.[f.id] ?? ''} 
                                onResult={v => setC('custom_fields', { ...cand.custom_fields, [`${f.id}_jp`]: v })} 
                              />
                            </div>
                          </Field>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {/* ════ GIA ĐÌNH ════ */}
          {tab === 'guardian' && (
            <>
              <Section title="Người giám hộ / Liên lạc khẩn cấp">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  <Field label="Tên người giám hộ (VN)">
                    <Inp value={cand.guardian_name_vn} onChange={v => setC('guardian_name_vn', v)} placeholder="Nguyễn Văn B (Cha)" />
                  </Field>
                  <Field label="Tên người giám hộ (Tiếng Anh)" en>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.guardian_name_en} onChange={v => setC('guardian_name_en', v)} placeholder="NGUYEN VAN B (FATHER)" en />
                      <TranslateBtn fieldName="guardian_name_en" value={cand.guardian_name_vn ?? ''} onResult={v => setC('guardian_name_en', v)} lang="en" />
                    </div>
                  </Field>
                  <Field label="Quan hệ với TTS">
                    <Sel value={cand.guardian_relationship} onChange={v => setC('guardian_relationship', v)} opts={RELATIONSHIPS} />
                  </Field>

                  <Field label="Nghề nghiệp người GH (VN)">
                    <Inp value={cand.guardian_job_vn} onChange={v => setC('guardian_job_vn', v)} placeholder="Làm nông, Nội trợ, Công nhân..." />
                  </Field>
                  <Field label="Nghề nghiệp người GH (Tiếng Anh)" en>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.guardian_job_en} onChange={v => setC('guardian_job_en', v)} placeholder="Farmer, Housewife..." en />
                      <TranslateBtn fieldName="guardian_job_en" value={cand.guardian_job_vn ?? ''} onResult={v => setC('guardian_job_en', v)} lang="en" />
                    </div>
                  </Field>
                  <Field label="Nghề nghiệp người GH (Tiếng Nhật)" jp>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.guardian_job_jp} onChange={v => setC('guardian_job_jp', v)} placeholder="農業, 主婦..." jp />
                      <TranslateBtn fieldName="guardian_job_jp" value={cand.guardian_job_vn ?? ''} onResult={v => setC('guardian_job_jp', v)} lang="ja" />
                    </div>
                  </Field>

                  <Field label="SĐT người giám hộ">
                    <Inp value={cand.guardian_phone} onChange={v => setC('guardian_phone', v)} placeholder="0912 345 678" />
                  </Field>
                  <Field label="Địa chỉ người giám hộ (VN)">
                    <Inp value={cand.guardian_address_vn} onChange={v => setC('guardian_address_vn', v)} />
                  </Field>
                  <Field label="Địa chỉ người giám hộ (JP)" jp>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.guardian_address_jp} onChange={v => setC('guardian_address_jp', v)} jp />
                      <TranslateBtn fieldName="dc_nguoi_gh_vnm" value={cand.guardian_address_vn ?? ''} onResult={v => setC('guardian_address_jp', v)} lang="ja" />
                    </div>
                  </Field>
                </div>
              </Section>

              <Section title="Thành viên gia đình">
                {family.map((fm, i) => (
                  <div key={i} className="p-4 border-2 border-[#1A1A1A]/15 rounded-lg bg-white mb-4 shadow-[1.5px_1.5px_0_0_#1A1A1A]/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase text-[#FF4D00]">Thành viên #{i + 1}</span>
                      {family.length > 1 && <RemBtn onClick={() => setFamily(family.filter((_, j) => j !== i))} />}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Field label="Quan hệ"><Sel value={fm.relationship} onChange={v => setFamily(family.map((f, j) => j === i ? { ...f, relationship: v } : f))} opts={RELATIONSHIPS} /></Field>
                      <Field label="Họ tên"><Inp value={fm.full_name} onChange={v => setFamily(family.map((f, j) => j === i ? { ...f, full_name: v } : f))} /></Field>
                      <Field label="Tuổi"><Inp value={fm.age} onChange={v => setFamily(family.map((f, j) => j === i ? { ...f, age: Number(v) } : f))} type="number" /></Field>
                      <Field label="Sống chung"><Sel value={fm.living_together} onChange={v => setFamily(family.map((f, j) => j === i ? { ...f, living_together: v } : f))} opts={YN} /></Field>
                      
                      <Field label="Nghề nghiệp (VN)">
                        <Inp value={fm.occupation} onChange={v => setFamily(family.map((f, j) => j === i ? { ...f, occupation: v } : f))} placeholder="Làm nông, Công nhân..." />
                      </Field>
                      <Field label="Nghề nghiệp (Tiếng Anh)" en>
                        <div className="flex gap-2 items-end">
                          <Inp value={fm.occupation_en} onChange={v => setFamily(family.map((f, j) => j === i ? { ...f, occupation_en: v } : f))} placeholder="Farmer, Worker..." en />
                          <TranslateBtn fieldName="job_en" value={fm.occupation ?? ''} onResult={v => setFamily(family.map((f, j) => j === i ? { ...f, occupation_en: v } : f))} lang="en" />
                        </div>
                      </Field>
                      <Field label="Nghề nghiệp (Tiếng Nhật)" jp>
                        <div className="flex gap-2 items-end">
                          <Inp value={fm.occupation_jp} onChange={v => setFamily(family.map((f, j) => j === i ? { ...f, occupation_jp: v } : f))} placeholder="農業, 会社員..." jp />
                          <TranslateBtn fieldName="job_jp" value={fm.occupation ?? ''} onResult={v => setFamily(family.map((f, j) => j === i ? { ...f, occupation_jp: v } : f))} lang="ja" />
                        </div>
                      </Field>
                      <Field label="Thu nhập hàng tháng">
                        <Inp value={fm.monthly_income} onChange={v => setFamily(family.map((f, j) => j === i ? { ...f, monthly_income: v } : f))} placeholder="10,000,000 VND" />
                      </Field>
                    </div>
                  </div>
                ))}
                <AddRowBtn label="Thêm thành viên" onClick={() => setFamily([...family, blankFamily()])} />
              </Section>
            </>
          )}

          {/* ════ GIẤY TỜ ════ */}
          {tab === 'docs' && (
            <>
              {docs.map((doc, i) => (
                <section key={i} className="p-4 border-2 border-[#1A1A1A]/15 rounded-lg bg-white mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-extrabold uppercase text-[#FF4D00]">
                      {doc.document_type === 'CCCD' ? '🪪 CCCD / CMND' : doc.document_type === 'Passport' ? '📕 Hộ Chiếu' : `Giấy tờ #${i + 1}`}
                    </h3>
                    {docs.length > 1 && i > 1 && <RemBtn onClick={() => setDocs(docs.filter((_, j) => j !== i))} />}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <Field label="Loại giấy tờ">
                      <Sel value={doc.document_type} onChange={v => setDocs(docs.map((d, j) => j === i ? { ...d, document_type: v } : d))}
                        opts={[{ label: 'CCCD / CMND', value: 'CCCD' }, { label: 'Hộ chiếu', value: 'Passport' }, { label: 'Khác', value: 'Other' }]} />
                    </Field>
                    <Field label="Số giấy tờ"><Inp value={doc.document_number} onChange={v => setDocs(docs.map((d, j) => j === i ? { ...d, document_number: v } : d))} /></Field>
                    <Field label="Ngày cấp (VN)">
                      <Inp 
                        value={doc.issue_date} 
                        onChange={v => {
                          const jp = toJapaneseDate(v);
                          setDocs(docs.map((d, j) => j === i ? { 
                            ...d, 
                            issue_date: v, 
                            issue_date_jp: jp || d.issue_date_jp 
                          } : d));
                        }} 
                        type="date" 
                      />
                    </Field>
                    <Field label="Ngày cấp (JP)" jp>
                      <div className="flex gap-2 items-end">
                        <Inp value={doc.issue_date_jp} onChange={v => setDocs(docs.map((d, j) => j === i ? { ...d, issue_date_jp: v } : d))} placeholder="2022年04月27日" jp />
                        <TranslateBtn
                          fieldName={`issue_date_${i}`}
                          value={doc.issue_date}
                          onResult={v => setDocs(docs.map((d, j) => j === i ? { ...d, issue_date_jp: toJapaneseDate(v) || v } : d))}
                        />
                      </div>
                    </Field>
                    <Field label="Nơi cấp (VN)"><Inp value={doc.issue_place_vn} onChange={v => setDocs(docs.map((d, j) => j === i ? { ...d, issue_place_vn: v } : d))} /></Field>
                    <Field label="Nơi cấp (JP)" jp>
                      <div className="flex gap-2 items-end">
                        <Inp value={doc.issue_place_jp} onChange={v => setDocs(docs.map((d, j) => j === i ? { ...d, issue_place_jp: v } : d))} jp />
                        <TranslateBtn
                          fieldName={`noi_cap_${doc.document_type === 'CCCD' ? 'cccd' : 'hc'}_vnm_${i}`}
                          value={doc.issue_place_vn}
                          onResult={v => setDocs(docs.map((d, j) => j === i ? { ...d, issue_place_jp: v } : d))}
                        />
                      </div>
                    </Field>
                  </div>
                </section>
              ))}
              <AddRowBtn label="Thêm giấy tờ" onClick={() => setDocs([...docs, blankDoc()])} />
            </>
          )}

          {/* ════ HỌC VẤN ════ */}
          {tab === 'edu' && (
            <>
              {edus.map((edu, i) => (
                <div key={i} className="p-4 border-2 border-[#1A1A1A]/15 rounded-lg bg-white mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold uppercase text-[#FF4D00]">Trường #{i + 1}</span>
                    {edus.length > 1 && <RemBtn onClick={() => setEdus(edus.filter((_, j) => j !== i))} />}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Tên trường (VN)"><Inp value={edu.school_name_vn} onChange={v => setEdus(edus.map((e, j) => j === i ? { ...e, school_name_vn: v } : e))} /></Field>
                    <Field label="Tên trường (JP)" jp>
                      <div className="flex gap-2 items-end">
                        <Inp value={edu.school_name_jp} onChange={v => setEdus(edus.map((e, j) => j === i ? { ...e, school_name_jp: v } : e))} jp />
                        <TranslateBtn
                          fieldName={`ten_truong_${i + 1}`}
                          value={edu.school_name_vn}
                          onResult={v => setEdus(edus.map((e, j) => j === i ? { ...e, school_name_jp: v } : e))}
                        />
                      </div>
                    </Field>
                    <Field label="Trình độ"><Sel value={edu.education_level} onChange={v => setEdus(edus.map((e, j) => j === i ? { ...e, education_level: v } : e))} opts={EDU_LEVELS} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Từ"><Inp value={edu.start_date} onChange={v => setEdus(edus.map((e, j) => j === i ? { ...e, start_date: v } : e))} type="date" /></Field>
                      <Field label="Đến"><Inp value={edu.end_date} onChange={v => setEdus(edus.map((e, j) => j === i ? { ...e, end_date: v } : e))} type="date" /></Field>
                    </div>
                  </div>
                </div>
              ))}
              <AddRowBtn label="Thêm trường học" onClick={() => setEdus([...edus, blankEdu()])} />
            </>
          )}

          {/* ════ KINH NGHIỆM LÀM VIỆC ════ */}
          {tab === 'work' && (
            <>
              <Section title="Ngành nghề thực tập">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Ngành nghề TTS (VN)"><Inp value={internshipFieldVn} onChange={setInternshipFieldVn} placeholder="Thi công máy móc xây dựng" /></Field>
                  <Field label="Ngành nghề TTS (JP)" jp>
                    <div className="flex gap-2 items-end">
                      <Inp value={internshipFieldJp} onChange={setInternshipFieldJp} placeholder="建設機械施工" jp />
                      <TranslateBtn fieldName="nganh_nghe_vnm" value={internshipFieldVn} onResult={setInternshipFieldJp} />
                    </div>
                  </Field>
                  <Field label="Tóm tắt kinh nghiệm (VN)"><Inp value={cand.skill_summary_vn} onChange={v => setC('skill_summary_vn', v)} placeholder="3 năm" /></Field>
                  <Field label="Tóm tắt kinh nghiệm (JP)" jp><Inp value={cand.skill_summary_jp} onChange={v => setC('skill_summary_jp', v)} placeholder="３年" jp /></Field>
                </div>
              </Section>

              <Section title="Quá trình làm việc">
                {works.map((w, i) => (
                  <div key={i} className="p-4 border-2 border-[#1A1A1A]/15 rounded-lg bg-white mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase text-[#FF4D00]">Nơi làm việc #{i + 1}</span>
                      {works.length > 1 && <RemBtn onClick={() => setWorks(works.filter((_, j) => j !== i))} />}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Tên công ty (VN)"><Inp value={w.company_name_vn} onChange={v => setWorks(works.map((x, j) => j === i ? { ...x, company_name_vn: v } : x))} /></Field>
                      <Field label="Tên công ty (JP)" jp>
                        <div className="flex gap-2 items-end">
                          <Inp value={w.company_name_jp} onChange={v => setWorks(works.map((x, j) => j === i ? { ...x, company_name_jp: v } : x))} jp />
                          <TranslateBtn fieldName={`ten_dn_${i + 1}`} value={w.company_name_vn} onResult={v => setWorks(works.map((x, j) => j === i ? { ...x, company_name_jp: v } : x))} />
                        </div>
                      </Field>
                      <Field label="Chức danh / Ngành nghề (VN)"><Inp value={w.job_title_vn} onChange={v => setWorks(works.map((x, j) => j === i ? { ...x, job_title_vn: v } : x))} /></Field>
                      <Field label="Chức danh (JP)" jp>
                        <div className="flex gap-2 items-end">
                          <Inp value={w.job_title_jp} onChange={v => setWorks(works.map((x, j) => j === i ? { ...x, job_title_jp: v } : x))} jp />
                          <TranslateBtn fieldName={`job_title_${i + 1}`} value={w.job_title_vn} onResult={v => setWorks(works.map((x, j) => j === i ? { ...x, job_title_jp: v } : x))} />
                        </div>
                      </Field>
                      <Field label="Từ"><Inp value={w.start_date} onChange={v => setWorks(works.map((x, j) => j === i ? { ...x, start_date: v } : x))} type="date" /></Field>
                      <Field label="Đến"><Inp value={w.end_date} onChange={v => setWorks(works.map((x, j) => j === i ? { ...x, end_date: v } : x))} type="date" /></Field>
                      <div className="col-span-2">
                        <Field label="Mô tả công việc"><Inp value={w.description} onChange={v => setWorks(works.map((x, j) => j === i ? { ...x, description: v } : x))} rows={2} /></Field>
                      </div>
                    </div>
                  </div>
                ))}
                <AddRowBtn label="Thêm nơi làm việc" onClick={() => setWorks([...works, blankWork()])} />
              </Section>

              <Section title="Kỹ năng chuyên môn">
                {skills.map((sk, i) => (
                  <div key={i} className="p-3 border-2 border-[#7C3AED]/20 rounded-lg bg-[#FAF8FF] mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-[#7C3AED] uppercase">Kỹ năng #{i + 1}</span>
                      {skills.length > 1 && <RemBtn onClick={() => setSkills(skills.filter((_, j) => j !== i))} />}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Kỹ năng (VN)"><Inp value={sk.skill_name_vn} onChange={v => setSkills(skills.map((s, j) => j === i ? { ...s, skill_name_vn: v } : s))} /></Field>
                      <Field label="Kỹ năng (JP)" jp><Inp value={sk.skill_name_jp} onChange={v => setSkills(skills.map((s, j) => j === i ? { ...s, skill_name_jp: v } : s))} jp /></Field>
                      <Field label="Số năm KN"><Inp value={sk.experience_years} onChange={v => setSkills(skills.map((s, j) => j === i ? { ...s, experience_years: Number(v) } : s))} type="number" /></Field>
                      <Field label="Số tháng KN"><Inp value={sk.experience_months} onChange={v => setSkills(skills.map((s, j) => j === i ? { ...s, experience_months: Number(v) } : s))} type="number" /></Field>
                      <Field label="Ngành mục tiêu tại Nhật">
                        <Sel value={String(sk.target_skill_flag)} onChange={v => setSkills(skills.map((s, j) => j === i ? { ...s, target_skill_flag: Number(v) } : s))}
                          opts={[{ label: 'Không', value: '0' }, { label: 'Có', value: '1' }]} />
                      </Field>
                    </div>
                  </div>
                ))}
                <AddRowBtn label="Thêm kỹ năng" onClick={() => setSkills([...skills, blankSkill()])} />
              </Section>
            </>
          )}

          {/* ════ SỨC KHOẺ ════ */}
          {tab === 'health' && (
            <>
              <Section title="Thể chất">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <Field label="Chiều cao (cm)"><Inp value={cand.height_cm} onChange={v => setC('height_cm', v ? Number(v) : undefined)} type="number" placeholder="170" /></Field>
                  <Field label="Cân nặng (kg)"><Inp value={cand.weight_kg} onChange={v => setC('weight_kg', v ? Number(v) : undefined)} type="number" placeholder="65" /></Field>
                  <Field label="Nhóm máu"><Sel value={cand.blood_type ?? ''} onChange={v => setC('blood_type', v)} opts={BLOOD} /></Field>
                  <Field label="Thị lực mắt trái"><Inp value={cand.vision_left} onChange={v => setC('vision_left', v)} placeholder="1.5" /></Field>
                  <Field label="Thị lực mắt phải"><Inp value={cand.vision_right} onChange={v => setC('vision_right', v)} placeholder="1.5" /></Field>
                  <Field label="Thuận tay"><Sel value={cand.preferred_hand ?? ''} onChange={v => setC('preferred_hand', v)} opts={HANDS} /></Field>
                </div>
              </Section>

              <Section title="Tình trạng sức khoẻ">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <Field label="Sức khoẻ tổng thể"><Sel value={cand.health_status ?? 'Tốt'} onChange={v => setC('health_status', v)} opts={HEALTH} /></Field>
                  <Field label="Thính lực"><Sel value={cand.hearing ?? 'Bình thường'} onChange={v => setC('hearing', v)} opts={HEARING} /></Field>
                  <Field label="Điều trị nha khoa"><Sel value={cand.dental_treatment ?? 'Không'} onChange={v => setC('dental_treatment', v)} opts={YN} /></Field>
                  <Field label="Bệnh mãn tính"><Sel value={cand.chronic_disease ?? 'Không'} onChange={v => setC('chronic_disease', v)} opts={YN} /></Field>
                  <div className="col-span-2">
                    <Field label="Tên bệnh mãn tính (nếu có)"><Inp value={cand.chronic_disease_name} onChange={v => setC('chronic_disease_name', v)} /></Field>
                  </div>
                </div>
              </Section>

              <Section title="Lối sống">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <Field label="Hình xăm"><Sel value={cand.tattoos ?? 'Không'} onChange={v => setC('tattoos', v)} opts={YN} /></Field>
                  <Field label="Hút thuốc"><Sel value={cand.smoking ?? 'Không'} onChange={v => setC('smoking', v)} opts={YN} /></Field>
                  <Field label="Uống rượu bia"><Sel value={cand.alcohol ?? 'Không'} onChange={v => setC('alcohol', v)} opts={ALCOHOL_OPTS} /></Field>
                </div>
              </Section>
            </>
          )}

          {/* ════ KHÁC ════ */}
          {tab === 'misc' && (
            <>
              <Section title="Mục đích & Kế hoạch">
                <div className="space-y-4">
                  <Field label="Lý do muốn đến Nhật Bản (VN)"><Inp value={cand.purpose_to_japan_vn} onChange={v => setC('purpose_to_japan_vn', v)} rows={3} placeholder="Lý do muốn sang Nhật làm việc..." /></Field>
                  <Field label="Lý do muốn đến Nhật Bản (JP)" jp>
                    <TranslateBtn fieldName="purpose_to_japan_vn" value={cand.purpose_to_japan_vn ?? ''} onResult={v => setC('purpose_to_japan_jp', v)} />
                    <Inp value={cand.purpose_to_japan_jp} onChange={v => setC('purpose_to_japan_jp', v)} rows={3} jp />
                  </Field>
                  <Field label="Kế hoạch sau khi về nước (VN)"><Inp value={cand.plan_after_return_vn} onChange={v => setC('plan_after_return_vn', v)} rows={2} placeholder="Dự định làm gì sau khi về nước..." /></Field>
                  <Field label="Kế hoạch sau khi về nước (JP)" jp>
                    <TranslateBtn fieldName="plan_after_return_vn" value={cand.plan_after_return_vn ?? ''} onResult={v => setC('plan_after_return_jp', v)} />
                    <Inp value={cand.plan_after_return_jp} onChange={v => setC('plan_after_return_jp', v)} rows={2} jp />
                  </Field>
                </div>
              </Section>

              <Section title="Tính cách & Sở thích">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Điểm mạnh (VN)"><Inp value={cand.strengths_vn} onChange={v => setC('strengths_vn', v)} placeholder="Cần cù, trung thực..." /></Field>
                  <Field label="Điểm mạnh (JP)" jp>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.strengths_jp} onChange={v => setC('strengths_jp', v)} jp />
                      <TranslateBtn fieldName="strengths_vn" value={cand.strengths_vn ?? ''} onResult={v => setC('strengths_jp', v)} />
                    </div>
                  </Field>
                  <Field label="Điểm yếu (VN)"><Inp value={cand.weaknesses_vn} onChange={v => setC('weaknesses_vn', v)} placeholder="Hơi cẩn thận quá mức..." /></Field>
                  <Field label="Điểm yếu (JP)" jp>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.weaknesses_jp} onChange={v => setC('weaknesses_jp', v)} jp />
                      <TranslateBtn fieldName="weaknesses_vn" value={cand.weaknesses_vn ?? ''} onResult={v => setC('weaknesses_jp', v)} />
                    </div>
                  </Field>
                  <Field label="Sở thích (VN)"><Inp value={cand.hobbies_vn} onChange={v => setC('hobbies_vn', v)} placeholder="Đá bóng, đọc sách..." /></Field>
                  <Field label="Sở thích (JP)" jp>
                    <div className="flex gap-2 items-end">
                      <Inp value={cand.hobbies_jp} onChange={v => setC('hobbies_jp', v)} placeholder="サッカー、読書" jp />
                      <TranslateBtn fieldName="hobbies_vn" value={cand.hobbies_vn ?? ''} onResult={v => setC('hobbies_jp', v)} />
                    </div>
                  </Field>
                </div>
              </Section>
            </>
          )}

        </div>
      </div>

      {/* ── Missing Fields Confirmation Modal ── */}
      {showMissingConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMissingConfirm(false)}
          />
          {/* Dialog */}
          <div
            className="relative bg-white border-3 border-[#1A1A1A] rounded-xl shadow-[6px_6px_0_#1A1A1A] max-w-md w-full animate-[popIn_0.25s_ease-out]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b-2 border-[#1A1A1A]/10 bg-[#FFF8E1] rounded-t-xl">
              <div className="w-10 h-10 rounded-lg bg-[#FFB300] border-2 border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] flex items-center justify-center text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="font-extrabold text-[#1A1A1A] text-base">Hồ sơ còn thiếu thông tin</h3>
                <p className="text-xs text-[#666] mt-0.5">Bạn có thể bổ sung sau hoặc lưu ngay</p>
              </div>
            </div>

            {/* Missing fields list */}
            <div className="px-6 py-4 max-h-60 overflow-y-auto">
              <p className="text-sm font-bold text-[#444] mb-3">
                Các trường còn trống ({missingFields.length}):
              </p>
              <ul className="space-y-1.5">
                {missingFields.map((field, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#555]">
                    <span className="w-5 h-5 rounded-full bg-[#FF4D00]/10 border border-[#FF4D00]/30 flex items-center justify-center text-[10px] font-bold text-[#FF4D00]">
                      {i + 1}
                    </span>
                    {field}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 px-6 py-4 border-t-2 border-[#1A1A1A]/10 bg-[#FAFAF7] rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowMissingConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-bold border-2 border-[#1A1A1A] rounded-lg bg-white hover:bg-[#F0F0F0] shadow-[2px_2px_0_#1A1A1A] hover:shadow-[1px_1px_0_#1A1A1A] active:shadow-none transition-all"
              >
                ← Quay lại bổ sung
              </button>
              <button
                type="button"
                onClick={doSave}
                className="flex-1 px-4 py-2.5 text-sm font-bold border-2 border-[#1A1A1A] rounded-lg bg-[#FF4D00] text-white hover:bg-[#E64500] shadow-[2px_2px_0_#1A1A1A] hover:shadow-[1px_1px_0_#1A1A1A] active:shadow-none transition-all"
              >
                Lưu ngay ✓
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
