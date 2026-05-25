import { useState, useCallback, useEffect } from 'react';
import { Home, Sparkles, Star, History, Brain, Settings } from 'lucide-react';
import { GenerationResult, PageId, UserSettings } from './types';
import { loadSettings, saveSettings } from './utils/settings';
import HomePage from './pages/HomePage';
import TaskPage from './pages/TaskPage';
import TemplatePage from './pages/TemplatePage';
import HistoryPage from './pages/HistoryPage';
import AiConfigPage from './pages/AiConfigPage';
import SettingsPage from './pages/SettingsPage';
import { showToast } from './components/Toast';
import Toast from './components/Toast';

const NAV_ITEMS: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: '首页', icon: <Home size={16} /> },
  { id: 'tasks', label: '任务', icon: <Sparkles size={16} /> },
  { id: 'templates', label: '模板', icon: <Star size={16} /> },
  { id: 'history', label: '历史', icon: <History size={16} /> },
  { id: 'ai-config', label: 'AI 配置', icon: <Brain size={16} /> },
  { id: 'settings', label: '设置', icon: <Settings size={16} /> },
];

export default function App() {
  const [page, setPage] = useState<PageId>('home');
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  useEffect(() => { saveSettings(settings); }, [settings]);

  const handleToggleFavorite = useCallback((id: string) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, isFavorited: !r.isFavorited } : r)));
  }, []);

  const handleRemoveResult = useCallback((id: string) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
    showToast('已移除', 'success');
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage results={results} settings={settings} onNavigate={(p) => setPage(p)} />;
      case 'tasks':
        return (
          <TaskPage
            results={results}
            settings={settings}
            onResultsChange={setResults}
            onSettingsChange={setSettings}
            onNavigate={setPage}
          />
        );
      case 'templates':
        return (
          <TemplatePage
            results={results}
            onToggleFavorite={handleToggleFavorite}
            onRemove={handleRemoveResult}
          />
        );
      case 'history':
        return <HistoryPage />;
      case 'ai-config':
        return <AiConfigPage settings={settings} onSave={setSettings} />;
      case 'settings':
        return <SettingsPage settings={settings} onSave={setSettings} />;
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#F5F5F7] p-6 overflow-hidden">
      {/* macOS Window */}
      <div className="w-full h-full mac-window flex flex-col overflow-hidden" style={{ maxWidth: 1440 }}>
        {/* Title Bar */}
        <div className="mac-titlebar">
          <div className="flex items-center gap-2 w-[72px]">
            <div className="mac-dot close" />
            <div className="mac-dot minimize" />
            <div className="mac-dot maximize" />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="text-[13px] font-semibold text-[#1D1D1F]">商品主图 &amp; 文案生成</span>
          </div>
          <div className="w-[72px]" />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[#E5E5EA] bg-[#FBFBFB]">
          <button
            onClick={() => setPage('tasks')}
            className="mac-btn-secondary text-xs px-3 py-1.5 gap-1.5"
          >
            <Sparkles size={14} />
            新建
          </button>
          <div className="flex-1" />
        </div>

        {/* Sidebar + Content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="mac-sidebar w-[200px] shrink-0 p-3 flex flex-col gap-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`mac-sidebar-item ${page === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-5 overflow-y-auto bg-[#FBFBFB]">
            {renderPage()}
          </div>
        </div>
      </div>

      <Toast />
    </div>
  );
}
