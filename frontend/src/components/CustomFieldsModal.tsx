import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit, AlertCircle } from 'lucide-react';
import type { CustomFieldDef } from '../types';

interface CustomFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomFieldsModal({ isOpen, onClose }: CustomFieldsModalProps) {
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; msg: string }>({ type: 'idle', msg: '' });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      setStatus({ type: 'idle', msg: '' });
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const d = await res.json();
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
    setStatus({ type: 'loading', msg: 'Đang lưu...' });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          custom_field_defs: JSON.stringify(customFieldDefs)
        }),
      });
      if (res.ok) {
        setStatus({ type: 'success', msg: '✅ Đã lưu cấu hình trường thành công! Vui lòng tải lại trang nếu cần.' });
        fetchSettings(); // refresh state
      } else {
        const d = await res.json();
        setStatus({ type: 'error', msg: `❌ Lỗi: ${d.error}` });
      }
    } catch {
      setStatus({ type: 'error', msg: '❌ Lỗi kết nối server' });
    }
  };

  const addCustomField = () => {
    const id = 'custom_' + Date.now().toString(36);
    setCustomFieldDefs([...customFieldDefs, { id, label: 'Trường mới', type: 'text', requireJp: false }]);
  };

  const updateCustomField = (index: number, key: keyof CustomFieldDef, value: any) => {
    const newDefs = [...customFieldDefs];
    newDefs[index] = { ...newDefs[index], [key]: value };
    setCustomFieldDefs(newDefs);
  };

  const removeCustomField = (index: number) => {
    setCustomFieldDefs(customFieldDefs.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-lg">
        <div className="artistic-card overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b-2 border-[#1A1A1A] bg-[#1A1A1A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-white">Quản Lý Trường Tùy Chỉnh</h2>
                <p className="text-xs text-white/60 font-medium">Thêm cột/trường mới cho ứng viên</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="p-6 bg-[#F8F7F2] space-y-6">
            <div className="flex justify-between items-center pb-2 border-b-2 border-[#1A1A1A]/10">
              <label className="text-sm font-extrabold uppercase tracking-wider text-[#444] flex items-center gap-2">
                <Edit size={16} /> Danh Sách Cột / Trường
              </label>
              <button 
                onClick={addCustomField}
                className="artistic-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 font-bold text-[#FF4D00] hover:text-[#1A1A1A] transition-colors"
              >
                <Plus size={14} /> Thêm Mới
              </button>
            </div>

            {customFieldDefs.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-[#ccc] rounded text-sm text-[#777] bg-white">
                <p className="font-bold mb-2">Chưa có trường tùy chỉnh nào.</p>
                <p className="text-xs">Bấm "Thêm Mới" để tạo các cột dữ liệu theo ý muốn (ví dụ: Chiều cao, Cân nặng...)</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {customFieldDefs.map((field, idx) => (
                  <div key={field.id} className="p-4 bg-white border-2 border-[#1A1A1A] rounded shadow-[2px_2px_0_0_#1A1A1A] flex gap-4 items-start">
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-[#666] block mb-1">Tên trường (Label)</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={e => updateCustomField(idx, 'label', e.target.value)}
                            placeholder="Tên cột hiển thị..."
                            className="artistic-input py-1.5 px-3 text-sm w-full font-bold"
                          />
                        </div>
                        <div className="w-24">
                          <label className="text-[10px] uppercase font-bold text-[#666] block mb-1">Loại</label>
                          <select 
                            value={field.type}
                            onChange={e => updateCustomField(idx, 'type', e.target.value)}
                            className="artistic-input py-1.5 px-2 text-sm w-full bg-white"
                          >
                            <option value="text">Chữ (Text)</option>
                            <option value="number">Số (Number)</option>
                            <option value="date">Ngày (Date)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium bg-[#FAFAF5] p-2 border-2 border-[#F0F0F0] rounded">
                        <label className="flex items-center gap-2 cursor-pointer w-full">
                          <input 
                            type="checkbox" 
                            checked={field.requireJp}
                            onChange={e => updateCustomField(idx, 'requireJp', e.target.checked)}
                            className="accent-[#FF4D00] w-4 h-4 cursor-pointer"
                          />
                          <span className="flex-1 font-bold">Cần dịch sang tiếng Nhật bằng AI</span>
                        </label>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeCustomField(idx)}
                      className="text-[#FF4D00] hover:bg-[#FFF5F0] p-2 rounded transition-colors mt-4 border-2 border-transparent hover:border-[#FF4D00]"
                      title="Xoá trường này"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Status MSG */}
            {status.msg && (
              <div className={`px-4 py-3 text-sm font-bold rounded border-2 ${
                status.type === 'success' ? 'bg-[#F0FFF5] border-[#00C853] text-[#00C853]' :
                status.type === 'error' ? 'bg-[#FFF5F0] border-[#FF4D00] text-[#FF4D00]' :
                'bg-white border-[#1A1A1A]'
              }`}>
                {status.msg}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t-2 border-[#1A1A1A]/10 gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 font-bold text-sm text-[#555] hover:text-[#1A1A1A] transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleSave}
                disabled={status.type === 'loading'}
                className="artistic-btn-primary px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
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
