import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export function useUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des utilisateurs');
            }
            const data = await response.json();
            setUsers(data.reverse());
        } catch (err) {
            setError(err.message || 'Échec du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (id, data) => {
        try {
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
                throw new Error(body.message || `Erreur ${response.status}`);
            }

            // Recharger les données après la mise à jour
            await fetchUsers();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la mise à jour');
            throw err;
        }
    };

    const deleteUser = async (id) => {
        try {
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
                throw new Error(body.message || `Erreur ${response.status}`);
            }

            // Recharger les données après la suppression
            await fetchUsers();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la suppression');
            throw err;
        }
    };

    const createUser = async (data) => {
        try {
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
                throw new Error(
                    body.message || `Erreur ${response.status}: ${response.statusText}`
                );
            }

            // Recharger les données après la création
            await fetchUsers();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la création');
            throw err;
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

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