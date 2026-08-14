import { useState, useEffect } from 'react';
import type { Candidate } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 12;

export function CandidateList({
  candidates,
  onSelectCandidate,
  isLoading
}: CandidateListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 if candidates list changes significantly (or if we filter later)
  useEffect(() => {
    setCurrentPage(1);
  }, [candidates.length]);

  if (isLoading) return <div className="p-8 font-bold">Đang tải...</div>;

  const totalPages = Math.ceil(candidates.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCandidates = candidates.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedCandidates.map(c => (
          <div key={c.id} className="artistic-card p-5 cursor-pointer hover:bg-[#FFF9F0] transition-colors" onClick={() => onSelectCandidate(c.id)}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-extrabold text-lg uppercase tracking-tight">{c.full_name_vn || 'Chưa cập nhật tên'}</h3>
                <p className="text-[#555] font-medium text-sm">{c.full_name_katakana}</p>
              </div>
              <span className="bg-[#FFD700] border-2 border-[#1A1A1A] font-mono text-xs font-bold px-2 py-1 rounded shadow-[2px_2px_0_0_#1A1A1A]">
                {c.profile_code || '---'}
              </span>
            </div>
            <div className="space-y-2 text-sm font-medium">
              <div className="flex justify-between"><span className="text-[#555]">Ngày sinh:</span> <span>{c.date_of_birth}</span></div>
              <div className="flex justify-between"><span className="text-[#555]">Giới tính:</span> <span>{c.gender}</span></div>
              <div className="flex justify-between"><span className="text-[#555]">SĐT:</span> <span>{c.phone}</span></div>
            </div>
            <div className="mt-5 pt-4 border-t-2 border-[#1A1A1A]/10 flex justify-between items-center">
              <span className="uppercase text-[10px] font-extrabold tracking-wider text-[#555]">Trạng thái: {c.status}</span>
              <button className="artistic-btn-secondary px-3 py-1.5 text-xs rounded">Chỉnh Sửa</button>
            </div>
          </div>
        ))}
      </div>

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
            Trang {currentPage} / {totalPages}
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
