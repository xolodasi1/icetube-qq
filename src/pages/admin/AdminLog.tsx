import React, { useEffect, useState } from 'react';
import { History, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';

const ACTION_STYLE: Record<string, string> = {
  'video.delete': 'text-red-400 bg-red-500/10 border-red-500/20',
  'video.hide': 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  'video.autohide': 'text-orange-300 bg-orange-500/10 border-orange-500/20',
  'user.ban': 'text-red-400 bg-red-500/10 border-red-500/20',
  'user.unban': 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
};

export default function AdminLogSection({ language }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    setMissing(false);
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const logsCol = import.meta.env.VITE_APPWRITE_ADMIN_LOGS_COLLECTION_ID || 'admin_logs';
      if (!dbId) { setIsLoading(false); return; }
      const res = await databases.listDocuments(dbId, logsCol, [Query.orderDesc('$createdAt'), Query.limit(100)]);
      setLogs(res.documents);
    } catch (err: any) {
      if (err?.code === 404) setMissing(true);
      else console.warn('Admin logs fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase italic tracking-tighter flex items-center gap-2">
            <History className="w-6 h-6 text-[#70d6ff]" />
            {language === 'ru' ? 'Журнал действий' : 'Audit Log'}
          </h1>
          <p className="text-sm text-slate-400">{language === 'ru' ? 'Кто из админов что делал. Последние 100.' : 'Who did what. Last 100.'}</p>
        </div>
        <button onClick={fetchLogs} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {missing ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-sm text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <b>Appwrite → Databases → IcetubeDB → + Create collection:</b> ID <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">admin_logs</code>, attributes:
            <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">action</code> (String 100),
            <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">target</code> (String 100),
            <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">targetName</code> (String 255),
            <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">details</code> (String 1000),
            <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">adminId</code> (String 100),
            <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">adminName</code> (String 255).
            {language === 'ru' ? ' Действия начнут записываться после создания.' : ' Actions will be recorded after creation.'}
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#70d6ff]" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-slate-500 text-xs font-bold uppercase tracking-widest">{language === 'ru' ? 'Пока пусто' : 'Empty yet'}</div>
      ) : (
        <div className="bg-white/5 border ice-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b ice-border">
                <tr>
                  <th className="px-4 py-4">{language === 'ru' ? 'Время' : 'Time'}</th>
                  <th className="px-4 py-4">{language === 'ru' ? 'Админ' : 'Admin'}</th>
                  <th className="px-4 py-4">{language === 'ru' ? 'Действие' : 'Action'}</th>
                  <th className="px-4 py-4">{language === 'ru' ? 'Объект' : 'Target'}</th>
                  <th className="px-4 py-4">{language === 'ru' ? 'Детали' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {logs.map((l: any) => (
                  <tr key={l.$id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{l.$createdAt ? new Date(l.$createdAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-white whitespace-nowrap">{l.adminName || l.adminId || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-[10px] font-black font-mono border ${ACTION_STYLE[l.action] || 'bg-white/5 text-slate-300 border-white/10'}`}>{l.action || '—'}</span></td>
                    <td className="px-4 py-3 text-xs truncate max-w-[220px]" title={l.target}>{l.targetName || l.target || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 truncate max-w-[260px]" title={l.details}>{l.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
