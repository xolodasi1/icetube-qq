import { Client, Account, OAuthProvider, Databases, Storage, Permission, Role, ID } from 'appwrite';

export const client = new Client();

export { Permission, Role, ID };

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Check if the user is in Russian network or without VPN
export const getOfflineFlag = (): boolean => {
    try {
        return localStorage.getItem('icetube_offline_mode') === 'true';
    } catch (e) {
        return false;
    }
};

export const setOfflineFlag = (val: boolean): void => {
    try {
        if (val) {
            localStorage.setItem('icetube_offline_mode', 'true');
        } else {
            localStorage.removeItem('icetube_offline_mode');
        }
        window.dispatchEvent(new Event('icetube_network_status_changed'));
    } catch (e) {}
};

// Custom timeout wrapper for Appwrite calls
export const withTimeout = <T>(promise: Promise<T>, ms: number = 2500): Promise<T> => {
    // If we already know we are offline, drop timeout to 800ms to fail immediately and show demo videos fast
    const adjustedTimeout = getOfflineFlag() ? Math.min(ms, 800) : ms;
    
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            // Signal offline mode so subsequent loads are extremely fast without waiting
            setOfflineFlag(true);
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

