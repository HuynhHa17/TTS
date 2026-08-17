import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Loader2, UserCheck, GraduationCap, Briefcase, Users, FileText, Files, X } from 'lucide-react';
import type { FullCandidateProfile } from '../types';
import { formatDateVN } from '../utils/dateFormat';

interface ImportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (candidateId?: number) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export function ImportFormModal({ isOpen, onClose, onSuccess, showToast }: ImportFormModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<FullCandidateProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    window.location.href = '/api/documents/form-template';
    showToast('info', 'Đang tải mẫu đơn...', 'File To_Khai_Ung_Vien.xlsx đang được tải về');
  };

  const handleFilesSelected = async (selectedFileList: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < selectedFileList.length; i++) {
      const f = selectedFileList[i];
      if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      setErrorMsg('Vui lòng chọn file Excel có đuôi .xlsx hoặc .xls');
      return;
    }

    setFiles(validFiles);
    setErrorMsg(null);

    // If 1 file selected, show instant preview
    if (validFiles.length === 1) {
      setIsPreviewing(true);
      const formData = new FormData();
      formData.append('file', validFiles[0]);

      try {
        const res = await fetch('/api/documents/preview-form', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setPreviewData(data);
        } else {
          setErrorMsg(data.error || 'Không thể đọc file tờ đơn này');
        }
      } catch {
        setErrorMsg('Lỗi kết nối máy chủ khi đọc file tờ đơn');
      } finally {
        setIsPreviewing(false);
      }
    } else {
      setPreviewData(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    if (next.length === 1) {
      handleFilesSelected(next);
    } else if (next.length === 0) {
      setPreviewData(null);
    }
  };

  const handleImportSubmit = async () => {
    if (files.length === 0) {
      setErrorMsg('Vui lòng chọn file tờ đơn đã điền');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      if (files.length === 1) {
        // Single file import
        const formData = new FormData();
        formData.append('file', files[0]);

        const res = await fetch('/api/documents/import-form', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          showToast('success', '✅ Nạp tờ đơn thành công!', `Đã thêm ứng viên ${data.profile?.candidate?.full_name_vn || ''} vào hệ thống.`);
          onSuccess(data.candidate_id);
          onClose();
        } else {
          setErrorMsg(data.error || 'Có lỗi xảy ra khi nạp tờ đơn');
        }
      } else {
        // Batch multiple files import
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        const res = await fetch('/api/documents/import-forms-batch', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          showToast('success', `✅ Nạp thành công ${data.imported_count} hồ sơ!`, `Đã xử lý ${data.total_files} file tờ đơn.`);
          onSuccess();
          onClose();
        } else {
          setErrorMsg(data.error || 'Có lỗi xảy ra khi nạp các file tờ đơn');
        }
      }
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ để lưu hồ sơ');
    } finally {
      setIsUploading(false);
    }
  };

  const c = previewData?.candidate;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-2xl">
        <div className="artistic-card overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b-2 border-[#1A1A1A] bg-[#1A1A1A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={22} className="text-[#FFD700]" />
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-white">
                  Import Tờ Đơn Điền Ứng Viên (Excel)
                </h2>
                <p className="text-xs text-white/60 font-medium">
                  Tải mẫu tờ khai hoặc nạp trực tiếp các file tờ đơn Excel đã điền vào hệ thống
                </p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 bg-[#F8F7F2] dark:bg-[#181818] max-h-[80vh] overflow-y-auto">
            
            {/* Step 1: Download Template */}
            <div className="p-4 bg-white dark:bg-[#222222] border-2 border-[#1A1A1A] dark:border-[#383838] shadow-[2px_2px_0_0_#1A1A1A] rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-black text-sm text-[#1A1A1A] dark:text-[#EDEDED] flex items-center gap-2">
                  <span>1. Mẫu Tờ Đơn Excel Chuẩn (To_Khai_Ung_Vien.xlsx)</span>
                  <span className="text-[10px] bg-[#E8F5E9] text-[#1B8A3F] border border-[#1B8A3F] font-bold px-1.5 py-0.5 rounded">.XLSX</span>
                </div>
                <p className="text-xs text-[#666] dark:text-[#AAA]">
                  File mẫu kẻ khung, format sẵn như tờ đơn xin việc/tờ khai để gửi ứng viên điền
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="h-9 px-3.5 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-[#4CAF50] text-white shadow-[2px_2px_0_0_#1A1A1A] hover:bg-[#43A047] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <Download size={14} />
                <span>Tải Mẫu Đơn</span>
              </button>
            </div>

            {/* Step 2: Upload Filled Form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-black text-sm text-[#1A1A1A] dark:text-[#EDEDED] block">
                  2. Chọn hoặc Kéo Thả File Tờ Đơn Đã Điền
                </label>
                <span className="text-xs text-[#666] dark:text-[#AAA] font-medium">Hỗ trợ chọn 1 hoặc nhiều file cùng lúc</span>
              </div>

              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#1A1A1A] dark:border-[#555] bg-white dark:bg-[#222222] hover:bg-[#FFFDF5] dark:hover:bg-[#282828] rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={e => e.target.files && handleFilesSelected(e.target.files)}
                />
                <div className="w-12 h-12 rounded-xl bg-[#FFF9E6] dark:bg-[#332A10] text-[#B8760A] dark:text-[#FFD700] border-2 border-[#1A1A1A] dark:border-[#555] flex items-center justify-center">
                  <Upload size={22} />
                </div>
                {files.length > 0 ? (
                  <div className="space-y-1">
                    <p className="font-black text-sm text-[#1A1A1A] dark:text-[#EDEDED]">
                      {files.length === 1 ? files[0].name : `Đã chọn ${files.length} file tờ đơn`}
                    </p>
                    <p className="text-xs text-[#666] dark:text-[#AAA]">
                      {files.length === 1 
                        ? `${(files[0].size / 1024).toFixed(1)} KB • Bấm để đổi file khác`
                        : `${files.map(f => f.name).join(', ').slice(0, 60)}...`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-black text-sm text-[#1A1A1A] dark:text-[#EDEDED]">Kéo thả file tờ đơn vào đây hoặc click để chọn file</p>
                    <p className="text-xs text-[#888]">Chấp nhận file Excel (.xlsx, .xls) — Có thể chọn nhiều file</p>
                  </div>
                )}
              </div>
            </div>

            {/* Multiple files list badge */}
            {files.length > 1 && (
              <div className="p-3 bg-white dark:bg-[#222222] border-2 border-[#1A1A1A] dark:border-[#383838] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-[#1A1A1A] dark:text-[#EDEDED]">
                  <span className="flex items-center gap-1.5"><Files size={14} className="text-[#FF4D00]" /> Danh sách file sẽ nạp ({files.length}):</span>
                  <button type="button" onClick={() => setFiles([])} className="text-[#D32F2F] hover:underline text-[11px]">Xóa tất cả</button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-2.5 py-1 bg-[#F5F5F0] dark:bg-[#2A2A2A] rounded text-xs">
                      <span className="font-medium truncate max-w-[400px]">{f.name}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-[#888] hover:text-[#D32F2F]">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error message */}
            {errorMsg && (
              <div className="p-3 bg-[#FFF5F5] dark:bg-[#351414] border-2 border-[#D32F2F] rounded-lg text-xs font-bold text-[#D32F2F] dark:text-[#FF8A80] flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Loading preview */}
            {isPreviewing && (
              <div className="p-4 text-center text-xs font-bold text-[#666] dark:text-[#AAA] flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Đang đọc dữ liệu từ tờ đơn...</span>
              </div>
            )}

            {/* Preview Card if parsed */}
            {previewData && c && (
              <div className="p-4 bg-white dark:bg-[#222222] border-2 border-[#1A1A1A] dark:border-[#383838] shadow-[2px_2px_0_0_#1A1A1A] rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
                  <span className="text-xs font-black uppercase text-[#FF4D00] flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-[#00C853]" />
                    Xem Trước Dữ Liệu Tờ Đơn
                  </span>
                  <span className="text-xs font-mono font-bold bg-[#FFD700] text-[#1A1A1A] px-2 py-0.5 rounded border border-[#1A1A1A]">
                    {c.profile_code || 'Tự cấp mã'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#666] dark:text-[#888]">Họ và tên: </span>
                    <strong className="text-[#1A1A1A] dark:text-[#EDEDED] uppercase">{c.full_name_vn || '---'}</strong>
                  </div>
                  <div>
                    <span className="text-[#666] dark:text-[#888]">Ngày sinh: </span>
                    <strong className="text-[#1A1A1A] dark:text-[#EDEDED]">{formatDateVN(c.date_of_birth) || '---'}</strong>
                  </div>
                  <div>
                    <span className="text-[#666] dark:text-[#888]">Giới tính: </span>
                    <strong className="text-[#1A1A1A] dark:text-[#EDEDED]">{c.gender || '---'}</strong>
                  </div>
                  <div>
                    <span className="text-[#666] dark:text-[#888]">Số điện thoại: </span>
                    <strong className="text-[#1A1A1A] dark:text-[#EDEDED]">{c.phone || '---'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#666] dark:text-[#888]">Địa chỉ: </span>
                    <span className="text-[#1A1A1A] dark:text-[#EDEDED]">{c.address_vn || '---'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#666] dark:text-[#888]">Ngành nghề đăng ký: </span>
                    <strong className="text-[#00B4D8]">{previewData.assignment?.internship_field_vn || '---'}</strong>
                  </div>
                </div>

                {/* Sub-records summary */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1A1A1A]/10">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F5F5F0] dark:bg-[#2A2A2A] rounded text-[11px] font-bold">
                    <GraduationCap size={13} className="text-[#7C3AED]" />
                    {previewData.educations?.length || 0} trường học
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F5F5F0] dark:bg-[#2A2A2A] rounded text-[11px] font-bold">
                    <Briefcase size={13} className="text-[#FF4D00]" />
                    {previewData.workExperiences?.length || 0} nơi làm việc
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F5F5F0] dark:bg-[#2A2A2A] rounded text-[11px] font-bold">
                    <Users size={13} className="text-[#00C853]" />
                    {previewData.familyMembers?.length || 0} người thân
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F5F5F0] dark:bg-[#2A2A2A] rounded text-[11px] font-bold">
                    <FileText size={13} className="text-[#2196F3]" />
                    {previewData.identityDocuments?.length || 0} giấy tờ (CCCD/Passport)
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t-2 border-[#1A1A1A] bg-white dark:bg-[#1E1E1E] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:bg-[#F0F0F0] transition-all"
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={files.length === 0 || isUploading || isPreviewing}
              onClick={handleImportSubmit}
              className="h-9 px-5 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-[#FF4D00] text-white shadow-[2px_2px_0_0_#1A1A1A] hover:bg-[#E64500] hover:shadow-[3px_3px_0_0_#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
              <span>
                {isUploading 
                  ? 'Đang nạp hồ sơ...' 
                  : files.length > 1 
                    ? `Xác Nhận Nạp ${files.length} Tờ Đơn` 
                    : 'Xác Nhận Nạp Hồ Sơ'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
