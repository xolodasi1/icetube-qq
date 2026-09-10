import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, MailCheck } from 'lucide-react';
import { account } from '../../lib/appwrite';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../language/LanguageContext';

export default function Verify() {
  const [params] = useSearchParams();
  const { checkUserStatus } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'working' | 'ok' | 'fail'>('working');

  useEffect(() => {
    (async () => {
      const userId = params.get('userId') || '';
      const secret = params.get('secret') || '';
      if (!userId || !secret) {
        setStatus('fail');
        return;
      }
      try {
        await account.updateVerification(userId, secret);
        await checkUserStatus().catch(() => null);
        setStatus('ok');
      } catch (err) {
        console.error('Verification failed:', err);
        setStatus('fail');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-in fade-in duration-300">
      {status === 'working' && (
        <>
          <Loader2 className="w-12 h-12 animate-spin text-[#70d6ff] mb-4" />
          <p className="text-slate-300">{t('auth_please_wait')}</p>
        </>
      )}
      {status === 'ok' && (
        <>
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{t('auth_verify_success')}</h1>
          <p className="text-slate-400 text-sm mb-6 max-w-md">{t('auth_verify_success_desc')}</p>
          <Link to="/" className="px-6 py-2.5 bg-[#70d6ff] text-black font-bold rounded-xl hover:bg-[#5bc0e6] transition-colors">
            {t('studio_back_home')}
          </Link>
        </>
      )}
      {status === 'fail' && (
        <>
          <XCircle className="w-16 h-16 text-red-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{t('auth_verify_fail')}</h1>
          <p className="text-slate-400 text-sm mb-6 max-w-md">{t('auth_verify_fail_desc')}</p>
          <MailCheck className="w-5 h-5 text-slate-500 mb-4" />
          <Link to="/" className="px-6 py-2.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
            {t('studio_back_home')}
          </Link>
        </>
      )}
    </div>
  );
}
