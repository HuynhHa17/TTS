import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = manual close
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

const ICON_MAP = {
  success: { icon: CheckCircle, bg: '#00C853', label: 'Thành công' },
  error: { icon: XCircle, bg: '#FF4D00', label: 'Lỗi' },
  warning: { icon: AlertTriangle, bg: '#FFB300', label: 'Cảnh báo' },
  info: { icon: Info, bg: '#2196F3', label: 'Thông báo' },
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const config = ICON_MAP[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const dur = toast.duration ?? 4000;
    if (dur > 0) {
      timerRef.current = setTimeout(() => onDismiss(toast.id), dur);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className="animate-slide-in-right flex items-start gap-3 p-4 rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] max-w-md w-full transition-all hover:shadow-[2px_2px_0_0_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px]"
      style={{ backgroundColor: '#FFFDF7' }}
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold uppercase tracking-tight text-[#1A1A1A]">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-[#555] mt-1 whitespace-pre-line leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 text-[#999] hover:text-[#1A1A1A] hover:bg-[#F0F0F0] rounded transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-auto">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
