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

// Custom timeout wrapper for Appwrite calls
export const withTimeout = <T>(promise: Promise<T>, ms: number = 2500): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("Timeout waiting for Appwrite response"));
        }, ms);

        promise.then(
            (res) => {
                clearTimeout(timer);
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

