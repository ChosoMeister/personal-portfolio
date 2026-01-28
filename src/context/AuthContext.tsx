import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API } from '../services/api';

type User = {
    username: string;
    isAdmin: boolean;
    displayName?: string;
};

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, pass: string) => Promise<void>;
    register: (username: string, pass: string, displayName: string, question: string, answer: string) => Promise<void>;
    logout: () => void;
    updateDisplayName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check valid session on mount
    useEffect(() => {
        const initAuth = async () => {
            if (API.isAuthenticated()) {
                // We might want to validate token or get user profile?
                // Converting JWT payload to user object or reading from local storage fallback
                const users = API.getAllUsers(); // Use this just to trigger sync or finding local
                // API.isAuthenticated checks expiration. 
                // We need to restore user info. 
                // api.ts doesn't expose a "getUser" from token.
                // But we can decode it or store user info in localStorage separately.
                // api.ts uses `gemini_fallback_users`.

                // Ideally we should have a `me` endpoint.
                // For now, let's assume if authenticated, we try to get user from local fallback or we implement `me`.
            }
            // Simplified: App.tsx used localStorage 'sessionUser'.
            // API.login returns user and stores it?
            // App.tsx stored it manually.
            // Let's replicate App.tsx logic for restoration but cleaner.

            const stored = localStorage.getItem('sessionUser'); // Legacy key from App.tsx
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setUser(parsed);
                } catch (e) { localStorage.removeItem('sessionUser'); }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = useCallback(async (username: string, pass: string) => {
        const loggedUser = await API.login(username, pass);
        setUser(loggedUser);
        localStorage.setItem('sessionUser', JSON.stringify(loggedUser));
    }, []);

    const register = useCallback(async (username: string, pass: string, displayName: string, question: string, answer: string) => {
        const regUser = await API.register(username, pass, displayName, question, answer);
        // Register usually logs in too
        setUser(regUser);
        localStorage.setItem('sessionUser', JSON.stringify(regUser));
    }, []);

    const logout = useCallback(() => {
        API.logout();
        localStorage.removeItem('sessionUser');
        setUser(null);
    }, []);

    const updateDisplayName = useCallback((name: string) => {
        setUser(u => u ? { ...u, displayName: name } : null);
        if (user) {
            localStorage.setItem(`displayName:${user.username}`, name);
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateDisplayName }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
