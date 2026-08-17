import { Keyboard, Plus, Download, Users, Table2, Settings as SettingsIcon, FileSpreadsheet, RefreshCw, SlidersHorizontal, LayoutTemplate, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: 'excel' | 'list' | 'add' | 'templates') => void;
  candidateCount: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenBatchExport: () => void;
  onOpenKhaiTtExport: () => void;
  onOpenImportForm: () => void;
  onOpenShortcutsModal: () => void;
  onOpenExcelConfig: () => void;
  onOpenSettings: () => void;
  onOpenCustomFields: () => void;
  onOpenExcel: () => void;
  onReloadFromExcel: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  theme = 'light',
  onToggleTheme,
  onOpenBatchExport,
  onOpenImportForm,
  onOpenShortcutsModal,
  onOpenExcelConfig,
  onOpenSettings,
  onOpenCustomFields,
  onOpenExcel,
  onReloadFromExcel,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#F8F7F2] border-b-2 border-[#1A1A1A] px-4 sm:px-6 py-2.5 shadow-[0_2px_0_0_#1A1A1A]">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand & Logo */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center font-black text-sm border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#FF4D00]">
            JP
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base tracking-tight uppercase text-[#1A1A1A]">
              TTS Master
            </span>
            <span className="text-[10px] font-black px-1.5 py-0.5 bg-[#FF4D00] text-white border border-[#1A1A1A] shadow-[1.5px_1.5px_0_0_#1A1A1A] rounded">
              PRO
            </span>
          </div>
        </div>

        {/* Center: Symmetrical Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] rounded-xl">
          <button 
            onClick={() => setActiveTab('excel')}
            className={`h-8 px-3.5 text-xs font-black rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'excel' 
                ? 'bg-[#1A1A1A] text-white shadow-[1px_1px_0_0_#555]' 
                : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#F5F5F0]'
            }`}
          >
            <Table2 size={14} />
            <span>Excel</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('list')}
            className={`h-8 px-3.5 text-xs font-black rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'list' 
                ? 'bg-[#1A1A1A] text-white shadow-[1px_1px_0_0_#555]' 
                : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#F5F5F0]'
            }`}
          >
            <Users size={14} />
            <span>Danh Sách</span>
          </button>

          <button 
            onClick={() => setActiveTab('templates')}
            className={`h-8 px-3.5 text-xs font-black rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'templates' 
                ? 'bg-[#1A1A1A] text-white shadow-[1px_1px_0_0_#555]' 
                : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#F5F5F0]'
            }`}
          >
            <LayoutTemplate size={14} />
            <span>Templates</span>
          </button>
        </nav>

        {/* Right: Balanced Action Groups */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Group 1: Sync & Excel Tools */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A]">
            <button
              onClick={onOpenExcel}
              className="h-8 px-2.5 text-xs font-black rounded-lg flex items-center gap-1.5 bg-[#E8F5E9] text-[#1B8A3F] hover:bg-[#4CAF50] hover:text-white transition-all"
              title="Mở file Excel trực tiếp"
            >
              <FileSpreadsheet size={13} />
              <span>Mở Excel</span>
            </button>

            <button
              onClick={onReloadFromExcel}
              className="h-8 px-2.5 text-xs font-black rounded-lg flex items-center gap-1.5 bg-[#E3F2FD] text-[#1976D2] hover:bg-[#2196F3] hover:text-white transition-all"
              title="Đồng bộ ngược Excel → Database"
            >
              <RefreshCw size={13} />
              <span>Reload</span>
            </button>

            <button
              onClick={onOpenExcelConfig}
              className="h-8 px-2 text-xs font-black rounded-lg flex items-center gap-1 text-[#666] hover:text-[#1A1A1A] hover:bg-[#F0F0F0] transition-all"
              title="Cấu hình đường dẫn & đồng bộ Excel"
            >
              <SlidersHorizontal size={13} />
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-[1.5px] h-6 bg-[#1A1A1A]/15 mx-0.5" />

          {/* Group 2: Output & Customization */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={onOpenImportForm}
              className="h-9 px-3 text-xs font-black rounded-lg flex items-center gap-1.5 border-2 border-[#1A1A1A] bg-[#FFD700] text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-[3px_3px_0_0_#1A1A1A] hover:bg-[#FFE033] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all"
              title="Import file Excel đơn điền của ứng viên hoặc tải mẫu tờ đơn"
            >
              <FileSpreadsheet size={14} />
              <span>Import Đơn</span>
            </button>

            <button 
              onClick={onOpenBatchExport}
              className="h-9 px-3 text-xs font-black rounded-lg flex items-center gap-1.5 border-2 border-[#1A1A1A] bg-[#00E5FF] text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-[3px_3px_0_0_#1A1A1A] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all"
              title="Xuất file hồ sơ, PDF và Excel"
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            <button 
              onClick={onOpenCustomFields}
              className="h-9 px-3 text-xs font-black rounded-lg flex items-center gap-1.5 border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-[3px_3px_0_0_#1A1A1A] hover:bg-[#FFD700] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all"
              title="Quản lý các cột / trường thông tin tùy chỉnh"
            >
              <Plus size={14} />
              <span>Thêm Cột</span>
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-[1.5px] h-6 bg-[#1A1A1A]/15 mx-0.5" />

          {/* Group 3: Primary CTA */}
          <button 
            onClick={() => setActiveTab('add')}
            className="h-9 px-3.5 text-xs font-black rounded-lg flex items-center gap-1.5 border-2 border-[#1A1A1A] bg-[#FF4D00] text-white shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-[3px_3px_0_0_#1A1A1A] hover:bg-[#E64500] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#1A1A1A] transition-all"
            title="Thêm mới một hồ sơ ứng viên (Ctrl + N)"
          >
            <Plus size={14} />
            <span>Thêm Mới</span>
          </button>

          {/* Divider */}
          <div className="hidden sm:block w-[1.5px] h-6 bg-[#1A1A1A]/15 mx-0.5" />

          {/* Group 4: Quick Utilities */}
          <div className="flex items-center gap-1">
            {/* Sáng / Tối (Theme Switcher) */}
            {onToggleTheme && (
              <button 
                onClick={onToggleTheme}
                className="w-9 h-9 rounded-lg border-2 border-transparent text-[#666] hover:text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-white hover:shadow-[2px_2px_0_0_#1A1A1A] flex items-center justify-center transition-all"
                title={theme === 'dark' ? 'Chuyển sang Chế độ Sáng (Light Mode)' : 'Chuyển sang Chế độ Tối (Dark Mode)'}
              >
                {theme === 'dark' ? <Sun size={17} className="text-[#FFD700]" /> : <Moon size={17} />}
              </button>
            )}

            <button 
              onClick={onOpenShortcutsModal}
              className="w-9 h-9 rounded-lg border-2 border-transparent text-[#666] hover:text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-white hover:shadow-[2px_2px_0_0_#1A1A1A] flex items-center justify-center transition-all"
              title="Phím tắt nhanh (Ctrl + K)"
            >
              <Keyboard size={17} />
            </button>

            <button 
              onClick={onOpenSettings}
              className="w-9 h-9 rounded-lg border-2 border-transparent text-[#666] hover:text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-white hover:shadow-[2px_2px_0_0_#1A1A1A] flex items-center justify-center transition-all"
              title="Cài đặt hệ thống & API Key"
            >
              <SettingsIcon size={17} />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}

