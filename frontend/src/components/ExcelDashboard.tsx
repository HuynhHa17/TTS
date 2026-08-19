import { useState, useEffect, useRef } from 'react';
import type { Candidate, CustomFieldDef } from '../types';
import { Search, Trash2, FileDown, CheckSquare, Square, Edit, FileSpreadsheet } from 'lucide-react';
import { formatDateVN } from '../utils/dateFormat';
import { Pagination } from './Pagination';

interface ExcelDashboardProps {
  isLoading: boolean;
  onOpenImportForm?: () => void;
  onSelectCandidate: (id: number) => void;
  onDeleteCandidate?: (id: number) => void;
  onDownloadRirekisho: (id: number) => void;
  onDownloadTcmmxd: (id: number) => void;
  dbCandidates: Candidate[];
  selectedIds?: number[];
  setSelectedIds?: React.Dispatch<React.SetStateAction<number[]>>;
}

export function ExcelDashboard({
  isLoading,
  onOpenImportForm,
  onSelectCandidate,
  onDeleteCandidate,
  onDownloadRirekisho,
  dbCandidates,
  selectedIds = [],
  setSelectedIds
}: ExcelDashboardProps) {
  
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(d => {
        if (d.custom_field_defs) {
          try {
            setCustomFieldDefs(JSON.parse(d.custom_field_defs));
          } catch {
            setCustomFieldDefs([]);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Reset to page 1 if search term, pageSize, or candidates list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dbCandidates.length, pageSize]);

  if (isLoading) {
    return <div className="p-8 text-center font-bold">Đang tải dữ liệu...</div>;
  }

  if (dbCandidates.length === 0) {
    return (
      <div className="artistic-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-2xl font-extrabold mb-2 uppercase">Chưa Có Dữ Liệu</h2>
        <p className="text-[#555] font-medium mb-6">Hãy nạp hồ sơ từ Tờ đơn hoặc thêm mới ứng viên thủ công.</p>
      </div>
    );
  }

  const s = searchTerm.toLowerCase().trim();
  const filteredCandidates = dbCandidates.filter(c => 
    (c.full_name_vn || '').toLowerCase().includes(s) ||
    (c.profile_code || '').toLowerCase().includes(s) ||
    (c.full_name_katakana || '').toLowerCase().includes(s) ||
    (c.phone || '').includes(s) ||
    (c.custom_fields && Object.values(c.custom_fields).some(v => String(v).toLowerCase().includes(s)))
  );

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + pageSize);

  const isAllSelected = paginatedCandidates.length > 0 && paginatedCandidates.every(c => selectedIds.includes(c.id));

  const handleToggleSelectAll = () => {
    if (!setSelectedIds) return;
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
    if (!setSelectedIds) return;
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0 || !onDeleteCandidate) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} hồ sơ đã chọn khỏi hệ thống?`)) return;

    try {
      const res = await fetch('/api/candidates/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        selectedIds.forEach(id => onDeleteCandidate(id));
        if (setSelectedIds) setSelectedIds([]);
      }
    } catch {
      // Error handled silently
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white text-lg font-black flex-shrink-0">Σ</div>
          <div>
            <div className="text-3xl font-black leading-none">{dbCandidates.length}</div>
            <div className="text-[10px] font-bold text-[#666] uppercase tracking-widest mt-0.5">Tổng Hồ Sơ</div>
          </div>
        </div>
        <div className="bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A] rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-[#00B4D8]">
          <div className="w-10 h-10 rounded-lg bg-[#E0F7FF] flex items-center justify-center text-[#00B4D8] text-lg flex-shrink-0">✎</div>
          <div>
            <div className="text-3xl font-black leading-none text-[#00B4D8]">{dbCandidates.filter(c => c.status === 'draft').length}</div>
            <div className="text-[10px] font-bold text-[#666] uppercase tracking-widest mt-0.5">Nháp</div>
          </div>
        </div>
        <div className="bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A] rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-[#F59E0B]">
          <div className="w-10 h-10 rounded-lg bg-[#FFF8E1] flex items-center justify-center text-[#F59E0B] text-lg flex-shrink-0">⏳</div>
          <div>
            <div className="text-3xl font-black leading-none text-[#F59E0B]">{dbCandidates.filter(c => c.status === 'reviewing').length}</div>
            <div className="text-[10px] font-bold text-[#666] uppercase tracking-widest mt-0.5">Đang Xử Lý</div>
          </div>
        </div>
        <div className="bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A] rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-[#00C853]">
          <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] flex items-center justify-center text-[#00C853] text-lg flex-shrink-0">✓</div>
          <div>
            <div className="text-3xl font-black leading-none text-[#00C853]">{dbCandidates.filter(c => c.status === 'completed').length}</div>
            <div className="text-[10px] font-bold text-[#666] uppercase tracking-widest mt-0.5">Hoàn Thành</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-lg">
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
          {filteredCandidates.length !== dbCandidates.length && (
            <span className="text-xs font-bold text-[#FF4D00] whitespace-nowrap">
              {filteredCandidates.length} kết quả
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedIds.length > 0 && onDeleteCandidate && (
            <button
              onClick={handleBatchDelete}
              className="border-2 border-[#D32F2F] bg-[#FFF5F5] text-[#D32F2F] px-3 py-1.5 text-xs font-black uppercase rounded-lg
                flex items-center gap-1.5 hover:bg-[#D32F2F] hover:text-white transition-all
                shadow-[2px_2px_0_0_#D32F2F] active:scale-95"
            >
              <Trash2 size={14} /> Xóa ({selectedIds.length})
            </button>
          )}

          {onOpenImportForm && (
            <button
              type="button"
              onClick={onOpenImportForm}
              title="Import file Excel đơn điền hoặc tải mẫu tờ đơn"
              className="h-9 px-3 text-xs font-black rounded-lg border-2 border-[#1A1A1A] bg-[#FFD700] text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-[3px_3px_0_0_#1A1A1A] hover:bg-[#FFE033] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet size={14} />
              <span>Import Đơn</span>
            </button>
          )}

          <span className="text-xs text-[#999] font-medium hidden sm:block">
            {startIndex + 1}–{Math.min(startIndex + pageSize, filteredCandidates.length)} / {filteredCandidates.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="border-2 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)' }}>
              <tr>
                {setSelectedIds && (
                  <th className="px-3 py-3.5 border-r border-white/10 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-white/70 hover:text-[#FFD700] transition-colors"
                      title={isAllSelected ? 'Bỏ chọn cả trang' : 'Chọn cả trang'}
                    >
                      {isAllSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                    </button>
                  </th>
                )}
                <th className="px-3 py-3.5 font-black uppercase text-[10px] tracking-widest text-[#FFD700] border-r border-white/10 whitespace-nowrap">Mã HS</th>
                <th className="px-3 py-3.5 font-black uppercase text-[10px] tracking-widest text-white border-r border-white/10 whitespace-nowrap">Họ Tên (VN)</th>
                <th className="px-3 py-3.5 font-black uppercase text-[10px] tracking-widest text-white/70 border-r border-white/10 whitespace-nowrap">Katakana</th>
                <th className="px-3 py-3.5 font-black uppercase text-[10px] tracking-widest text-white/70 border-r border-white/10 whitespace-nowrap">Ngày Sinh</th>
                <th className="px-3 py-3.5 font-black uppercase text-[10px] tracking-widest text-white/70 border-r border-white/10 whitespace-nowrap">Giới Tính</th>
                {customFieldDefs.map(f => (
                  <th key={f.id} className="px-3 py-3.5 font-black uppercase text-[10px] tracking-widest text-[#FFD700] border-r border-white/10 whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
                <th className="px-3 py-3.5 font-black uppercase text-[10px] tracking-widest text-white/70 border-r border-white/10 whitespace-nowrap">Trạng Thái</th>
                <th className="px-3 py-3.5 font-black uppercase text-[10px] tracking-widest text-white/70 whitespace-nowrap text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#F0F0F0]">
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8 + customFieldDefs.length} className="py-16 text-center text-[#888] font-bold text-sm">
                    🔍 Không tìm thấy ứng viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((c, i) => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`cursor-pointer transition-all duration-100 ${
                        isSelected
                          ? 'bg-[#FFF2E0] border-l-2 border-l-[#FF4D00]'
                          : i % 2 === 0
                            ? 'bg-white hover:bg-[#FFF9F5]'
                            : 'bg-[#FAFAF5] hover:bg-[#FFF5EC]'
                      }`}
                      onClick={() => onSelectCandidate(c.id)}
                    >
                      {setSelectedIds && (
                        <td className="px-3 py-2.5 text-center border-r border-[#F0F0F0]" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={e => handleToggleSelect(c.id, e)}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 cursor-pointer accent-[#FF4D00] rounded"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2.5 font-mono font-black text-[#FF4D00] text-xs border-r border-[#F0F0F0] whitespace-nowrap">{c.profile_code || '---'}</td>
                      <td className="px-3 py-2.5 font-bold text-[#1A1A1A] border-r border-[#F0F0F0] whitespace-nowrap">{c.full_name_vn || '---'}</td>
                      <td className="px-3 py-2.5 text-[#555] text-[13px] border-r border-[#F0F0F0] whitespace-nowrap">{c.full_name_katakana || '---'}</td>
                      <td className="px-3 py-2.5 text-[#444] font-medium border-r border-[#F0F0F0] whitespace-nowrap tabular-nums">{formatDateVN(c.date_of_birth) || '---'}</td>
                      <td className="px-3 py-2.5 text-[#444] font-medium border-r border-[#F0F0F0] whitespace-nowrap">{c.gender || '---'}</td>
                      {customFieldDefs.map(f => (
                        <td key={f.id} className="px-3 py-2.5 font-medium border-r border-[#F0F0F0] whitespace-nowrap text-[#555]">
                          {c.custom_fields?.[f.id] || '---'}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 border-r border-[#F0F0F0] whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          c.status === 'completed'
                            ? 'bg-[#E8F5E9] text-[#1B8A3F] border-[#A5D6A7]'
                            : c.status === 'reviewing'
                              ? 'bg-[#FFF8E1] text-[#B8760A] border-[#FFE082]'
                              : 'bg-[#F5F5F5] text-[#555] border-[#DDD]'
                        }`}>
                          {c.status === 'completed' ? '● Hoàn thành' : c.status === 'reviewing' ? '◐ Xét duyệt' : '○ Nháp'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            title="Chỉnh sửa"
                            onClick={() => onSelectCandidate(c.id)}
                            className="p-1.5 border border-[#DDD] bg-white hover:bg-[#FFD700] hover:border-[#1A1A1A] rounded-lg text-[#444] transition-all"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            title="Xuất Rirekisho Excel"
                            onClick={() => onDownloadRirekisho(c.id)}
                            className="p-1.5 border border-[#DDD] bg-white hover:bg-[#E8F5E9] hover:border-[#00C853] rounded-lg text-[#444] hover:text-[#1B8A3F] transition-all"
                          >
                            <FileDown size={13} />
                          </button>
                          {onDeleteCandidate && (
                            <button
                              type="button"
                              title="Xóa hồ sơ"
                              onClick={() => onDeleteCandidate(c.id)}
                              className="p-1.5 border border-[#DDD] bg-white hover:bg-[#FFEBEE] hover:border-[#D32F2F] rounded-lg text-[#999] hover:text-[#D32F2F] transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredCandidates.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[15, 30, 50, 100]}
        itemLabel="hồ sơ"
      />
    </div>
  );
}
