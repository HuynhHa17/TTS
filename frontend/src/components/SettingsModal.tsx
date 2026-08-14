import { useState, useEffect } from 'react';
import { Key, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; msg: string }>({ type: 'idle', msg: '' });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      setStatus({ type: 'idle', msg: '' });
      setGeminiApiKey('');
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const d = await res.json();
        setIsKeySet(d.gemini_api_key_set);
        setMaskedKey(d.gemini_api_key_masked);
        if (d.custom_field_defs) {
          try {
            setCustomFieldDefs(JSON.parse(d.custom_field_defs));
          } catch {
            setCustomFieldDefs([]);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!geminiApiKey) return;
    
    setStatus({ type: 'loading', msg: 'Đang lưu...' });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gemini_api_key: geminiApiKey || undefined // only update if not empty
        }),
      });
      if (res.ok) {
        setStatus({ type: 'success', msg: '✅ Đã lưu API Key thành công!' });
        setGeminiApiKey('');
        fetchSettings(); // refresh state
      } else {
        const d = await res.json();
        setStatus({ type: 'error', msg: `❌ Lỗi: ${d.error}` });
      }
    } catch {
      setStatus({ type: 'error', msg: '❌ Lỗi kết nối server' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-md">
        <div className="artistic-card overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b-2 border-[#1A1A1A] bg-[#1A1A1A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-white">Cài Đặt Hệ Thống</h2>
                <p className="text-xs text-white/60 font-medium">Cấu hình API Key & Tham số</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="p-6 bg-[#F8F7F2] space-y-6">
            
            {/* API Key Config */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#444] flex items-center gap-2">
                <Key size={14} /> Google Gemini API Key
              </label>
              
              {isKeySet && !geminiApiKey && (
                <div className="p-3 bg-[#F0FFF5] border-2 border-[#00C853] rounded-lg mb-3 flex items-start gap-2">
                  <CheckCircle size={16} className="text-[#00C853] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#00C853]">Đã cấu hình API Key</p>
                    <p className="text-xs font-mono text-[#555]">{maskedKey}</p>
                  </div>
                </div>
              )}

              <input
                type="password"
                placeholder={isKeySet ? "Nhập key mới để thay thế..." : "AIzaSy..."}
                value={geminiApiKey}
                onChange={e => setGeminiApiKey(e.target.value)}
                className="artistic-input py-2.5 px-3 text-sm font-mono w-full"
              />
              
              <p className="text-xs text-[#666] flex items-start gap-1.5">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-[#FF4D00]" />
                API Key được lưu mã hoá an toàn trong SQLite và dùng để dịch tự động các trường dữ liệu tiếng Nhật.
              </p>
            </div>

            {/* Status MSG */}
            {status.msg && (
              <div className={`px-4 py-2 text-sm font-bold rounded border-2 ${
                status.type === 'success' ? 'bg-[#F0FFF5] border-[#00C853] text-[#00C853]' :
                status.type === 'error' ? 'bg-[#FFF5F0] border-[#FF4D00] text-[#FF4D00]' :
                'bg-white border-[#1A1A1A]'
              }`}>
                {status.msg}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-2 border-t-2 border-[#1A1A1A]/10 gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 font-bold text-sm text-[#555] hover:text-[#1A1A1A] transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleSave}
                disabled={status.type === 'loading'}
                className="artistic-btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {status.type === 'loading' ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
                ) : (
                  <Save size={16} />
                )}
                Lưu Thay Đổi
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
