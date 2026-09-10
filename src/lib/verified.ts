import type { Models } from 'appwrite';

type T = (key: string) => string;

/**
 * Проверяет, подтверждена ли почта. Возвращает true, если действие
 * нужно ЗАБЛОКИРОВАТЬ (показывает alert). Google-входы всегда verified.
 */
export function needVerification(
  user: Models.User<Models.Preferences> | null,
  t: T,
  language?: string
): boolean {
  if (!user) return false; // гости обрабатываются отдельно (просьба войти)
  if (user.emailVerification) return false;
  const ru = language === 'ru';
  alert(t('auth_verify_needed') !== 'auth_verify_needed' ? t('auth_verify_needed') : ru ? 'Подтвердите почту, чтобы продолжить. Ссылка отправлена на ваш email.' : 'Please verify your email to continue. A link was sent to your email.');
  return true;
}
