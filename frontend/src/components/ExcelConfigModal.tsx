import { useState, useEffect } from 'react';
import { FolderOpen, Eye, Download, Upload, RefreshCw } from 'lucide-react';

interface ExcelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type StatusType = 'idle' | 'loading' | 'success' | 'error';

export function ExcelConfigModal({ isOpen, onClose, onImportComplete }: ExcelConfigModalProps) {
  const [config, setConfig] = useState<{ path: string; exists: boolean } | null>(null);
  const [newPath, setNewPath] = useState('');
  const [status, setStatus] = useState<{ type: StatusType; msg: string }>({ type: 'idle', msg: '' });
  const [activeAction, setActiveAction] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { fetchConfig(); setStatus({ type: 'idle', msg: '' }); }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/excel/config');
      if (res.ok) { const d = await res.json(); setConfig(d); setNewPath(d.path); }
    } catch { setConfig(null); }
  };

  const setMsg = (type: StatusType, msg: string) => setStatus({ type, msg });

  const handleSetPath = async () => {
    setActiveAction('path');
    setMsg('loading', 'Đang lưu...');
    try {
      const res = await fetch('/api/excel/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath }),
      });
      if (res.ok) { setMsg('success', '✅ Đã lưu đường dẫn mới!'); fetchConfig(); }
      else { const d = await res.json(); setMsg('error', `❌ ${d.error}`); }
    } catch { setMsg('error', '❌ Không kết nối được backend.'); }
    finally { setActiveAction(null); }
  };

  const handlePreview = async () => {
    setActiveAction('preview');
    setMsg('loading', 'Đang đọc file...');
    try {
      const res = await fetch('/api/excel/preview');
      const d = await res.json();
      if (res.ok) setMsg('success', `✅ File hợp lệ — ${d.rows.length} dòng dữ liệu (hiển thị tối đa 50)`);
      else setMsg('error', `❌ ${d.error}`);
    } catch { setMsg('error', '❌ Không kết nối được backend.'); }
    finally { setActiveAction(null); }
  };

  const handleImport = async () => {
    if (!confirm('Import sẽ thêm dữ liệu mới từ Excel vào SQLite (bỏ qua dữ liệu trùng). Tiếp tục?')) return;
    setActiveAction('import');
    setMsg('loading', 'Đang import...');
    try {
      const res = await fetch('/api/excel/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await res.json();
      if (res.ok) {
        setMsg('success', `✅ Xong! Thêm mới: ${d.created} | Bỏ qua (trùng): ${d.skipped}${d.errors?.length ? ` | Lỗi: ${d.errors.length}` : ''}`);
        onImportComplete();
      } else setMsg('error', `❌ ${d.error}`);
    } catch { setMsg('error', '❌ Không kết nối được backend.'); }
    finally { setActiveAction(null); }
  };

  const handleExport = async () => {
    setActiveAction('export');
    setMsg('loading', 'Đang xuất ra Excel...');
    try {
      const res = await fetch('/api/excel/export');
      const d = await res.json();
      if (res.ok) setMsg('success', `✅ Đã xuất ${d.exported} hồ sơ → ${d.path}`);
      else setMsg('error', `❌ ${d.error}`);
    } catch { setMsg('error', '❌ Không kết nối được backend.'); }
    finally { setActiveAction(null); }
  };

  if (!isOpen) return null;

  const statusBg = { success: '#F0FFF5', error: '#FFF5F0', idle: '#F8F7F2', loading: '#FFF9F0' }[status.type];
  const statusBorder = { success: '#00C853', error: '#FF4D00', idle: '#DDD', loading: '#FFD700' }[status.type];

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-xl">
        <div className="artistic-card overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 border-b-2 border-[#1A1A1A] bg-[#1A1A1A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-white">Cấu Hình Excel</h2>
                <p className="text-xs text-white/60 font-medium">Import / Export dữ liệu ứng viên</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="p-6 bg-[#F8F7F2] space-y-5">

            {/* File status */}
            {config && (
              <div className={`p-3 rounded-lg border-2 flex items-start gap-3 ${config.exists ? 'border-[#00C853] bg-[#F0FFF5]' : 'border-[#FF4D00] bg-[#FFF5F0]'}`}>
                <span className="text-xl mt-0.5">{config.exists ? '✅' : '❌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold uppercase mb-0.5" style={{ color: config.exists ? '#00C853' : '#FF4D00' }}>
                    {config.exists ? 'File tồn tại' : 'File không tồn tại'}
                  </p>
                  <p className="text-xs font-mono text-[#333] break-all">{config.path}</p>
                </div>
              </div>
            )}

            {/* Path input */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#444] block mb-2">
                Đường dẫn file Excel
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FolderOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
                  <input type="text" value={newPath} onChange={e => setNewPath(e.target.value)}
                    className="artistic-input py-2.5 pl-9 pr-3 text-sm font-mono w-full"
                    placeholder="D:\TTS\File_lưu.xlsx" />
                </div>
                <button onClick={handleSetPath} disabled={activeAction === 'path'}
                  className="artistic-btn-secondary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 whitespace-nowrap">
                  {activeAction === 'path'
                    ? <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-[#1A1A1A]/30 border-t-[#1A1A1A] rounded-full" />
                    : <RefreshCw size={13} />}
                  Lưu
                </button>
              </div>
            </div>

            {/* Status message */}
            {status.msg && (
              <div className="px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all"
                style={{ background: statusBg, borderColor: statusBorder }}>
                {status.type === 'loading' && (
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full mr-2" />
                )}
                {status.msg}
              </div>
            )}

            {/* Action grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'preview', icon: <Eye size={20} />, label: 'Preview', sub: 'Xem trước không import',
                  bg: '#F8F7F2', border: '#1A1A1A', shadow: '#1A1A1A', textColor: '#1A1A1A',
                  onClick: handlePreview,
                },
                {
                  id: 'import', icon: <Upload size={20} />, label: 'Import', sub: 'Excel → SQLite',
                  bg: '#FFD700', border: '#1A1A1A', shadow: '#1A1A1A', textColor: '#1A1A1A',
                  onClick: handleImport,
                },
                {
                  id: 'export', icon: <Download size={20} />, label: 'Export', sub: 'SQLite → Excel',
                  bg: '#00C853', border: '#1A1A1A', shadow: '#1A1A1A', textColor: '#FFFFFF',
                  onClick: handleExport,
                },
              ].map(action => (
                <button key={action.id} onClick={action.onClick} disabled={activeAction !== null}
                  className="p-4 rounded-xl border-2 text-center transition-all disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0.5"
                  style={{
                    background: action.bg,
                    borderColor: action.border,
                    boxShadow: `3px 3px 0 0 ${action.shadow}`,
                    color: action.textColor,
                  }}>
                  <div className="flex justify-center mb-2">
                    {activeAction === action.id
                      ? <span className="animate-spin inline-block w-5 h-5 border-2 border-current/30 border-t-current rounded-full" />
                      : action.icon}
                  </div>
                  <div className="text-xs font-extrabold uppercase">{action.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-70 font-medium">{action.sub}</div>
                </button>
              ))}
            </div>

            {/* Info */}
            <div className="bg-white border-2 border-[#1A1A1A]/10 rounded-lg px-4 py-3 text-xs text-[#777] space-y-1">
              <p>• <strong className="text-[#333]">Import</strong>: thêm mới, bỏ qua trùng (theo mã HS hoặc tên + ngày sinh)</p>
              <p>• <strong className="text-[#333]">Export</strong>: ghi đè sheet chính, giữ nguyên sheet phụ (Nghiệp đoàn, Chủ sử dụng...)</p>
              <p>• Đổi đường dẫn để liên kết file Excel khác</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
