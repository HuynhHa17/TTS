import { useState, useEffect, useRef } from 'react';
import type { Candidate } from '../types';
import { Search, Trash2, Plus, FileDown, CheckSquare, Square, FileArchive, Edit, FileText, FileSpreadsheet } from 'lucide-react';
import { formatDateVN } from '../utils/dateFormat';
import { Pagination } from './Pagination';

interface CandidateListProps {
  candidates: Candidate[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onSelectCandidate: (id: number) => void;
  onAddNew: () => void;
  onOpenImportForm?: () => void;
  onDeleteCandidate: (id: number) => void;
  onDownloadRirekisho: (id: number) => void;
  onDownloadTcmmxd: (id: number) => void;
  onExportAllPdf?: () => void;
  isLoading: boolean;
}

export function CandidateList({
  candidates,
  selectedIds,
  setSelectedIds,
  onSelectCandidate,
  onAddNew,
  onOpenImportForm,
  onDeleteCandidate,
  onDownloadRirekisho,
  onDownloadTcmmxd,
  onExportAllPdf,
  isLoading
}: CandidateListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Reset to page 1 if candidates list, pageSize, or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [candidates.length, searchTerm, pageSize]);

  if (isLoading) return <div className="p-8 font-bold text-center">Đang tải danh sách ứng viên...</div>;

