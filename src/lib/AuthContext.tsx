import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginWithGoogle, logout, databases, withTimeout } from './appwrite';
import { Models, Query } from 'appwrite';
import AuthModal from '../components/AuthModal';

export interface UserProfile {
    name: string;
    avatar: string;
    description: string;
    role?: string;
}

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    profile: UserProfile | null;
    isLoading: boolean;
    login: () => void;
    logoutUser: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    checkUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    login: () => {},
    logoutUser: async () => {},
    refreshProfile: async () => {},
    checkUserStatus: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        checkUserStatus();
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
            const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
            if (dbId && usersColId) {
                const res = await withTimeout(databases.listDocuments(dbId, usersColId, [
                    Query.equal('userId', userId)
                ]), 2500);
                if (res.documents.length > 0) {
                    const doc = res.documents[0];
                    setProfile({
                        name: doc.name || doc.displayName || '',
                        avatar: doc.avatar || doc.photoUrl || '',
                        description: doc.description || doc.bio || '',
                        role: doc.role || 'user'
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch user profile:", err);
        }
    };

    const checkUserStatus = async () => {
        setIsLoading(true);
        console.log("Checking user status...");
        try {
            const currentUser = await withTimeout(getCurrentUser(), 2500);
            // Log ID instead of the full user object to avoid serialization issues
            console.log("Current user ID:", currentUser?.$id || "No user found");
            setUser(currentUser);
            if (currentUser) {
                try {
                    await withTimeout(ensureUserProfile(currentUser), 2500);
                } catch (profileErr) {
                    console.warn("Could not load user profile in time:", profileErr);
                }
            }
        } catch (err) {
            console.warn("Auth check failed or timed out:", err);
            setUser(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
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
                    description: doc.description || doc.bio || '',
                    role: doc.role || 'user'
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
                    description: doc.description || doc.bio || '',
                    role: doc.role || 'user'
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
                        email: u.email || '',
                        avatar: '',
                        description: '',
                        subscribersCount: 0,
                        viewsCount: 0,
                        likesCount: 0,
                        videosCount: 0,
                        snowflakesCount: 0,
                        role: 'user'
                    });
                    setProfile({
                        name: newDoc.name,
                        avatar: newDoc.avatar,
                        description: newDoc.description,
                        role: 'user'
                    });
                } catch (createErr: any) {
                    if (createErr.code === 400 && createErr.message.includes('role')) {
                        console.warn("Retrying profile creation without 'role' attribute...");
                        const fallbackDoc = await databases.createDocument(dbId, usersColId, u.$id, {
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
                            name: fallbackDoc.name,
                            avatar: fallbackDoc.avatar,
                            description: fallbackDoc.description,
                            role: 'user'
                        });
                    } else if (createErr.code !== 409) {
                        console.error("Profile creation failed:", createErr);
                    }
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

    const login = () => {
        setIsAuthModalOpen(true);
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, login, logoutUser, refreshProfile, checkUserStatus }}>
            {children}
            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
