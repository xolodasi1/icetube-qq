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
                        name: doc.name || '',
                        avatar: doc.avatar || '',
                        description: doc.description || ''
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
            await fetchUserProfile(currentUser.$id);
        }
        setIsLoading(false);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user.$id);
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
