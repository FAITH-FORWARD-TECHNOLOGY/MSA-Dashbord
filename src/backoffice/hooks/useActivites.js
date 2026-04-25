import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://api-msa.mydigifinance.com';

export function useActivites() {
    const [activites, setActivites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchActivites = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_BASE_URL}/activites`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des activités');
            }
            const data = await response.json();
            setActivites(data.reverse());
        } catch (err) {
            setError(err.message || 'Échec du chargement des activités');
        } finally {
            setLoading(false);
        }
    };

    const addPhotoToActivity = async (userId, activityId, imageUrls) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/users/${userId}/activities/${activityId}/photos`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(imageUrls),
                }
            );

            if (!response.ok) {
                throw new Error('Erreur lors de l\'ajout de la photo');
            }

            // Recharger les données après l'ajout
            await fetchActivites();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de l\'ajout de la photo');
            throw err;
        }
    };

    const addExpertiseToActivity = async (userId, activityId, expertise) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/users/${userId}/activities/${activityId}/expertise`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ expertise }),
                }
            );

            if (!response.ok) {
                throw new Error('Erreur lors de l\'ajout de l\'expertise');
            }

            // Recharger les données après l'ajout
            await fetchActivites();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de l\'ajout de l\'expertise');
            throw err;
        }
    };

    const updateActivity = async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/activites/${id}`, {
                method: 'PATCH',
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
            await fetchActivites();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la mise à jour');
            throw err;
        }
    };

    const deleteActivity = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/activites/${id}`, {
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
            await fetchActivites();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la suppression');
            throw err;
        }
    };

    useEffect(() => {
        fetchActivites();
    }, []);

    return {
        activites,
        loading,
        error,
        refetch: fetchActivites,
        updateActivity,
        deleteActivity,
        addPhotoToActivity,
        addExpertiseToActivity,
    };
}