import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { label: 'Bảng Master Excel',      keys: ['Ctrl', '1'],   color: '#FF4D00' },
  { label: 'Danh sách ứng viên',     keys: ['Ctrl', '2'],   color: '#FF4D00' },
  { label: 'Thêm hồ sơ mới',         keys: ['Ctrl', 'N'],   color: '#7C3AED' },
  { label: 'Chế độ Sáng / Tối',      keys: ['Ctrl', 'J'],   color: '#FFD700' },
  { label: 'Mở keyboard shortcuts',  keys: ['Ctrl', 'K'],   color: '#7C3AED' },
  { label: 'Xuất file hàng loạt',    keys: ['Ctrl', 'B'],   color: '#00C853' },
  { label: 'Đóng modal / Thoát',     keys: ['Esc'],          color: '#888'    },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-md">
        <div className="artistic-card overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 border-b-2 border-[#1A1A1A] bg-[#1A1A1A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Keyboard size={22} className="text-[#FFD700]" />
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-white">Phím Tắt</h2>
                <p className="text-xs text-white/60 font-medium">Dùng Cmd thay Ctrl trên macOS</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Shortcuts list */}
          <div className="p-5 bg-[#F8F7F2] space-y-2">
            {shortcuts.map((s, i) => (
              <div key={i}
                className="flex items-center justify-between px-4 py-2.5 bg-white border-2 border-[#1A1A1A]/10 rounded-lg hover:border-[#1A1A1A]/30 hover:shadow-[2px_2px_0_0_#1A1A1A]/10 transition-all">
                <span className="font-semibold text-sm text-[#333]">{s.label}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k, j) => (
                    <span key={j}>
                      <kbd
                        className="inline-flex items-center justify-center px-2 py-1 text-xs font-extrabold font-mono rounded-md border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] bg-white min-w-[2rem]"
                        style={{ color: s.color }}>
                        {k}
                      </kbd>
                      {j < s.keys.length - 1 && <span className="text-[#AAA] text-xs font-bold mx-0.5">+</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            <div className="bg-[#FFF9F0] border-2 border-[#FFD700] rounded-lg px-4 py-2.5 text-xs text-[#555] font-medium">
              💡 Nhấn phím tắt từ bất kỳ đâu trên trang — không cần focus vào input
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
