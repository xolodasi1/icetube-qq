import React, { useState } from 'react';
import { MailWarning, X, RefreshCw, Send } from 'lucide-react';
import { account } from '../lib/appwrite';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../language/LanguageContext';
import { SafeStorage } from '../lib/storage';

export default function EmailVerifyBanner() {
  const { user, checkUserStatus } = useAuth();
  const { t, language } = useLanguage();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return SafeStorage.get('verify_banner_dismissed', '') === new Date().toDateString();
    } catch {
      return false;
    }
  });

  if (!user || user.emailVerification || dismissed) return null;

  const resend = async () => {
    if (sending) return;
    setSending(true);
    try {
      await account.createVerification(`${window.location.origin}/verify`);
      setSent(true);
    } catch (err: any) {
      console.error('Resend verification failed:', err);
      alert(err?.message || t('auth_auth_failed'));
    } finally {
      setSending(false);
    }
  };

  const dismiss = () => {
    try {
      SafeStorage.set('verify_banner_dismissed', new Date().toDateString());
    } catch {}
    setDismissed(true);
  };

  return (
    <div className="mx-auto max-w-[2000px] px-0 sm:px-4 lg:px-6 xl:px-8 pt-2">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-none sm:rounded-xl bg-amber-500/10 border-y sm:border border-amber-400/30 text-sm">
        <MailWarning className="w-4 h-4 text-amber-300 shrink-0" />
        <p className="flex-1 min-w-0 text-amber-100/90 text-xs sm:text-sm truncate sm:whitespace-normal">
          {t('auth_verify_banner')}
        </p>
        <button
          onClick={resend}
          disabled={sending || sent}
          className="shrink-0 flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-100 text-xs font-bold transition-colors disabled:opacity-60"
        >
          {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sent ? t('auth_verify_sent') : t('auth_verify_resend')}
        </button>
        <button
          onClick={() => checkUserStatus().catch(() => null)}
          className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition-colors"
          title={language === 'ru' ? 'Я уже подтвердил' : 'I already verified'}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button onClick={dismiss} className="shrink-0 p-1 text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
