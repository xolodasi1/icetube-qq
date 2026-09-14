import type { Models } from 'appwrite';

export type BanBlock = 'banned' | 'muted-comments' | null;

interface MiniProfile {
  isBanned?: boolean;
  banUntil?: string | null;
  muteUntil?: string | null;
}

/** Активен ли полный бан (перманентный флаг или временный срок). */
export function isBanActive(profile: MiniProfile | null | undefined): boolean {
  if (!profile) return false;
  if ((profile as any).isBanned) return true;
  const until = (profile as any).banUntil;
  if (until) {
    try {
      if (new Date(until).getTime() > Date.now()) return true;
    } catch {}
  }
  return false;
}

/** Активен ли мут комментариев. */
export function isMuteActive(profile: MiniProfile | null | undefined): boolean {
  if (!profile) return false;
  const until = (profile as any).muteUntil;
  if (!until) return false;
  try {
    return new Date(until).getTime() > Date.now();
  } catch {
    return false;
  }
}

/**
 * Что заблокировано для пользователя.
 * 'banned' — всё (загрузка, комменты, лайки, подписки), 'muted-comments' — только комменты.
 */
export function banBlock(profile: MiniProfile | null | undefined): BanBlock {
  if (isBanActive(profile)) return 'banned';
  if (isMuteActive(profile)) return 'muted-comments';
  return null;
}

type T = (key: string) => string;

/** true = действие заблокировано (показывает alert). Вызывать после needVerification. */
export function needUnbanned(
  profile: MiniProfile | null | undefined,
  t: T,
  opts?: { commentsOnly?: boolean }
): boolean {
  const block = banBlock(profile);
  if (!block) return false;
  if (block === 'muted-comments' && !opts?.commentsOnly) return false;
  const msg =
    block === 'banned'
      ? t('ban_blocked_msg') !== 'ban_blocked_msg'
        ? t('ban_blocked_msg')
        : 'Your account is restricted by administration.'
      : t('mute_blocked_msg') !== 'mute_blocked_msg'
        ? t('mute_blocked_msg')
        : 'Comments are temporarily disabled for your account.';
  alert(msg);
  return true;
}

/** Подпись причины/срока для админки. */
export function banLabel(p: any, language: string): string {
  const ru = language === 'ru';
  if (p?.isBanned) return ru ? 'Бан навсегда' : 'Banned forever';
  if (p?.banUntil && new Date(p.banUntil).getTime() > Date.now())
    return (ru ? 'Бан до ' : 'Banned until ') + new Date(p.banUntil).toLocaleString();
  if (p?.muteUntil && new Date(p.muteUntil).getTime() > Date.now())
    return (ru ? 'Мут до ' : 'Muted until ') + new Date(p.muteUntil).toLocaleString();
  return '';
}
