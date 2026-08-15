import { useState, useEffect } from 'react';
import type { Candidate, CustomFieldDef } from '../types';
import { Search, ChevronLeft, ChevronRight, Trash2, FileDown, CheckSquare, Square, Edit } from 'lucide-react';
import { formatDateVN } from '../utils/dateFormat';

interface ExcelDashboardProps {
  isLoading: boolean;
  onOpenGoogleSheetImport: () => void;
  onSelectCandidate: (id: number) => void;
  onDeleteCandidate?: (id: number) => void;
  onDownloadRirekisho: (id: number) => void;
  onDownloadTcmmxd: (id: number) => void;
  dbCandidates: Candidate[];
  selectedIds?: number[];
  setSelectedIds?: React.Dispatch<React.SetStateAction<number[]>>;
}

const ITEMS_PER_PAGE = 15;

export function ExcelDashboard({
  isLoading,
  onOpenGoogleSheetImport,
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

  // Reset to page 1 if search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dbCandidates.length]);

  if (isLoading) {
    return <div className="p-8 text-center font-bold">Đang tải dữ liệu...</div>;
  }

  if (dbCandidates.length === 0) {
    return (
      <div className="artistic-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-2xl font-extrabold mb-2 uppercase">Chưa Có Dữ Liệu</h2>
        <p className="text-[#555] font-medium mb-6">Hãy import từ Google Sheets hoặc thêm mới thủ công.</p>
        <button onClick={onOpenGoogleSheetImport} className="artistic-btn-primary px-6 py-3 rounded-md flex items-center gap-2">
          Import Google Sheets
        </button>
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

  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="flex gap-4">
        <div className="artistic-card flex-1 p-4 flex flex-col items-start">
          <span className="text-4xl font-black">{dbCandidates.length}</span>
          <span className="text-xs font-bold text-[#555] uppercase tracking-wider">Tổng Hồ Sơ</span>
        </div>
        <div className="artistic-card flex-1 p-4 flex flex-col items-start border-t-4 border-t-[#00E5FF]">
          <span className="text-4xl font-black">{dbCandidates.filter(c => c.status === 'draft').length}</span>
          <span className="text-xs font-bold text-[#555] uppercase tracking-wider">Nháp</span>
        </div>
        <div className="artistic-card flex-1 p-4 flex flex-col items-start border-t-4 border-t-[#FFD700]">
          <span className="text-4xl font-black">{dbCandidates.filter(c => c.status === 'reviewing').length}</span>
          <span className="text-xs font-bold text-[#555] uppercase tracking-wider">Đang Xử Lý</span>
        </div>
        <div className="artistic-card flex-1 p-4 flex flex-col items-start border-t-4 border-t-[#00C853]">
          <span className="text-4xl font-black">{dbCandidates.filter(c => c.status === 'completed').length}</span>
          <span className="text-xs font-bold text-[#555] uppercase tracking-wider">Hoàn Thành</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên, mã HS, Katakana, SĐT..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="artistic-input w-full py-2.5 pl-10 pr-4 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && onDeleteCandidate && (
            <button
              onClick={handleBatchDelete}
              className="border-2 border-[#D32F2F] bg-[#FFF5F5] text-[#D32F2F] px-4 py-2 text-xs font-black uppercase rounded
                flex items-center gap-1.5 hover:bg-[#D32F2F] hover:text-white transition-all
                shadow-[2px_2px_0_0_#D32F2F] hover:shadow-[3px_3px_0_0_#D32F2F] active:scale-95"
            >
              <Trash2 size={15} /> Xóa ({selectedIds.length}) Đã Chọn
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="artistic-card overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-[#1A1A1A] text-white sticky top-0 z-10">
              <tr>
                {setSelectedIds && (
                  <th className="p-3 border-r border-white/20 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-white hover:text-[#FFD700] transition-colors"
                      title={isAllSelected ? 'Bỏ chọn cả trang' : 'Chọn cả trang'}
                    >
                      {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                )}
                <th className="p-3 font-extrabold uppercase text-xs border-r border-white/20 whitespace-nowrap">Mã HS</th>
                <th className="p-3 font-extrabold uppercase text-xs border-r border-white/20 whitespace-nowrap">Họ Tên (VN)</th>
                <th className="p-3 font-extrabold uppercase text-xs border-r border-white/20 whitespace-nowrap">Katakana</th>
                <th className="p-3 font-extrabold uppercase text-xs border-r border-white/20 whitespace-nowrap">Ngày Sinh</th>
                <th className="p-3 font-extrabold uppercase text-xs border-r border-white/20 whitespace-nowrap">Giới Tính</th>
                {customFieldDefs.map(f => (
                  <th key={f.id} className="p-3 font-extrabold uppercase text-xs border-r border-white/20 whitespace-nowrap text-[#FFD700]">
                    {f.label}
                  </th>
                ))}
                <th className="p-3 font-extrabold uppercase text-xs border-r border-white/20 whitespace-nowrap">Trạng Thái</th>
                <th className="p-3 font-extrabold uppercase text-xs whitespace-nowrap text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8 + customFieldDefs.length} className="p-8 text-center text-[#555] font-bold">
                    Không tìm thấy ứng viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((c, i) => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <tr 
                      key={c.id} 
                      className={`border-b-2 border-[#F0F0F0] hover:bg-[#FFF9F0] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#FFF2E0]' : i % 2 === 0 ? 'bg-[#FAFAF5]' : ''
                      }`}
                      onClick={() => onSelectCandidate(c.id)}
                    >
                      {setSelectedIds && (
                        <td className="p-3 text-center border-r-2 border-[#F0F0F0]" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={e => handleToggleSelect(c.id, e)}
                            onChange={() => {}}
                            className="w-4 h-4 cursor-pointer accent-[#FF4D00] rounded"
                          />
                        </td>
                      )}
                      <td className="p-3 font-mono font-bold text-[#FF4D00] border-r-2 border-[#F0F0F0] whitespace-nowrap">{c.profile_code || '---'}</td>
                      <td className="p-3 font-bold border-r-2 border-[#F0F0F0] whitespace-nowrap">{c.full_name_vn || '---'}</td>
                      <td className="p-3 text-[#555] border-r-2 border-[#F0F0F0] whitespace-nowrap">{c.full_name_katakana || '---'}</td>
                      <td className="p-3 font-medium border-r-2 border-[#F0F0F0] whitespace-nowrap">{formatDateVN(c.date_of_birth) || '---'}</td>
                      <td className="p-3 font-medium border-r-2 border-[#F0F0F0] whitespace-nowrap">{c.gender || '---'}</td>
                      {customFieldDefs.map(f => (
                        <td key={f.id} className="p-3 font-medium border-r-2 border-[#F0F0F0] whitespace-nowrap text-[#555]">
                          {c.custom_fields?.[f.id] || '---'}
                        </td>
                      ))}
                      <td className="p-3 border-r-2 border-[#F0F0F0] whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border-2 border-[#1A1A1A] shadow-[1.5px_1.5px_0_0_#1A1A1A] uppercase
                          ${c.status === 'completed' ? 'bg-[#00C853] text-white' : 
                            c.status === 'reviewing' ? 'bg-[#FFD700] text-[#1A1A1A]' : 
                            'bg-[#E0E0E0] text-[#1A1A1A]'}`}>
                          {c.status || 'Draft'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="Chỉnh sửa"
                            onClick={() => onSelectCandidate(c.id)}
                            className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#FFD700] rounded text-[#1A1A1A] transition-colors"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            title="Xuất Rirekisho"
                            onClick={() => onDownloadRirekisho(c.id)}
                            className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#FFD700] rounded text-[#1A1A1A] transition-colors"
                          >
                            <FileDown size={13} />
                          </button>
                          {onDeleteCandidate && (
                            <button
                              type="button"
                              title="Xóa hồ sơ"
                              onClick={() => onDeleteCandidate(c.id)}
                              className="p-1.5 border border-[#D32F2F] bg-[#FFF5F5] hover:bg-[#D32F2F] hover:text-white rounded text-[#D32F2F] transition-colors"
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
      <div className="flex justify-center items-center gap-4 mt-6">
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
