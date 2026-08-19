export interface Candidate {
  id: number;
  profile_code: string;
  full_name_vn: string;
  full_name_eng: string;
  full_name_katakana: string;
  gender: string;
  date_of_birth: string;
  date_of_birth_jp?: string;        // 2000年10月28日
  nationality: string;
  ethnicity?: string;               // dân tộc
  mother_tongue: string;
  birthplace_vn: string;
  birthplace_jp: string;
  address_vn: string;
  address_jp: string;
  phone: string;
  marital_status: string;
  has_children?: string;            // Có / Không
  height_cm?: number;
  weight_kg?: number;
  blood_type?: string;
  vision_left?: string;
  vision_right?: string;
  preferred_hand?: string;
  tattoos?: string;
  smoking?: string;
  alcohol?: string;
  // Sức khoẻ
  health_status?: string;           // 良好 / 普通 / 不健康
  hearing?: string;                 // 正常 / 異常
  chronic_disease?: string;         // Có / Không
  chronic_disease_name?: string;
  dental_treatment?: string;        // Có / Không
  // Người giám hộ
  guardian_name_vn?: string;
  guardian_name_en?: string;
  guardian_name_jp?: string;
  guardian_relationship?: string;
  guardian_job_vn?: string;
  guardian_job_en?: string;
  guardian_job_jp?: string;
  guardian_address_vn?: string;
  guardian_address_jp?: string;
  guardian_phone?: string;
  // Ngoại ngữ & quan hệ Nhật
  foreign_languages?: string;
  japan_relative_flag?: string;     // Có / Không
  japan_relative_info?: string;
  // Kinh nghiệm
  japan_experience_flag: number;
  japan_intern_flag: number;
  coe_refusal_flag: number;
  overseas_experience_flag?: string;
  overseas_experience_info?: string;
  skill_summary_vn?: string;
  skill_summary_jp?: string;
  // Mục đích & tính cách
  purpose_to_japan_vn?: string;
  purpose_to_japan_jp?: string;
  plan_after_return_vn?: string;
  plan_after_return_jp?: string;
  strengths_vn?: string;
  strengths_jp?: string;
  weaknesses_vn?: string;
  weaknesses_jp?: string;
  hobbies_vn?: string;
  hobbies_jp?: string;
  status: 'draft' | 'reviewing' | 'completed';
  custom_fields?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface CustomFieldDef {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number';
  requireJp: boolean;
}

export interface IdentityDocument {
  id?: number;
  candidate_id: number;
  document_type: 'CCCD' | 'Passport' | string;
  document_number: string;
  issue_date: string;
  issue_date_jp?: string;
  issue_place_vn: string;
  issue_place_jp?: string;
}

export interface Education {
  id?: number;
  candidate_id: number;
  start_date: string;
  end_date: string;
  school_name_vn: string;
  school_name_jp: string;
  education_level: string;
}

export interface WorkExperience {
  id?: number;
  candidate_id: number;
  start_date: string;
  end_date: string;
  company_name_vn: string;
  company_name_jp: string;
  job_title_vn: string;
  job_title_jp: string;
  description?: string;
}

export interface SkillExperience {
  id?: number;
  candidate_id: number;
  skill_name_vn: string;
  skill_name_jp: string;
  experience_years: number;
  experience_months: number;
  target_skill_flag: number; // 1 if intended job in Japan
}

export interface JapanExperience {
  id?: number;
  candidate_id: number;
  has_japan_experience: number;
  start_date?: string;
  end_date?: string;
  residence_status?: string;
  purpose_or_type?: string;
}

export interface FamilyMember {
  id?: number;
  candidate_id: number;
  relationship: string;
  full_name: string;
  full_name_en?: string;
  age: number;
  living_together: string;
  occupation: string;
  occupation_en?: string;
  occupation_jp?: string;
  workplace: string;
  monthly_income: string;
}

export interface Organization {
  id: number;
  type: 'supervising' | 'accepting' | 'sending';
  name_vn: string;
  name_jp: string;
  representative_vn?: string;
  representative_jp?: string;
  address_vn: string;
  address_jp: string;
  phone: string;
}

export interface CandidateAssignment {
  id?: number;
  candidate_id: number;
  supervising_org_id?: number;
  accepting_org_id?: number;
  sending_org_id?: number;
  internship_field_vn?: string;
  internship_field_jp?: string;
  interview_date?: string;
  pass_date?: string;
  expected_entry_date?: string;
}

export interface FullCandidateProfile {
  candidate: Candidate;
  identityDocuments: IdentityDocument[];
  educations: Education[];
  workExperiences: WorkExperience[];
  skillExperiences: SkillExperience[];
  japanExperiences: JapanExperience[];
  familyMembers: FamilyMember[];
  assignment?: CandidateAssignment;
  supervisingOrg?: Organization;
  acceptingOrg?: Organization;
  sendingOrg?: Organization;
}

export interface TranslationLog {
  id: number;
  candidate_id: number;
  field_name: string;
  source_text: string;
  target_text: string;
  language: string;
  ai_model: string;
  confidence: number;
  status: 'suggested' | 'approved' | 'edited' | 'rejected';
  edited_by_user: number;
  created_at: string;
}

export interface DocumentTemplate {
  id: number;
  code: string;
  name: string;
  type: 'docx' | 'xlsx';
  version: string;
  description: string;
  is_active: number;
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
  templateCode?: string;
}

export interface CompletenessReport {
  overallScore: number; // 0-100%
  status: 'ready' | 'incomplete' | 'has_warnings';
  issues: ValidationIssue[];
  missingFieldsByTemplate: Record<string, string[]>;
}

export interface ImportJob {
  id: number;
  source_type: 'google_sheet' | 'excel' | 'csv';
  source_name: string;
  sheet_name?: string;
  status: 'pending' | 'staged' | 'completed' | 'failed';
  total_rows: number;
  success_rows: number;
  warning_rows: number;
  error_rows: number;
  mapping_config?: string;
  created_at?: string;
}

export interface ImportRow {
  id: number;
  import_job_id: number;
  row_number: number;
  raw_data: Record<string, any>;
  normalized_data: Partial<{
    full_name_vn: string;
    date_of_birth: string;
    gender: string;
    birthplace_vn: string;
    address_vn: string;
    identity_number: string;
    phone: string;
    occupation_vn: string;
    height_cm: number;
    weight_kg: number;
    education_level: string;
    marital_status: string;
    notes: string;
  }>;
  status: 'valid' | 'warning' | 'error' | 'duplicate';
  duplicate_action?: 'skip' | 'update' | 'create_new';
  existing_candidate_id?: number;
  existing_candidate_name?: string;
  error_message?: string;
}

export interface ImportMappingPreset {
  id: number;
  name: string;
  source_type: string;
  mapping_config: Record<string, string>; // Header -> Target System Field
  created_at?: string;
}

export interface GoogleSheetFetchResult {
  spreadsheetTitle: string;
  spreadsheetId: string;
  availableSheets: string[];
  selectedSheet: string;
  headers: string[];
  rows: Record<string, string>[];
}
