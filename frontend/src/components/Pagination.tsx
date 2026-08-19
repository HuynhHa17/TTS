import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48, 96],
  className = '',
  itemLabel = 'hồ sơ'
}: PaginationProps) {
  const [jumpPage, setJumpPage] = useState('');

  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = (validPage - 1) * pageSize + 1;
  const endItem = Math.min(validPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (validPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (validPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(validPage - 1);
      pages.push(validPage);
      pages.push(validPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
      setJumpPage('');
    }
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#1E1E1E] border-2 border-[#1A1A1A] dark:border-[#333] shadow-[2px_2px_0_0_#1A1A1A] dark:shadow-[2px_2px_0_0_#000] rounded-xl px-4 py-3 text-xs ${className}`}>
      {/* Left: Summary & Page Size */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-bold text-[#555] dark:text-[#AAA]">
          Hiển thị <strong className="text-[#1A1A1A] dark:text-white font-black">{startItem} - {endItem}</strong> trên tổng số <strong className="text-[#FF4D00] font-black">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 border-l border-[#1A1A1A]/10 dark:border-white/10 pl-3">
            <span className="text-[#777] dark:text-[#888] font-medium">Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="artistic-input py-1 px-2 text-xs font-bold bg-white dark:bg-[#2A2A2A] border border-[#1A1A1A] dark:border-[#444] rounded-lg cursor-pointer"
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={validPage === 1}
          title="Trang đầu"
          className="w-8 h-8 flex items-center justify-center border-2 border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#2A2A2A] text-[#1A1A1A] dark:text-white rounded-lg shadow-[1.5px_1.5px_0_0_#1A1A1A] dark:shadow-[1.5px_1.5px_0_0_#000] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FFD700] hover:text-[#1A1A1A] dark:hover:bg-[#FFD700] dark:hover:text-[#1A1A1A] transition-all"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(Math.max(1, validPage - 1))}
          disabled={validPage === 1}
          title="Trang trước"
          className="w-8 h-8 flex items-center justify-center border-2 border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#2A2A2A] text-[#1A1A1A] dark:text-white rounded-lg shadow-[1.5px_1.5px_0_0_#1A1A1A] dark:shadow-[1.5px_1.5px_0_0_#000] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FFD700] hover:text-[#1A1A1A] dark:hover:bg-[#FFD700] dark:hover:text-[#1A1A1A] transition-all"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={`ellipsis-${idx}`} className="w-7 h-8 flex items-center justify-center font-black text-[#999]">
                  ...
                </span>
              );
            }
            const isActive = p === validPage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 text-xs font-black rounded-lg border-2 transition-all ${
                  isActive
                    ? 'bg-[#1A1A1A] text-[#FFD700] border-[#1A1A1A] dark:bg-[#FFD700] dark:text-[#1A1A1A] dark:border-[#FFD700] shadow-[2px_2px_0_0_#FF4D00]'
                    : 'bg-white dark:bg-[#2A2A2A] text-[#1A1A1A] dark:text-[#EEE] border-[#DDD] dark:border-[#444] hover:border-[#1A1A1A] hover:bg-[#FFD700] hover:text-[#1A1A1A]'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, validPage + 1))}
          disabled={validPage === totalPages}
          title="Trang sau"
          className="w-8 h-8 flex items-center justify-center border-2 border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#2A2A2A] text-[#1A1A1A] dark:text-white rounded-lg shadow-[1.5px_1.5px_0_0_#1A1A1A] dark:shadow-[1.5px_1.5px_0_0_#000] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FFD700] hover:text-[#1A1A1A] dark:hover:bg-[#FFD700] dark:hover:text-[#1A1A1A] transition-all"
        >
          <ChevronRight size={15} />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={validPage === totalPages}
          title="Trang cuối"
          className="w-8 h-8 flex items-center justify-center border-2 border-[#1A1A1A] dark:border-[#444] bg-white dark:bg-[#2A2A2A] text-[#1A1A1A] dark:text-white rounded-lg shadow-[1.5px_1.5px_0_0_#1A1A1A] dark:shadow-[1.5px_1.5px_0_0_#000] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FFD700] hover:text-[#1A1A1A] dark:hover:bg-[#FFD700] dark:hover:text-[#1A1A1A] transition-all"
        >
          <ChevronsRight size={15} />
        </button>

        {/* Jump to page form if more than 5 pages */}
        {totalPages > 5 && (
          <form onSubmit={handleJump} className="flex items-center gap-1 ml-2 border-l border-[#1A1A1A]/10 dark:border-white/10 pl-2">
            <span className="text-[#777] dark:text-[#888] font-medium hidden sm:inline">Tới:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={e => setJumpPage(e.target.value)}
              placeholder={`${validPage}`}
              className="artistic-input w-12 py-1 px-1.5 text-center text-xs font-bold bg-white dark:bg-[#2A2A2A] border border-[#1A1A1A] dark:border-[#444] rounded-lg"
            />
            <button
              type="submit"
              className="h-8 px-2 border border-[#1A1A1A] dark:border-[#444] bg-[#F0F0F0] dark:bg-[#333] hover:bg-[#FFD700] hover:text-[#1A1A1A] rounded-lg font-black text-xs transition-colors"
            >
              Đi
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
