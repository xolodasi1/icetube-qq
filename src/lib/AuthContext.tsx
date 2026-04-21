import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginWithGoogle, logout } from './appwrite';
import { Models } from 'appwrite';

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    isLoading: boolean;
    login: () => void;
    logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: () => {},
    logoutUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        setIsLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setIsLoading(false);
    };

    const logoutUser = async () => {
        await logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login: loginWithGoogle, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
