import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export function useCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_BASE_URL}/categorie`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des catégories');
            }
            const data = await response.json();
            setCategories(data.reverse());
        } catch (err) {
            setError(err.message || 'Échec du chargement des catégories');
        } finally {
            setLoading(false);
        }
    };

    const updateCategorie = async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categorie/${id}`, {
                method: 'PATCH',
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
            await fetchCategories();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la mise à jour');
            throw err;
        }
    };

    const deleteCategorie = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categorie/${id}`, {
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
            await fetchCategories();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la suppression');
            throw err;
        }
    };

    const createCategorie = async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categorie`, {
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

            // Recharger les données après la création
            await fetchCategories();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la création');
            throw err;
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return {
        categories,
        loading,
        error,
        refetch: fetchCategories,
        updateCategorie,
        deleteCategorie,
        createCategorie,
    };
}