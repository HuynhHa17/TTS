import { useState } from 'react';
import type { Candidate } from '../types';
import { Download, FileText, Table } from 'lucide-react';

interface BatchExportModalProps {
  candidates: Candidate[];
  selectedIds: number[];
  isOpen: boolean;
  onClose: () => void;
  onTriggerBatchExport: (ids: number[], templates: string[]) => void;
}

export function BatchExportModal({ candidates, selectedIds, isOpen, onClose, onTriggerBatchExport }: BatchExportModalProps) {
  const [templates, setTemplates] = useState<string[]>(['rirekisho']);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const exportIds = selectedIds.length > 0 ? selectedIds : candidates.map(c => c.id);

  const toggleTemplate = (t: string) =>
    setTemplates(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleExport = async () => {
    if (!templates.length) return;
    setLoading(true);
    try {
      await onTriggerBatchExport(exportIds, templates);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-lg">
        <div className="artistic-card overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 border-b-2 border-[#1A1A1A] bg-[#1A1A1A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-white">Xuất File Hàng Loạt</h2>
                <p className="text-xs text-white/60 font-medium">Chọn template và tải về dạng ZIP</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div className="p-6 bg-[#F8F7F2] space-y-5">

            {/* Scope indicator */}
            <div className="flex items-center gap-3 p-3 bg-white border-2 border-[#1A1A1A] rounded-lg shadow-[2px_2px_0_0_#1A1A1A]">
              <div className="w-10 h-10 bg-[#FF4D00] border-2 border-[#1A1A1A] rounded-lg flex items-center justify-center font-extrabold text-white text-lg">
                {exportIds.length}
              </div>
              <div>
                <p className="font-extrabold text-sm">Ứng viên được chọn</p>
                <p className="text-xs text-[#555]">
                  {selectedIds.length > 0
                    ? `${selectedIds.length} ứng viên đã chọn thủ công`
                    : 'Toàn bộ ứng viên trong DB'}
                </p>
              </div>
            </div>

            {/* Template selector */}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#444] mb-3">Chọn loại file xuất</p>
              <div className="space-y-2">
                {[
                  { id: 'rirekisho', icon: <FileText size={18} />, label: 'Sơ yếu lý lịch (履歴書)', sub: 'XLSX — Tiếng Nhật' },
                  { id: 'tcmmxd_pdf', icon: <FileText size={18} />, label: 'Hồ sơ TCMMXD PDF', sub: 'PDF — 履歴書 Form' },
                  { id: 'khai_form', icon: <Table size={18} />, label: 'File Master Excel', sub: 'XLSX — Toàn bộ cơ sở dữ liệu' },
                  { id: 'candidate_form', icon: <Table size={18} />, label: 'Mẫu Tờ Đơn Điền Thông Tin', sub: 'XLSX — Mẫu tờ khai ứng viên' },
                ].map(t => {
                  const checked = templates.includes(t.id);
                  return (
                    <label key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${checked ? 'border-[#FF4D00] bg-[#FFF5F0] shadow-[2px_2px_0_0_#FF4D00]' : 'border-[#1A1A1A] bg-white hover:bg-[#F8F7F2]'}`}>
                      <input type="checkbox" className="w-4 h-4 accent-[#FF4D00]"
                        checked={checked} onChange={() => toggleTemplate(t.id)} />
                      <span className={checked ? 'text-[#FF4D00]' : 'text-[#555]'}>{t.icon}</span>
                      <div>
                        <p className="font-bold text-sm">{t.label}</p>
                        <p className="text-xs text-[#777]">{t.sub}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleExport}
              disabled={loading || templates.length === 0}
              className="artistic-btn-primary w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm tracking-wider uppercase">
              {loading
                ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />Đang xuất...</>
                : <><Download size={16} /> Tải File ZIP ({exportIds.length} hồ sơ)</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
