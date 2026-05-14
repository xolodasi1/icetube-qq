import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginWithGoogle, logout, databases } from './appwrite';
import { Models, Query } from 'appwrite';

export interface UserProfile {
    name: string;
    avatar: string;
    description: string;
}

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    profile: UserProfile | null;
    isLoading: boolean;
    login: () => void;
    logoutUser: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    login: () => {},
    logoutUser: async () => {},
    refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkUserStatus();
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
            const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
            if (dbId && usersColId) {
                const res = await databases.listDocuments(dbId, usersColId, [
                    Query.equal('userId', userId)
                ]);
                if (res.documents.length > 0) {
                    const doc = res.documents[0];
                    setProfile({
                        name: doc.name || doc.displayName || '',
                        avatar: doc.avatar || doc.photoUrl || '',
                        description: doc.description || doc.bio || ''
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch user profile:", err);
        }
    };

    const checkUserStatus = async () => {
        setIsLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
            await ensureUserProfile(currentUser);
        }
        setIsLoading(false);
    };

    const ensureUserProfile = async (u: Models.User<Models.Preferences>) => {
        try {
            const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
            const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
            if (!dbId || !usersColId) return;

            // 1. Try to fetch by ID (new standard)
            try {
                const doc = await databases.getDocument(dbId, usersColId, u.$id);
                setProfile({
                    name: doc.name || doc.displayName || u.name || 'User',
                    avatar: doc.avatar || doc.photoUrl || '',
                    description: doc.description || doc.bio || ''
                });
                return;
            } catch (err: any) {
                // If not found, continue to query
                if (err.code !== 404) console.warn("Error fetching profile by ID:", err);
            }

            // 2. Query by userId (legacy or in case ID was different)
            const res = await databases.listDocuments(dbId, usersColId, [
                Query.equal('userId', u.$id)
            ]);

            if (res.documents.length > 0) {
                const doc = res.documents[0];
                setProfile({
                    name: doc.name || doc.displayName || u.name || 'User',
                    avatar: doc.avatar || doc.photoUrl || '',
                    description: doc.description || doc.bio || ''
                });
                
                // If we have duplicates or the ID is not the userId, we should ideally fix it
                // but we'll at least use the first one found.
                if (res.documents.length > 1) {
                    console.warn("Found duplicate profiles for user", u.$id);
                }
            } else {
                // 3. Create profile if missing, use u.$id as document ID
                console.log("Creating missing profile for", u.$id);
                try {
                    const newDoc = await databases.createDocument(dbId, usersColId, u.$id, {
                        userId: u.$id,
                        name: u.name || 'User',
                        avatar: '',
                        description: '',
                        subscribersCount: 0,
                        viewsCount: 0,
                        likesCount: 0,
                        videosCount: 0,
                        snowflakesCount: 0
                    });
                    setProfile({
                        name: newDoc.name,
                        avatar: newDoc.avatar,
                        description: newDoc.description
                    });
                } catch (createErr: any) {
                    if (createErr.code !== 409) console.error("Profile creation failed:", createErr);
                }
            }
        } catch (err) {
            console.error("Failed to ensure user profile:", err);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await ensureUserProfile(user);
        }
    }

    const logoutUser = async () => {
        await logout();
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, login: loginWithGoogle, logoutUser, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
