import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, RefreshCw, Upload, X } from 'lucide-react';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: 'delete' | 'reload' | 'import' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmDialogProps {
  dialog: ConfirmDialogData | null;
}

const ICON_COMPONENTS = {
  delete: Trash2,
  reload: RefreshCw,
  import: Upload,
  warning: AlertTriangle,
};

const TYPE_STYLES = {
  danger: {
    iconBg: '#FF4D00',
    confirmBg: '#FF4D00',
    confirmHover: '#E04400',
  },
  warning: {
    iconBg: '#FFB300',
    confirmBg: '#FFB300',
    confirmHover: '#E0A000',
  },
  info: {
    iconBg: '#2196F3',
    confirmBg: '#2196F3',
    confirmHover: '#1976D2',
  },
};

export function ConfirmDialog({ dialog }: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dialog) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dialog.onCancel();
      if (e.key === 'Enter') dialog.onConfirm();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dialog]);

  if (!dialog) return null;

  const type = dialog.type || 'danger';
  const styles = TYPE_STYLES[type];
  const IconComp = ICON_COMPONENTS[dialog.icon || 'warning'];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) dialog.onCancel(); }}
    >
      <div className="bg-[#FFFDF7] border-2 border-[#1A1A1A] rounded-2xl shadow-[6px_6px_0_0_#1A1A1A] max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-[#1A1A1A] flex items-center justify-center shadow-[2px_2px_0_0_#1A1A1A]"
            style={{ backgroundColor: styles.iconBg }}
          >
            <IconComp size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold uppercase tracking-tight text-[#1A1A1A]">
              {dialog.title}
            </h3>
            <p className="text-sm text-[#555] mt-1.5 whitespace-pre-line leading-relaxed">
              {dialog.message}
            </p>
          </div>
          <button
            onClick={dialog.onCancel}
            className="flex-shrink-0 p-1.5 text-[#999] hover:text-[#1A1A1A] hover:bg-[#F0F0F0] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex items-center justify-end gap-3">
          <button
            onClick={dialog.onCancel}
            className="px-5 py-2.5 text-sm font-bold rounded-lg border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-[1px_1px_0_0_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            {dialog.cancelText || 'Hủy'}
          </button>
          <button
            onClick={dialog.onConfirm}
            className="px-5 py-2.5 text-sm font-bold rounded-lg border-2 border-[#1A1A1A] text-white shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-[1px_1px_0_0_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            style={{ backgroundColor: styles.confirmBg }}
          >
            {dialog.confirmText || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
