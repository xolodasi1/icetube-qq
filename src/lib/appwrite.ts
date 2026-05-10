import { Client, Account, OAuthProvider, Databases, Permission, Role } from 'appwrite';

export const client = new Client();

export { Permission, Role };

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);

export const loginWithGoogle = () => {
    // Determine the redirect URL
    const redirectUrl = 'https://icetube-q.vercel.app/';
    
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
