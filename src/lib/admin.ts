import { databases } from './appwrite';
import type { Models } from 'appwrite';

export const OWNER_EMAIL = 'xolodtop889@gmail.com';

export type StaffRole = 'proprietor' | 'admin' | 'moderator' | 'user';

export function getStaffRole(
  user: Models.User<Models.Preferences> | null,
  profile: { role?: string } | null
): StaffRole {
  if (!user) return 'user';
  if (user.email === OWNER_EMAIL) return 'proprietor';
  const r = (profile?.role || '').toLowerCase();
  if (r === 'proprietor' || r === 'admin' || r === 'moderator') return r as StaffRole;
  return 'user';
}

export function isStaff(user: any, profile: any): boolean {
  return getStaffRole(user, profile) !== 'user';
}

export function isAdminPlus(user: any, profile: any): boolean {
  const r = getStaffRole(user, profile);
  return r === 'proprietor' || r === 'admin';
}

/** Какие вкладки админки доступны роли. Модератор — только операционка. */
export function allowedTabs(role: StaffRole): string[] {
  if (role === 'moderator') return ['dashboard', 'reports', 'content', 'moderation'];
  return ['dashboard', 'analytics', 'users', 'reports', 'content', 'moderation', 'manage', 'log'];
}

export interface AdminLogInput {
  action: string;
  target?: string;
  targetName?: string;
  details?: string;
}

/**
 * Запись в журнал действий админов (коллекция admin_logs).
 * Возвращает { ok:false, missing:true }, если коллекции нет — тогда UI покажет инструкцию.
 */
export async function logAdminAction(
  admin: Models.User<Models.Preferences> | null,
  input: AdminLogInput
): Promise<{ ok: boolean; missing?: boolean }> {
  try {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const logsCol = import.meta.env.VITE_APPWRITE_ADMIN_LOGS_COLLECTION_ID || 'admin_logs';
    if (!dbId) return { ok: false, missing: true };
    const { ID } = await import('appwrite');
    await databases.createDocument(dbId, logsCol, ID.unique(), {
      action: input.action,
      target: input.target || '',
      targetName: input.targetName || '',
      details: input.details || '',
      adminId: admin?.$id || '',
      adminName: (admin as any)?.name || admin?.email || 'unknown',
    });
    return { ok: true };
  } catch (err: any) {
    if (err?.code === 404) return { ok: false, missing: true };
    console.warn('Admin log write failed:', err);
    return { ok: false };
  }
}
