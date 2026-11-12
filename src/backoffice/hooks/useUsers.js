import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import { chaineRequete } from '../components/statistiques/cellulesFiltre';

// Message d'erreur NestJS : chaîne, ou tableau pour les 400 de validation.
const texteMessage = (body) =>
    Array.isArray(body?.message) ? body.message.join(' ; ') : body?.message;

// `filtres` : paramètres de GET /users (quartierId, sansQuartier) ; {} = tous.
export function useUsers(filtres) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const requete = chaineRequete(filtres ?? {});
    // Seule la réponse de la dernière requête est gardée (changement rapide de filtre).
    const dernier = useRef(0);

    const fetchUsers = useCallback(async () => {
        const appel = ++dernier.current;
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_BASE_URL}/users${requete}`);
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(texteMessage(body) || 'Erreur lors du chargement des utilisateurs');
            }
            const data = await response.json();
            if (appel !== dernier.current) return;
            setUsers(data.reverse());
        } catch (err) {
            if (appel !== dernier.current) return;
            setError(err.message || 'Échec du chargement des utilisateurs');
        } finally {
            if (appel === dernier.current) setLoading(false);
        }
    }, [requete]);

    const updateUser = async (id, data) => {
        // Une erreur est levée telle quelle : la modale qui a lancé l'action l'affiche.
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'POST',
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            // statusText est vide en HTTP/2 : le message utile est dans le
            // corps JSON renvoye par NestJS ({statusCode, message}).
            const body = await response.json().catch(() => ({}));
            throw new Error(texteMessage(body) || `Erreur ${response.status}`);
        }

        // Recharger les données après la mise à jour
        await fetchUsers();
        return true;
    };

    const deleteUser = async (id) => {
        // Une erreur est levée telle quelle : la modale qui a lancé l'action l'affiche.
        const response = await fetch(`${API_BASE_URL}/users/${id}/delete`, {
            method: 'DELETE',
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // statusText est vide en HTTP/2 : le message utile est dans le
            // corps JSON renvoye par NestJS ({statusCode, message}).
            const body = await response.json().catch(() => ({}));
            throw new Error(texteMessage(body) || `Erreur ${response.status}`);
        }

        // Recharger les données après la suppression
        await fetchUsers();
        return true;
    };

    const createUser = async (data) => {
        // Une erreur est levée telle quelle : la modale qui a lancé l'action l'affiche.
        // /auth/signup est désormais réservé aux admins (JwtAuthGuard
        // + check role côté backend) — on ajoute le Bearer token de
        // l'admin connecté, stocké dans localStorage.jobhubs_auth.user.token.
        let token = '';
        try {
            const stored = localStorage.getItem('jobhubs_auth');
            if (stored) {
                const parsed = JSON.parse(stored);
                token = parsed?.user?.token ?? '';
            }
        } catch {
            token = '';
        }

        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(texteMessage(body) || `Erreur ${response.status}`);
        }

        // Recharger les données après la création
        await fetchUsers();
        return true;
    };

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return {
        users,
        loading,
        error,
        refetch: fetchUsers,
        updateUser,
        deleteUser,
        createUser,
    };
}