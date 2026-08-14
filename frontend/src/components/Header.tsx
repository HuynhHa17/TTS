import { Keyboard, Plus, Upload, Download, Settings, Users, Table2, Settings as SettingsIcon } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: 'excel' | 'list' | 'add' | 'templates') => void;
  candidateCount: number;
  onOpenBatchExport: () => void;
  onOpenKhaiTtExport: () => void;
  onOpenGoogleSheetImport: () => void;
  onOpenShortcutsModal: () => void;
  onOpenExcelConfig: () => void;
  onOpenSettings: () => void;
  onOpenCustomFields: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  onOpenBatchExport,
  onOpenGoogleSheetImport,
  onOpenShortcutsModal,
  onOpenExcelConfig,
  onOpenSettings,
  onOpenCustomFields,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#F8F7F2] border-b-2 border-[#1A1A1A] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-[0_2px_0_0_#1A1A1A]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-2xl">🇯🇵</span>
          <span className="uppercase font-extrabold tracking-tight">TTS Master</span>
          <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-[#FF4D00] text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] rounded">PRO</span>
        </div>

        <nav className="hidden md:flex gap-2 p-1 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] rounded-lg">
          <button 
            onClick={() => setActiveTab('excel')}
            className={`px-3 py-1.5 text-sm font-bold rounded flex items-center gap-2 border-2 border-transparent transition-all ${activeTab === 'excel' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'text-[#555] hover:bg-[#FFD700] hover:text-[#1A1A1A] hover:border-[#1A1A1A] hover:shadow-[2px_2px_0_0_#1A1A1A]'}`}
          >
            <Table2 size={16} /> Excel
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 text-sm font-bold rounded flex items-center gap-2 border-2 border-transparent transition-all ${activeTab === 'list' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'text-[#555] hover:bg-[#FFD700] hover:text-[#1A1A1A] hover:border-[#1A1A1A] hover:shadow-[2px_2px_0_0_#1A1A1A]'}`}
          >
            <Users size={16} /> Danh Sách
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 text-sm font-bold rounded flex items-center gap-2 border-2 border-transparent transition-all ${activeTab === 'templates' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'text-[#555] hover:bg-[#FFD700] hover:text-[#1A1A1A] hover:border-[#1A1A1A] hover:shadow-[2px_2px_0_0_#1A1A1A]'}`}
          >
            <Settings size={16} /> Templates
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenGoogleSheetImport}
          className="artistic-btn-secondary px-3 py-2 text-sm flex items-center gap-2 rounded-md"
        >
          <Upload size={16} /> GSheet
        </button>

        <button
          onClick={onOpenExcelConfig}
          className="artistic-card-sm px-3 py-2 text-sm flex items-center gap-2 font-bold hover:bg-[#FFD700] transition-colors"
          title="Cấu hình & đồng bộ Excel"
        >
          📊 Excel
        </button>
        
        <button 
          onClick={onOpenBatchExport}
          className="artistic-btn-accent px-3 py-2 text-sm flex items-center gap-2 rounded-md"
        >
          <Download size={16} /> Export
        </button>

        <button 
          onClick={onOpenCustomFields}
          className="artistic-card-sm px-3 py-2 text-sm flex items-center gap-2 font-bold hover:bg-[#FFD700] transition-colors"
          title="Quản lý Trường/Cột tùy chỉnh"
        >
          <Plus size={16} /> Thêm Cột
        </button>

        <button 
          onClick={() => setActiveTab('add')}
          className="artistic-btn-primary px-3 py-2 text-sm flex items-center gap-2 rounded-md"
        >
          <Plus size={16} /> Thêm Mới
        </button>

        <button 
          onClick={onOpenShortcutsModal}
          className="ml-2 p-2 border-2 border-transparent text-[#555] hover:border-[#1A1A1A] hover:bg-white hover:shadow-[2px_2px_0_0_#1A1A1A] hover:text-[#1A1A1A] rounded-md transition-all"
          title="Phím tắt (Cmd/Ctrl + K)"
        >
          <Keyboard size={20} />
        </button>

        <button 
          onClick={onOpenSettings}
          className="p-2 border-2 border-transparent text-[#555] hover:border-[#1A1A1A] hover:bg-white hover:shadow-[2px_2px_0_0_#1A1A1A] hover:text-[#1A1A1A] rounded-md transition-all"
          title="Cài đặt hệ thống"
        >
          <SettingsIcon size={20} />
        </button>
      </div>
    </header>
  );
}
