import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { databases, client } from '../../lib/appwrite';
import { Query, ID, Permission, Role } from 'appwrite';
import { Loader2, Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../language/LanguageContext';
import { useAuth } from '../../auth/AuthContext';
import { needVerification } from '../../lib/verified';
import { needUnbanned } from '../../lib/banned';

const convosCol = () => import.meta.env.VITE_APPWRITE_CONVERSATIONS_COLLECTION_ID || 'conversations';
const msgsCol = () => import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';

export default function Messages() {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeId = params.get('cid') || null;

  const [convos, setConvos] = useState<any[]>([]);
  const [peerMap, setPeerMap] = useState<Record<string, any>>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [missing, setMissing] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

  // список диалогов
  useEffect(() => {
    if (!user || !dbId) { setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        const res = await databases.listDocuments(dbId, convosCol(), [
          Query.contains('participantIds', user.$id),
          Query.orderDesc('$updatedAt'),
          Query.limit(50),
        ]);
        if (!alive) return;
        setConvos(res.documents);
        // имена собеседников
        const peerIds = [...new Set(res.documents.flatMap((c: any) => (c.participantIds || []).filter((p: string) => p !== user.$id)))];
        if (peerIds.length > 0) {
          const usersCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
          if (usersCol) {
            try {
              const ures = await databases.listDocuments(dbId, usersCol, [Query.equal('userId', peerIds.slice(0, 50)), Query.limit(50)]);
              const map: Record<string, any> = {};
              ures.documents.forEach((d: any) => { map[d.userId || d.$id] = d; });
              if (alive) setPeerMap(map);
            } catch {}
          }
        }
      } catch (err: any) {
        if (err?.code === 404) setMissing(true);
        else console.warn('Convos load failed:', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  // realtime: новые сообщения подтягиваем живьём
  useEffect(() => {
    if (!dbId || !user) return;
    let unsub: (() => void) | null = null;
    try {
      const sub: any = client.subscribe(`databases.${dbId}.collections.${msgsCol()}.documents`, (ev: any) => {
        try {
          const doc = ev?.payload;
          if (doc && doc.conversationId === activeId) {
            setMessages(prev => (prev.some(m => m.$id === doc.$id) ? prev : [...prev, doc]));
          }
        } catch {}
      });
      unsub = () => { try { sub(); } catch {} };
    } catch {}
    return () => { if (unsub) unsub(); };
  }, [dbId, activeId]);

  // ветка активного диалога
  useEffect(() => {
    if (!activeId || !dbId) { setMessages([]); return; }
    let alive = true;
    (async () => {
      setThreadLoading(true);
      try {
        const res = await databases.listDocuments(dbId, msgsCol(), [
          Query.equal('conversationId', activeId),
          Query.orderAsc('$createdAt'),
          Query.limit(100),
        ]);
        if (alive) setMessages(res.documents);
      } catch (err: any) {
        if (err?.code === 404) setMissing(true);
      } finally {
        if (alive) setThreadLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [activeId, dbId]);

  useEffect(() => {
    try { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }, [messages, activeId]);

  const send = async () => {
    const text = draft.trim().slice(0, 1000);
    if (!text || !user || !activeId || sending) return;
    if (needVerification(user, t, language)) return;
    if (needUnbanned(profile, t, { commentsOnly: true })) return;
    setSending(true);
    try {
      const convo = convos.find(c => c.$id === activeId);
      const peerId = (convo?.participantIds || []).find((p: string) => p !== user.$id) || '';
      const perms = peerId
        ? [Permission.read(Role.user(user.$id)), Permission.read(Role.user(peerId)), Permission.delete(Role.user(user.$id))]
        : [Permission.read(Role.user(user.$id))];
      await databases.createDocument(dbId!, msgsCol(), ID.unique(), {
        conversationId: activeId,
        senderId: user.$id,
        text,
      }, perms);
      setDraft('');
      try {
        await databases.updateDocument(dbId!, convosCol(), activeId, { lastText: text.slice(0, 140) });
      } catch {}
      setConvos(prev => prev.map(c => (c.$id === activeId ? { ...c, lastText: text.slice(0, 140), $updatedAt: new Date().toISOString() } : c)));
    } catch (err: any) {
      alert('Error: ' + (err?.message || err));
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <MessageCircle className="w-12 h-12 text-slate-600 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">{language === 'ru' ? 'Сообщения' : 'Messages'}</h1>
        <p className="text-slate-400 text-sm">{language === 'ru' ? 'Войдите, чтобы переписываться.' : 'Sign in to chat.'}</p>
      </div>
    );
  }

  const active = convos.find(c => c.$id === activeId) || null;
  const activePeerId = active ? (active.participantIds || []).find((p: string) => p !== user.$id) : null;
  const activePeer = activePeerId ? peerMap[activePeerId] : null;

  return (
    <div className="max-w-5xl mx-auto px-0 sm:px-4 py-0 sm:py-6 pb-24 animate-in fade-in duration-300">
      <div className="flex border ice-border rounded-none sm:rounded-2xl overflow-hidden bg-white/[0.02] h-[calc(100dvh-220px)] sm:h-[70vh] min-h-[420px]">
        {/* список */}
        <div className={`${activeId ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 shrink-0 flex-col border-r ice-border`}>
          <div className="p-4 border-b ice-border font-bold text-white">{language === 'ru' ? 'Диалоги' : 'Chats'}</div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#70d6ff]" /></div>
            ) : missing ? (
              <div className="p-4 text-xs text-slate-500">
                {language === 'ru'
                  ? 'Создайте в Appwrite коллекции conversations (participantIds: String[], lastText: String 500) и messages (conversationId, senderId, text: String 1000).'
                  : 'Create Appwrite collections conversations and messages.'}
              </div>
            ) : convos.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                {language === 'ru' ? 'Пока пусто. Напишите автору с его канала.' : 'Empty yet. Message an author from their channel.'}
              </div>
            ) : convos.map(c => {
              const pid = (c.participantIds || []).find((p: string) => p !== user.$id);
              const peer = pid ? peerMap[pid] : null;
              return (
                <button
                  key={c.$id}
                  onClick={() => setParams({ cid: c.$id })}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${c.$id === activeId ? 'bg-[#70d6ff]/10' : 'hover:bg-white/5'}`}
                >
                  <img
                    src={peer?.avatar || peer?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(peer?.name || 'U')}&background=random`}
                    alt="" referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover bg-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{peer?.name || peer?.displayName || (language === 'ru' ? 'Пользователь' : 'User')}</div>
                    <div className="text-xs text-slate-500 truncate">{c.lastText || '…'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ветка */}
        <div className={`${activeId ? 'flex' : 'hidden sm:flex'} flex-1 flex-col min-w-0`}>
          {!active ? (
            <div className="flex-1 hidden sm:flex items-center justify-center text-slate-500 text-sm">
              {language === 'ru' ? 'Выберите диалог слева' : 'Select a chat'}
            </div>
          ) : (
            <>
              <div className="p-3 border-b ice-border flex items-center gap-3">
                <button onClick={() => setParams({})} className="sm:hidden p-2 -ml-1 text-slate-300 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
                <Link to={`/channel/${activePeerId || ''}`} className="font-bold text-white text-sm truncate hover:text-[#70d6ff]">
                  {activePeer?.name || activePeer?.displayName || (language === 'ru' ? 'Пользователь' : 'User')}
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
                {threadLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#70d6ff]" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-10">{language === 'ru' ? 'Напишите первым!' : 'Say hi first!'}</div>
                ) : messages.map(m => {
                  const mine = m.senderId === user.$id;
                  return (
                    <div key={m.$id} className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${mine ? 'self-end bg-[#70d6ff] text-black rounded-br-md' : 'self-start bg-white/10 text-white rounded-bl-md'}`}>
                      {m.text}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t ice-border flex gap-2">
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') send(); }}
                  placeholder={language === 'ru' ? 'Сообщение…' : 'Message…'}
                  maxLength={1000}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#70d6ff] placeholder:text-slate-500"
                />
                <button onClick={send} disabled={sending || !draft.trim()} className="p-2.5 bg-[#70d6ff] text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50 shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
