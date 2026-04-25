import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://api-msa.mydigifinance.com';

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
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
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
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
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
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    accept: '*/*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
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