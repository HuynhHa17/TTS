import { useEffect, useState } from 'react';
import { BatchExportModal } from './components/BatchExportModal';
import { CandidateEditor } from './components/CandidateEditor';
import { CandidateList } from './components/CandidateList';
import { ExcelDashboard } from './components/ExcelDashboard';
import { ExcelConfigModal } from './components/ExcelConfigModal';
import { GoogleSheetImportModal } from './components/GoogleSheetImportModal';
import { Header } from './components/Header';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { TemplateManagerModal } from './components/TemplateManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { CustomFieldsModal } from './components/CustomFieldsModal';
import type { Candidate, FullCandidateProfile } from './types';

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'excel' | 'list' | 'add' | 'templates'>('excel');
  const [selectedCandidateProfile, setSelectedCandidateProfile] = useState<FullCandidateProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isGoogleSheetImportOpen, setIsGoogleSheetImportOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isExcelConfigOpen, setIsExcelConfigOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Global Keyboard Event Listeners for Power Users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Esc key closes modals in order
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          e.preventDefault();
          return;
        }
        if (isBatchModalOpen) {
          setIsBatchModalOpen(false);
          e.preventDefault();
          return;
        }
        if (isGoogleSheetImportOpen) {
          setIsGoogleSheetImportOpen(false);
          e.preventDefault();
          return;
        }
      }

      // Cmd/Ctrl + K: Toggle Keyboard Shortcuts Modal
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
        return;
      }

      // Cmd/Ctrl + N: Open Add Candidate view
      if (isMod && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setSelectedCandidateProfile(null);
        setActiveTab('add');
        return;
      }

      // Cmd/Ctrl + B: Open Batch Export modal
      if (isMod && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsBatchModalOpen(prev => !prev);
        return;
      }

      // Cmd/Ctrl + I: Open Google Sheet Import modal
      if (isMod && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setIsGoogleSheetImportOpen(prev => !prev);
        return;
      }

      // Cmd/Ctrl + 1: Switch to Excel Tab
      if (isMod && e.key === '1') {
        e.preventDefault();
        setActiveTab('excel');
        return;
      }

      // Cmd/Ctrl + 2: Switch to Candidate List Tab
      if (isMod && e.key === '2') {
        e.preventDefault();
        setActiveTab('list');
        return;
      }

      // Cmd/Ctrl + 3: Switch to Add Candidate Tab
      if (isMod && e.key === '3') {
        e.preventDefault();
        setSelectedCandidateProfile(null);
        setActiveTab('add');
        return;
      }

      // Cmd/Ctrl + 4: Switch to Template Manager Tab
      if (isMod && e.key === '4') {
        e.preventDefault();
        setActiveTab('templates');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsModalOpen, isBatchModalOpen, isGoogleSheetImportOpen]);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/candidates');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCandidates(data);
        } else if (data && Array.isArray(data.data)) {
          setCandidates(data.data);
        } else {
          setCandidates([]);
        }
      }
    } catch (e) {
      console.error('Error fetching candidates:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCandidate = async (id: number) => {
    try {
      const res = await fetch(`/api/candidates/${id}`);
      if (res.ok) {
        const profile = await res.json();
        setSelectedCandidateProfile(profile);
        setActiveTab('add'); // opens editor
      }
    } catch (e) {
      console.error('Error fetching full profile:', e);
    }
  };

  const handleAddNewCandidate = () => {
    setSelectedCandidateProfile(null); // clears editor to blank
    setActiveTab('add');
  };

  const handleSaveCandidate = async (profileData: FullCandidateProfile) => {
    try {
      const isExisting = profileData.candidate.id && profileData.candidate.id > 0;
      const url = isExisting ? `/api/candidates/${profileData.candidate.id}` : '/api/candidates';
      const method = isExisting ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        const saved = await res.json();
        alert('Lưu hồ sơ thành công vào SQLite Engine!');
        fetchCandidates();
        setSelectedCandidateProfile(saved);
        setActiveTab('list');
      } else {
        alert('Có lỗi xảy ra khi lưu hồ sơ.');
      }
    } catch (e) {
      console.error(e);
      alert('Không thể kết nối đến server backend.');
    }
  };

  const handleDeleteCandidate = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ ứng viên này khỏi SQLite?')) return;
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCandidates();
        if (selectedCandidateProfile?.candidate.id === id) {
          setSelectedCandidateProfile(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadRirekisho = (candidateId: number) => {
    window.open(`/api/documents/rirekisho/${candidateId}`, '_blank');
  };

  const handleDownloadTcmmxd = (candidateId: number) => {
    window.open(`/api/documents/tcmmxd/${candidateId}`, '_blank');
  };

  const handleDownloadKhaiTtMaster = () => {
    window.open('/api/documents/khai-tt', '_blank');
  };

  const handleTriggerBatchExportZip = async (ids: number[], templates: string[]) => {
    try {
      const res = await fetch('/api/documents/batch-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_ids: ids, templates }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Export_Hoso_TTS_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('Lỗi xuất file ZIP.');
      }
    } catch (e) {
      console.error(e);
      alert('Không thể tải tập tin ZIP.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] font-sans text-[#1A1A1A] antialiased selection:bg-[#FF4D00] selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'add') {
            setSelectedCandidateProfile(null);
          }
          setActiveTab(tab);
        }}
        candidateCount={candidates.length}
        onOpenBatchExport={() => setIsBatchModalOpen(true)}
        onOpenKhaiTtExport={handleDownloadKhaiTtMaster}
        onOpenGoogleSheetImport={() => setIsGoogleSheetImportOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenExcelConfig={() => setIsExcelConfigOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCustomFields={() => setIsCustomFieldsOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'excel' && (
          <ExcelDashboard
            isLoading={isLoading}
            onOpenGoogleSheetImport={() => setIsGoogleSheetImportOpen(true)}
            onSelectCandidate={handleSelectCandidate}
            onDownloadRirekisho={handleDownloadRirekisho}
            onDownloadTcmmxd={handleDownloadTcmmxd}
            dbCandidates={candidates}
          />
        )}

        {activeTab === 'list' && (
          <CandidateList
            candidates={candidates}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onSelectCandidate={handleSelectCandidate}
            onAddNew={handleAddNewCandidate}
            onOpenGoogleSheetImport={() => setIsGoogleSheetImportOpen(true)}
            onDeleteCandidate={handleDeleteCandidate}
            onDownloadRirekisho={handleDownloadRirekisho}
            onDownloadTcmmxd={handleDownloadTcmmxd}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'add' && (
          <CandidateEditor
            profile={selectedCandidateProfile}
            onSave={handleSaveCandidate}
            onBack={() => setActiveTab('list')}
            onDownloadRirekisho={handleDownloadRirekisho}
            onDownloadTcmmxd={handleDownloadTcmmxd}
          />
        )}

        {activeTab === 'templates' && <TemplateManagerModal />}
      </main>

      {/* Batch Export Modal */}
      <BatchExportModal
        candidates={candidates}
        selectedIds={selectedIds}
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onTriggerBatchExport={handleTriggerBatchExportZip}
      />

      {/* Google Sheets Import Staging Modal */}
      <GoogleSheetImportModal
        isOpen={isGoogleSheetImportOpen}
        onClose={() => setIsGoogleSheetImportOpen(false)}
        onImportComplete={() => fetchCandidates()}
      />

      {/* Excel Config Modal */}
      <ExcelConfigModal
        isOpen={isExcelConfigOpen}
        onClose={() => setIsExcelConfigOpen(false)}
        onImportComplete={() => { fetchCandidates(); setIsExcelConfigOpen(false); }}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Custom Fields Modal */}
      <CustomFieldsModal
        isOpen={isCustomFieldsOpen}
        onClose={() => setIsCustomFieldsOpen(false)}
      />

    </div>
  );
}
