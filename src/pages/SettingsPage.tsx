import { UserSettings } from '../types';
import { FolderOpen, RefreshCw } from 'lucide-react';
import { showToast } from '../components/Toast';

interface Props {
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
}

let dirHandleCache: FileSystemDirectoryHandle | null = null;

export default function SettingsPage({ settings, onSave }: Props) {
  const handleSelectFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        showToast('当前浏览器不支持文件夹选择，请使用 Chrome 或 Edge', 'error');
        return;
      }
      const handle = await (window as any).showDirectoryPicker();
      dirHandleCache = handle;
      onSave({ ...settings, savePath: handle.name });
      showToast(`已选择文件夹: ${handle.name}`, 'success');
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        showToast('选择文件夹失败', 'error');
      }
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1D1D1F]">设置</h1>
      </div>

      {/* Save Path */}
      <div className="mac-card p-4">
        <h3 className="text-[13px] font-semibold text-[#1D1D1F] mb-3">自定义保存路径</h3>

        {settings.savePath ? (
          <div className="flex items-center justify-between bg-[#F2F2F7] rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen size={16} className="text-[#007AFF] shrink-0" />
              <span className="text-[13px] text-[#1D1D1F] truncate">{settings.savePath}</span>
            </div>
            <button onClick={handleSelectFolder} className="mac-btn-secondary text-xs px-2.5 py-1 shrink-0 ml-2">
              更改
            </button>
          </div>
        ) : (
          <button
            onClick={handleSelectFolder}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#D2D2D7] rounded-lg px-4 py-6 text-[13px] text-[#86868B] hover:border-[#007AFF] hover:text-[#007AFF] transition-colors"
          >
            <FolderOpen size={18} />
            点击选择保存文件夹
          </button>
        )}

        <p className="text-[10px] text-[#86868B] mt-1">选择下载文件保存的目录</p>
      </div>

      <p className="text-[11px] text-[#86868B] text-center">设置自动保存</p>
    </div>
  );
}
