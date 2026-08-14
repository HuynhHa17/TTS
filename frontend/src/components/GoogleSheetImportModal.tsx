import { useState } from 'react';
import { Upload, RefreshCw, Table, Download } from 'lucide-react';

interface GoogleSheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type Step = 'input' | 'preview' | 'done';

export function GoogleSheetImportModal({ isOpen, onClose, onImportComplete }: GoogleSheetImportModalProps) {
  const [url, setUrl] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Placeholder — hook into /api/import_gsheet when ready
      await new Promise(r => setTimeout(r, 1200));
      setStep('preview');
    } catch {
      setError('Không thể kết nối tới Google Sheets. Kiểm tra link và quyền chia sẻ.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setStep('input'); setUrl(''); setError(''); };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-2xl">
        <div className="artistic-card overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 border-b-2 border-[#1A1A1A] bg-[#1A1A1A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📥</span>
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-white">Import Google Sheets</h2>
                <p className="text-xs text-white/60 font-medium">Dán link Sheet công khai để lấy danh sách ứng viên</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div className="p-6 bg-[#F8F7F2] space-y-5">

            {step === 'input' && (
              <>
                {/* URL input */}
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#444] block mb-2">
                    Link Google Spreadsheet
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Table size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
                      <input
                        type="text"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleFetch()}
                        className="artistic-input w-full py-2.5 pl-9 pr-4 text-sm font-medium"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                      />
                    </div>
                    <button
                      onClick={handleFetch}
                      disabled={loading || !url.trim()}
                      className="artistic-btn-primary px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap">
                      {loading
                        ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                        : <Upload size={15} />}
                      {loading ? 'Đang tải...' : 'Tải dữ liệu'}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-xs font-bold text-[#FF4D00] flex items-center gap-1.5">
                      <span>⚠️</span> {error}
                    </p>
                  )}
                </div>

                {/* Empty state */}
                <div className="border-2 border-dashed border-[#1A1A1A]/25 rounded-xl p-12 text-center bg-white">
                  <div className="text-4xl mb-3">🔗</div>
                  <p className="font-bold text-[#555] text-sm">Dán link Sheet để xem danh sách dữ liệu</p>
                  <p className="text-xs text-[#888] mt-1">File phải được chia sẻ công khai hoặc cho phép đọc</p>
                </div>

                {/* Tips */}
                <div className="bg-[#FFF9F0] border-2 border-[#FFD700] rounded-lg p-4 text-xs text-[#555] space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-extrabold text-[#1A1A1A] text-sm">💡 Hướng dẫn</p>
                    <a 
                      href="/api/export/template" 
                      target="_blank" 
                      rel="noreferrer"
                      className="artistic-btn-accent px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded-md"
                    >
                      <Download size={14} /> Tải Form Mẫu Excel
                    </a>
                  </div>
                  <p>1. Tải <strong>Form Mẫu Excel</strong> có sẵn đầy đủ các cột (bao gồm cả trường tùy chỉnh).</p>
                  <p>2. Upload file đó lên Google Drive và mở bằng Google Sheets, điền dữ liệu.</p>
                  <p>3. Chọn Chia sẻ → Mọi người có link có thể xem.</p>
                  <p>4. Dán link vào ô bên trên và nhấn <strong>Tải dữ liệu</strong>.</p>
                </div>
              </>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#F0FFF5] border-2 border-[#00C853] rounded-lg">
                  <p className="font-extrabold text-[#00C853] text-sm flex items-center gap-2">
                    <span>✅</span> Đã lấy dữ liệu thành công!
                  </p>
                  <p className="text-xs text-[#555] mt-1">Xem trước dữ liệu, sau đó xác nhận để import.</p>
                </div>
                <div className="border-2 border-dashed border-[#1A1A1A]/20 rounded-xl p-8 text-center bg-white">
                  <p className="text-[#555] font-medium text-sm">Tính năng preview đang phát triển...</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleReset} className="artistic-card-sm px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-[#F0F0F0]">
                    <RefreshCw size={14} /> Nhập link mới
                  </button>
                  <button onClick={() => { onImportComplete(); onClose(); }}
                    className="artistic-btn-primary flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                    <Upload size={14} /> Xác nhận Import
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
