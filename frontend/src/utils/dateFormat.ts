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
