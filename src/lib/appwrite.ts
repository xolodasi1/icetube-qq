import { Client, Account, OAuthProvider, Databases, Permission, Role, ID } from 'appwrite';

export const client = new Client();

export { Permission, Role, ID };

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);

// Check if the user is in Russian network or without VPN
const OFFLINE_KEY = 'icetube_offline_mode';
// Offline flag auto-expires, so a single slow request can't permanently
// lock the app into fast-fail mode (this was breaking auth in Firefox)
const OFFLINE_TTL_MS = 3 * 60 * 1000;

export const getOfflineFlag = (): boolean => {
    try {
        const raw = localStorage.getItem(OFFLINE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        const storedAt = typeof parsed === 'object' && parsed !== null ? parsed.at : undefined;
        if (!storedAt) return false;
        return Date.now() - storedAt < OFFLINE_TTL_MS;
    } catch (e) {
        return false;
    }
};

export const setOfflineFlag = (val: boolean): void => {
    try {
        if (val) {
            localStorage.setItem(OFFLINE_KEY, JSON.stringify({ at: Date.now() }));
        } else {
            localStorage.removeItem(OFFLINE_KEY);
        }
        window.dispatchEvent(new Event('icetube_network_status_changed'));
    } catch (e) {}
};

export const initNetworkSelfHeal = (): void => {
    const recover = () => {
        // Drop the stale flag so the next request gets the full timeout
        setOfflineFlag(false);
    };
    window.addEventListener('online', recover);
    window.addEventListener('focus', recover);
};

export interface TimeoutOptions {
    setOfflineFlagOnTimeout?: boolean;
}

// Custom timeout wrapper for Appwrite calls
// - `setOfflineFlagOnTimeout: false` is for auth-critical calls: a slow but
//   working connection must NOT be treated as offline (Firefox is slower on
//   cold TLS connections, which used to kill login there)
export const withTimeout = <T>(promise: Promise<T>, ms: number = 2500, options?: TimeoutOptions): Promise<T> => {
    const { setOfflineFlagOnTimeout = true } = options || {};
    // If we already know we are offline, drop timeout to 800ms to fail immediately and show demo videos fast
    const adjustedTimeout = getOfflineFlag() ? Math.min(ms, 800) : ms;

    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            // Signal offline mode so subsequent loads are extremely fast without waiting
            if (setOfflineFlagOnTimeout) {
                setOfflineFlag(true);
            }
            reject(new Error("Timeout waiting for Appwrite response"));
        }, adjustedTimeout);

        promise.then(
            (res) => {
                clearTimeout(timer);
                // If we successfully get response, remove offline flag!
                setOfflineFlag(false);
                resolve(res);
            },
            (err) => {
                clearTimeout(timer);
                reject(err);
            }
        );
    });
};

export const loginWithGoogle = () => {
    // Determine the redirect URL based on current environment
    const redirectUrl = window.location.origin;
    
    // Create an OAuth2 session using Google
    // Pass success and failure redirect URLs
    account.createOAuth2Session(
        OAuthProvider.Google,
        redirectUrl,
        `${redirectUrl}/?error=auth_failed`
    );
};

export const logout = async () => {
    try {
        await account.deleteSession('current');
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

export const getCurrentUser = async () => {
    try {
        const user = await account.get();
        return user;
    } catch (error) {
        return null;
    }
};

