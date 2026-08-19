/**
 * Utility functions for Date formatting:
 * - VN format: DD/MM/YYYY
 * - ISO format: YYYY-MM-DD (for HTML input type="date")
 * - JP format: YYYY年MM月DD日
 * - Month/Year: MM/YYYY & YYYY年MM月
 */

export function toISODate(v: string | number | undefined | null): string {
  if (!v) return '';
  const s = String(v).trim();
  if (!s) return '';
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const m1 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m1) {
    const day = m1[1].padStart(2, '0');
    const month = m1[2].padStart(2, '0');
    const year = m1[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY/MM/DD or YYYY.MM.DD
  const m2 = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (m2) {
    const year = m2[1];
    const month = m2[2].padStart(2, '0');
    const day = m2[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // YYYY年MM月DD日
  const m3 = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (m3) {
    const year = m3[1];
    const month = m3[2].padStart(2, '0');
    const day = m3[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return s;
}

export function formatDateVN(v: string | number | undefined | null): string {
  if (!v) return '';
  const s = String(v).trim();
  if (!s) return '';
  // Already DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  const iso = toISODate(s);
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  return s;
}

export function toJapaneseDate(v: string | number | undefined | null): string {
  if (!v) return '';
  const s = String(v).trim();
  if (!s) return '';
  // Already YYYY年MM月DD日 or YYYY年MM月 or YYYY年
  if (/^\d{4}年(\d{1,2}月)?(\d{1,2}日)?$/.test(s)) return s;

  // Full date: DD/MM/YYYY or YYYY-MM-DD
  const iso = toISODate(s);
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return `${m[1]}年${m[2]}月${m[3]}日`;
  }

  // MM/YYYY or YYYY-MM
  const mMonth = s.match(/^(\d{1,2})[\/\-\.](\d{4})$/);
  if (mMonth) {
    return `${mMonth[2]}年${mMonth[1].padStart(2, '0')}月`;
  }
  const mYearMonth = s.match(/^(\d{4})[\/\-\.](\d{1,2})$/);
  if (mYearMonth) {
    return `${mYearMonth[1]}年${mYearMonth[2].padStart(2, '0')}月`;
  }

  // Year only YYYY
  if (/^\d{4}$/.test(s)) {
    return `${s}年`;
  }

  return s;
}

export function formatPeriodDateVN(v: string | number | undefined | null): string {
  if (!v) return '';
  const s = String(v).trim();
  if (!s) return '';
  // MM/YYYY
  if (/^\d{1,2}\/\d{4}$/.test(s)) return s;
  // YYYY-MM
  const m1 = s.match(/^(\d{4})[\/\-\.](\d{1,2})$/);
  if (m1) return `${m1[2].padStart(2, '0')}/${m1[1]}`;
  // YYYY-MM-DD or DD/MM/YYYY
  const iso = toISODate(s);
  const m2 = iso.match(/^(\d{4})-(\d{2})/);
  if (m2) return `${m2[2]}/${m2[1]}`;
  return s;
}

export function removeVietnameseAccents(text: string | null | undefined): string {
  if (!text) return '';
  const s = String(text).replace(/Đ/g, 'D').replace(/đ/g, 'd');
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export const OFFLINE_REL_MAP: Record<string, string> = {
  'bố': 'FATHER', 'cha': 'FATHER', 'ba': 'FATHER', 'bố đẻ': 'FATHER',
  'mẹ': 'MOTHER', 'má': 'MOTHER', 'mẹ đẻ': 'MOTHER',
  'anh': 'BROTHER', 'anh trai': 'ELDER BROTHER', 'em trai': 'YOUNGER BROTHER',
  'chị': 'SISTER', 'chị gái': 'ELDER SISTER', 'em gái': 'YOUNGER SISTER',
  'vợ': 'WIFE', 'chồng': 'HUSBAND', 'con': 'CHILD', 'con trai': 'SON', 'con gái': 'DAUGHTER',
  'ông': 'GRANDFATHER', 'bà': 'GRANDMOTHER', 'chú': 'UNCLE', 'bác': 'UNCLE', 'cô': 'AUNT', 'dì': 'AUNT',
};

export const OFFLINE_JOBS_EN: Record<string, string> = {
  'làm nông': 'Farmer', 'nông nghiệp': 'Farmer', 'nông dân': 'Farmer', 'trồng trọt': 'Farmer',
  'nội trợ': 'Housewife',
  'công nhân': 'Worker', 'lao động tự do': 'Freelance worker', 'công nhân may': 'Garment worker',
  'kinh doanh tự do': 'Self-employed', 'buôn bán': 'Merchant', 'kinh doanh': 'Business',
  'thợ may': 'Tailor', 'may mặc': 'Garment worker',
  'thợ xây': 'Construction worker', 'xây dựng': 'Construction worker',
  'thợ hàn': 'Welder', 'thợ tiện': 'Lathe operator', 'thợ cơ khí': 'Mechanic', 'cơ khí': 'Mechanic',
  'thợ điện': 'Electrician',
  'lái xe': 'Driver', 'tài xế': 'Driver',
  'học sinh': 'Student', 'sinh viên': 'Student',
  'nhân viên văn phòng': 'Office worker', 'kế toán': 'Accountant', 'kỹ sư': 'Engineer',
  'giáo viên': 'Teacher', 'bác sĩ': 'Doctor', 'y tá': 'Nurse',
  'bán hàng': 'Salesperson', 'nhân viên bán hàng': 'Salesperson',
  'đầu bếp': 'Chef', 'bảo vệ': 'Security guard',
};

export const OFFLINE_JOBS_JP: Record<string, string> = {
  'làm nông': '農業', 'nông nghiệp': '農業', 'nông dân': '農業', 'trồng trọt': '農業',
  'nội trợ': '主婦',
  'công nhân': '会社員', 'lao động tự do': '自由業', 'công nhân may': '縫製工',
  'kinh doanh tự do': '自営業', 'buôn bán': '商業', 'kinh doanh': '会社員',
  'thợ may': '縫製工', 'may mặc': '縫製業',
  'thợ xây': '建設作業員', 'xây dựng': '建設業',
  'thợ hàn': '溶接工', 'thợ tiện': '旋盤工', 'thợ cơ khí': '機械工', 'cơ khí': '機械工',
  'thợ điện': '電気技師',
  'lái xe': '運転手', 'tài xế': '運転手',
  'học sinh': '学生', 'sinh viên': '大学生',
  'nhân viên văn phòng': '会社員', 'kế toán': '会計士', 'kỹ sư': 'エンジニア',
  'giáo viên': '教師', 'bác sĩ': '医師', 'y tá': '看護師',
  'bán hàng': '販売員', 'nhân viên bán hàng': '販売員',
  'đầu bếp': '調理師', 'bảo vệ': '警備員',
};

export function translateGuardianNameOffline(val: string | null | undefined): string {
  if (!val) return '';
  const s = String(val).trim();
  const m = s.match(/^(.*?)\s*[\(\[\{](.+?)[\)\]\}]\s*$/);
  if (m) {
    const namePart = m[1].trim();
    const relPart = m[2].trim().toLowerCase();
    const noAccentName = removeVietnameseAccents(namePart).toUpperCase();
    const relEn = OFFLINE_REL_MAP[relPart] || removeVietnameseAccents(relPart).toUpperCase();
    return `${noAccentName} (${relEn})`;
  }
  return removeVietnameseAccents(s).toUpperCase();
}