  const s = searchTerm.toLowerCase().trim();
  const filteredCandidates = candidates.filter(c =>
    (c.full_name_vn || '').toLowerCase().includes(s) ||
    (c.profile_code || '').toLowerCase().includes(s) ||
    (c.full_name_katakana || '').toLowerCase().includes(s) ||
    (c.phone || '').includes(s)
  );

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + pageSize);

  const isAllSelected = paginatedCandidates.length > 0 && paginatedCandidates.every(c => selectedIds.includes(c.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = new Set(paginatedCandidates.map(c => c.id));
      setSelectedIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...paginatedCandidates.map(c => c.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} hồ sơ đã chọn khỏi hệ thống?`)) return;

    try {
      const res = await fetch('/api/candidates/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        selectedIds.forEach(id => onDeleteCandidate(id));
        setSelectedIds([]);
      }
    } catch {
      // Error handled silently
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] rounded-xl px-4 py-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <button
            onClick={handleToggleSelectAll}
            className={`h-9 px-3 text-xs font-black rounded-lg flex items-center gap-1.5 border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] transition-all ${
              isAllSelected 
                ? 'bg-[#1A1A1A] text-[#FFD700]' 
                : 'bg-white text-[#1A1A1A] hover:bg-[#FFD700]'
            }`}
          >
            {isAllSelected ? <CheckSquare size={15} /> : <Square size={15} />}
            <span>{isAllSelected ? 'Bỏ chọn trang' : 'Chọn cả trang'}</span>
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" size={16} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Tìm theo tên, mã HS, Katakana, SĐT..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="artistic-input w-full py-2 pl-9 pr-4 text-sm font-medium"
            />
          </div>

          {filteredCandidates.length !== candidates.length && (
            <span className="text-xs font-bold text-[#FF4D00] whitespace-nowrap">
              {filteredCandidates.length} kết quả
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="h-9 px-3 text-xs font-black uppercase rounded-lg border-2 border-[#D32F2F] bg-[#FFF5F5] text-[#D32F2F] shadow-[2px_2px_0_0_#D32F2F] hover:bg-[#D32F2F] hover:text-white transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Trash2 size={14} /> Xóa ({selectedIds.length})
            </button>
          )}

          {onOpenImportForm && (
            <button
              onClick={onOpenImportForm}
              title="Import file Excel đơn điền hoặc tải mẫu tờ đơn"
              className="h-9 px-3 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-[#FFD700] text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-[3px_3px_0_0_#1A1A1A] hover:bg-[#FFE033] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet size={14} />
              <span>Import Đơn</span>
            </button>
          )}

          {onExportAllPdf && (
            <button
              onClick={onExportAllPdf}
              title="Xuất tất cả hồ sơ ra PDF (ZIP)"
              className="h-9 px-3 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-[#00E5FF] text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-[3px_3px_0_0_#1A1A1A] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all flex items-center gap-1.5"
            >
              <FileArchive size={14} />
              <span>Xuất tất cả PDF</span>
            </button>
          )}

          <button
            onClick={onAddNew}
            className="h-9 px-3.5 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-[#FF4D00] text-white shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-[3px_3px_0_0_#1A1A1A] hover:bg-[#E64500] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Thêm Hồ Sơ</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      {paginatedCandidates.length === 0 ? (
        <div className="artistic-card p-12 text-center text-[#555] font-bold">
          Không tìm thấy hồ sơ nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginatedCandidates.map(c => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <div
                key={c.id}
                className={`artistic-card p-4 cursor-pointer transition-all relative ${
                  isSelected ? 'border-[#FF4D00] bg-[#FFF9F0] ring-2 ring-[#FF4D00]' : 'hover:bg-[#FFFDF9]'
                }`}
                onClick={() => onSelectCandidate(c.id)}
              >
                {/* Header card with selection checkbox */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={e => handleToggleSelect(c.id, e)}
                      onChange={() => {}}
                      className="w-4 h-4 mt-0.5 cursor-pointer accent-[#FF4D00] rounded"
                    />
                    <div>
                      <h3 className="font-extrabold text-base uppercase tracking-tight text-[#1A1A1A] leading-tight">
                        {c.full_name_vn || 'Chưa cập nhật tên'}
                      </h3>
                      <p className="text-[#666] font-bold text-xs mt-0.5">{c.full_name_katakana || '---'}</p>
                    </div>
                  </div>
                  <span className="bg-[#FFD700] border border-[#1A1A1A] font-mono text-[11px] font-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0_0_#1A1A1A]">
                    {c.profile_code || '---'}
                  </span>
                </div>

                {/* Body info */}
                <div className="space-y-1 text-xs font-semibold text-[#333] bg-[#FAFAF5] p-2.5 rounded-lg border border-[#1A1A1A]/10">
                  <div className="flex justify-between">
                    <span className="text-[#666]">Ngày sinh:</span>
                    <span className="font-bold">{formatDateVN(c.date_of_birth) || '---'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Giới tính:</span>
                    <span className="font-bold">{c.gender || '---'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Số điện thoại:</span>
                    <span className="font-bold">{c.phone || '---'}</span>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="mt-3 pt-2.5 border-t border-[#1A1A1A]/10 flex justify-between items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    c.status === 'completed'
                      ? 'bg-[#E8F5E9] text-[#1B8A3F] border-[#A5D6A7]'
                      : c.status === 'reviewing'
                        ? 'bg-[#FFF8E1] text-[#B8760A] border-[#FFE082]'
                        : 'bg-[#F5F5F5] text-[#555] border-[#DDD]'
                  }`}>
                    {c.status === 'completed' ? '● Hoàn thành' : c.status === 'reviewing' ? '◐ Xét duyệt' : '○ Nháp'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Xuất Rirekisho Excel"
                      onClick={e => {
                        e.stopPropagation();
                        onDownloadRirekisho(c.id);
                      }}
                      className="w-7 h-7 flex items-center justify-center border border-[#DDD] bg-white hover:bg-[#E8F5E9] hover:border-[#00C853] hover:text-[#1B8A3F] rounded-lg text-[#555] transition-all"
                    >
                      <FileDown size={13} />
                    </button>
                    <button
                      type="button"
                      title="Xuất PDF TCMMXD"
                      onClick={e => {
                        e.stopPropagation();
                        onDownloadTcmmxd(c.id);
                      }}
                      className="w-7 h-7 flex items-center justify-center border border-[#DDD] bg-white hover:bg-[#E3F2FD] hover:border-[#2196F3] hover:text-[#1976D2] rounded-lg text-[#555] transition-all"
                    >
                      <FileText size={13} />
                    </button>
                    <button
                      type="button"
                      title="Chỉnh sửa hồ sơ"
                      onClick={e => {
                        e.stopPropagation();
                        onSelectCandidate(c.id);
                      }}
                      className="h-7 px-2.5 text-xs font-black rounded-lg border border-[#DDD] bg-white hover:bg-[#FFD700] hover:border-[#1A1A1A] text-[#1A1A1A] transition-all flex items-center gap-1"
                    >
                      <Edit size={12} />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      title="Xóa hồ sơ"
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteCandidate(c.id);
                      }}
                      className="w-7 h-7 flex items-center justify-center border border-[#DDD] bg-white hover:bg-[#FFEBEE] hover:border-[#D32F2F] hover:text-[#D32F2F] rounded-lg text-[#999] transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredCandidates.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[12, 24, 48, 96]}
        itemLabel="hồ sơ"
      />
    </div>
  );
}
