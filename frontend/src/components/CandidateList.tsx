import { useState, useEffect } from 'react';
import type { Candidate } from '../types';
import { ChevronLeft, ChevronRight, Trash2, Plus, FileDown, CheckSquare, Square, FileArchive } from 'lucide-react';
import { formatDateVN } from '../utils/dateFormat';

interface CandidateListProps {
  candidates: Candidate[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onSelectCandidate: (id: number) => void;
  onAddNew: () => void;
  onOpenGoogleSheetImport: () => void;
  onDeleteCandidate: (id: number) => void;
  onDownloadRirekisho: (id: number) => void;
  onDownloadTcmmxd: (id: number) => void;
  onExportAllPdf?: () => void;
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 12;

export function CandidateList({
  candidates,
  selectedIds,
  setSelectedIds,
  onSelectCandidate,
  onAddNew,
  onDeleteCandidate,
  onDownloadRirekisho,
  onDownloadTcmmxd,
  onExportAllPdf,
  isLoading
}: CandidateListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset to page 1 if candidates list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [candidates.length, searchTerm]);

  if (isLoading) return <div className="p-8 font-bold text-center">Đang tải danh sách ứng viên...</div>;

  const s = searchTerm.toLowerCase().trim();
  const filteredCandidates = candidates.filter(c =>
    (c.full_name_vn || '').toLowerCase().includes(s) ||
    (c.profile_code || '').toLowerCase().includes(s) ||
    (c.full_name_katakana || '').toLowerCase().includes(s) ||
    (c.phone || '').includes(s)
  );

  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border-2 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A]">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 text-xs font-extrabold uppercase px-3 py-2 border-2 border-[#1A1A1A] rounded bg-[#FAFAF5] hover:bg-[#FFD700] transition-colors"
          >
            {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            {isAllSelected ? 'Bỏ chọn trang' : 'Chọn cả trang'}
          </button>

          <input
            type="text"
            placeholder="Tìm theo tên, mã HS, Katakana, SĐT..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="artistic-input py-1.5 px-3 text-sm flex-1 max-w-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="border-2 border-[#D32F2F] bg-[#FFF5F5] text-[#D32F2F] px-4 py-2 text-xs font-black uppercase rounded
                flex items-center gap-1.5 hover:bg-[#D32F2F] hover:text-white transition-all
                shadow-[2px_2px_0_0_#D32F2F] hover:shadow-[3px_3px_0_0_#D32F2F] active:scale-95"
            >
              <Trash2 size={15} /> Xóa ({selectedIds.length}) Đã Chọn
            </button>
          )}

          {onExportAllPdf && (
            <button
              onClick={onExportAllPdf}
              title="Xuất tất cả hồ sơ ra PDF (ZIP)"
              className="border-2 border-[#1E3A5F] bg-[#F0F4FA] text-[#1E3A5F] px-3 py-2 text-xs font-black uppercase rounded
                flex items-center gap-1.5 hover:bg-[#1E3A5F] hover:text-white transition-all
                shadow-[2px_2px_0_0_#1E3A5F] hover:shadow-[3px_3px_0_0_#1E3A5F] active:scale-95"
            >
              <FileArchive size={15} /> Xuất tất cả PDF
            </button>
          )}

          <button
            onClick={onAddNew}
            className="artistic-btn-primary px-4 py-2 text-xs font-black uppercase rounded flex items-center gap-1.5"
          >
            <Plus size={15} /> Thêm Hồ Sơ Mới
          </button>
        </div>
      </div>

      {/* Grid List */}
      {paginatedCandidates.length === 0 ? (
        <div className="artistic-card p-12 text-center text-[#555] font-bold">
          Không tìm thấy hồ sơ nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedCandidates.map(c => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <div
                key={c.id}
                className={`artistic-card p-5 cursor-pointer transition-all relative ${
                  isSelected ? 'border-[#FF4D00] bg-[#FFF9F0] ring-2 ring-[#FF4D00]' : 'hover:bg-[#FFFDF9]'
                }`}
                onClick={() => onSelectCandidate(c.id)}
              >
                {/* Header card with selection checkbox */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={e => handleToggleSelect(c.id, e)}
                      onChange={() => {}}
                      className="w-5 h-5 mt-0.5 cursor-pointer accent-[#FF4D00] rounded"
                    />
                    <div>
                      <h3 className="font-extrabold text-lg uppercase tracking-tight text-[#1A1A1A]">
                        {c.full_name_vn || 'Chưa cập nhật tên'}
                      </h3>
                      <p className="text-[#555] font-bold text-xs">{c.full_name_katakana || '---'}</p>
                    </div>
                  </div>
                  <span className="bg-[#FFD700] border-2 border-[#1A1A1A] font-mono text-xs font-black px-2 py-0.5 rounded shadow-[2px_2px_0_0_#1A1A1A]">
                    {c.profile_code || '---'}
                  </span>
                </div>

                {/* Body info */}
                <div className="space-y-1.5 text-xs font-semibold text-[#333] bg-[#FAFAF5] p-3 rounded border border-[#1A1A1A]/15">
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
                <div className="mt-4 pt-3 border-t-2 border-[#1A1A1A]/10 flex justify-between items-center gap-2">
                  <span className={`uppercase text-[10px] font-black px-2 py-0.5 rounded border border-[#1A1A1A]
                    ${c.status === 'completed' ? 'bg-[#00C853] text-white' : c.status === 'reviewing' ? 'bg-[#FFD700]' : 'bg-[#E0E0E0]'}`}>
                    {c.status || 'draft'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Xuất Rirekisho"
                      onClick={e => {
                        e.stopPropagation();
                        onDownloadRirekisho(c.id);
                      }}
                      className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#FFD700] rounded text-[#1A1A1A] transition-colors"
                    >
                      <FileDown size={14} />
                    </button>
                    <button
                      type="button"
                      title="Xuất TCMMXD"
                      onClick={e => {
                        e.stopPropagation();
                        onDownloadTcmmxd(c.id);
                      }}
                      className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#FFD700] rounded text-[#1A1A1A] transition-colors font-black text-[10px]"
                    >
                      TC
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onSelectCandidate(c.id);
                      }}
                      className="artistic-btn-secondary px-2.5 py-1 text-xs rounded font-bold"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      title="Xóa hồ sơ"
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteCandidate(c.id);
                      }}
                      className="p-1.5 border border-[#D32F2F] bg-[#FFF5F5] hover:bg-[#D32F2F] hover:text-white rounded text-[#D32F2F] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 border-2 border-[#1A1A1A] bg-white rounded shadow-[2px_2px_0_0_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FFD700] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="font-extrabold text-sm uppercase tracking-wider">
          Trang {currentPage} / {totalPages} (Tổng {filteredCandidates.length} hồ sơ)
        </span>

        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-2 border-2 border-[#1A1A1A] bg-white rounded shadow-[2px_2px_0_0_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FFD700] transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
