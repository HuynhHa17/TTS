import { useState } from 'react';
import { Upload, Download, RefreshCw, CheckCircle } from 'lucide-react';

interface Template {
  id: number;
  code: string;
  name: string;
  type: 'docx' | 'xlsx';
  version: string;
  description: string;
  is_active: number;
}

const MOCK_TEMPLATES: Template[] = [
  { id: 1, code: 'RIREKISHO_V1', name: 'Sơ yếu lý lịch (履歴書)', type: 'docx', version: 'v1.3', description: 'Mẫu CV chuẩn Nhật, điền đầy đủ thông tin cá nhân và kinh nghiệm.', is_active: 1 },
  { id: 2, code: 'KHAI_FORM_V1', name: 'Khai Form Master (TCMMXD)', type: 'xlsx', description: 'Bảng khai thông tin đầy đủ theo mẫu chuẩn TCMMXD.', version: 'v2.0', is_active: 1 },
  { id: 3, code: 'KHAI_TT_V1', name: 'Bảng Khai Thông Tin', type: 'xlsx', description: 'Bảng khai thông tin tổng hợp dùng cho phái cử.', version: 'v1.0', is_active: 1 },
];

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  docx: { bg: '#EDE9FE', text: '#7C3AED', label: 'DOCX' },
  xlsx: { bg: '#D1FAE5', text: '#059669', label: 'XLSX' },
};

export function TemplateManagerModal() {
  const [templates] = useState<Template[]>(MOCK_TEMPLATES);
  const [uploading, setUploading] = useState<number | null>(null);

  const handleReplace = async (id: number) => {
    setUploading(id);
    await new Promise(r => setTimeout(r, 1000));
    setUploading(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Page header */}
      <div className="artistic-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold uppercase tracking-tight">🗂️ Quản Lý Template</h2>
            <p className="text-[#555] font-medium mt-1 text-sm">
              Cấu hình mẫu file Excel và Word để xuất dữ liệu hồ sơ ứng viên.
            </p>
          </div>
          <button className="artistic-btn-primary px-4 py-2 text-sm rounded-lg flex items-center gap-2">
            <Upload size={15} /> Upload Template Mới
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mt-5">
          {[
            { label: 'Tổng template', value: templates.length, color: '#FF4D00' },
            { label: 'Đang hoạt động', value: templates.filter(t => t.is_active).length, color: '#00C853' },
            { label: 'Loại DOCX', value: templates.filter(t => t.type === 'docx').length, color: '#7C3AED' },
            { label: 'Loại XLSX', value: templates.filter(t => t.type === 'xlsx').length, color: '#059669' },
          ].map((s, i) => (
            <div key={i} className="flex-1 bg-[#F8F7F2] border-2 border-[#1A1A1A]/15 rounded-lg p-3 text-center">
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-bold text-[#555] uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Template list */}
      <div className="space-y-3">
        {templates.map(tmpl => {
          const tc = TYPE_COLORS[tmpl.type] || TYPE_COLORS.docx;
          const isUploading = uploading === tmpl.id;
          return (
            <div key={tmpl.id}
              className="artistic-card p-5 flex items-center gap-5 hover:shadow-[6px_6px_0_0_#1A1A1A] transition-all duration-150">

              {/* Type badge */}
              <div className="w-14 h-14 rounded-xl border-2 border-[#1A1A1A] flex items-center justify-center font-extrabold text-xs flex-shrink-0"
                style={{ background: tc.bg, color: tc.text, boxShadow: '3px 3px 0 0 #1A1A1A' }}>
                {tc.label}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base">{tmpl.name}</h3>
                  <span className="modal-section-tag">{tmpl.code}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 bg-[#F0F0F0] border border-[#DDD] rounded text-[#555]">
                    {tmpl.version}
                  </span>
                  {tmpl.is_active === 1 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-[#00C853]">
                      <CheckCircle size={12} /> Đang dùng
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#666] font-medium mt-1 truncate">{tmpl.description}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button className="artistic-btn-secondary px-3 py-2 text-xs rounded-lg flex items-center gap-1.5">
                  <Download size={13} /> Tải xuống
                </button>
                <button
                  onClick={() => handleReplace(tmpl.id)}
                  disabled={isUploading}
                  className="artistic-btn-accent px-3 py-2 text-xs rounded-lg flex items-center gap-1.5 disabled:opacity-60">
                  {isUploading
                    ? <span className="animate-spin inline-block w-3 h-3 border-2 border-[#1A1A1A]/30 border-t-[#1A1A1A] rounded-full" />
                    : <RefreshCw size={13} />}
                  {isUploading ? 'Đang upload...' : 'Thay thế'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="bg-[#FFF9F0] border-2 border-[#FFD700] rounded-xl p-4 text-sm text-[#555] space-y-1">
        <p className="font-extrabold text-[#1A1A1A] mb-2">📌 Lưu ý khi upload template</p>
        <p>• Template DOCX sử dụng placeholder dạng <code className="bg-white px-1 rounded border text-xs">{'{{full_name_vn}}'}</code> để điền dữ liệu tự động</p>
        <p>• Template XLSX sử dụng named cell hoặc header mapping để ghi dữ liệu</p>
        <p>• Upload template mới sẽ thay thế phiên bản cũ, không thể hoàn tác</p>
      </div>
    </div>
  );
}
