import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error';
}

let listeners: ((m: ToastMessage) => void)[] = [];

export function showToast(text: string, type: 'success' | 'error' = 'success') {
  listeners.forEach(fn => fn({ id: Date.now().toString(), text, type }));
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const add = useCallback((m: ToastMessage) => setToasts(p => [...p, m]), []);

  useEffect(() => {
    listeners.push(add);
    return () => { listeners = listeners.filter(fn => fn !== add); };
  }, [add]);

  const remove = (id: string) => setToasts(p => p.filter(t => t.id !== id));

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none items-center">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [exit, setExit] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setExit(true); setTimeout(() => onRemove(toast.id), 200); }, 2600);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  return (
    <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg text-sm bg-white border transition-all duration-150"
      style={{
        borderColor: toast.type === 'success' ? '#28C840' : '#FF5F57',
        opacity: exit ? 0 : 1,
        transform: exit ? 'translateY(-8px)' : 'translateY(0)',
      }}>
      {toast.type === 'success'
        ? <CheckCircle size={16} color="#28C840" />
        : <XCircle size={16} color="#FF5F57" />}
      <span className="text-[13px] text-[#1D1D1F]">{toast.text}</span>
    </div>
  );
}
