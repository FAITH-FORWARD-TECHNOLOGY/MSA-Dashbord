import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

// Vrai si le JWT est expiré (ou illisible). Evite de rester "connecté" avec un
// token mort, ce qui provoque des 401 silencieux sur les pages protégées
// (Plans, Verset du jour...).
function isJwtExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload?.exp) return false;
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
}

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Vérifier l'authentification au chargement
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        try {
            const storedAuth = localStorage.getItem("jobhubs_auth");
            if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                const token = authData?.user?.token;
                // Token expiré -> on déconnecte pour forcer une reconnexion
                // (sinon 401 sur Plans/Verset du jour sans redirection).
                if (token && isJwtExpired(token)) {
                    logout();
                    return;
                }
                setUser(authData?.user);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            logout(); // Nettoyer en cas d'erreur
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.data) {
                // Stocker les données d'authentification
                const authData = {
                    isAuthenticated: true,
                    user: result.data,
                    timestamp: Date.now(),
                };

                localStorage.setItem("jobhubs_auth", JSON.stringify(authData));
                setUser(result.data);
                setIsAuthenticated(true);

                return { success: true, user: result.data };
            } else {
                throw new Error('Données de connexion invalides');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("jobhubs_auth");
        setUser(null);
        setIsAuthenticated(false);
    };

    return {
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        checkAuthStatus,
    };
}