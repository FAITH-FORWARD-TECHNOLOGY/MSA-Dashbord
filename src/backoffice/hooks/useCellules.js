import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://api-msa.mydigifinance.com';

export function useCellules() {
    const [cellules, setCellules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchCellules = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_BASE_URL}/cellules/all`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des cellules');
            }
            const result = await response.json();
            setCellules(result.data || []);
        } catch (err) {
            setError(err.message || 'Échec du chargement des cellules');
        } finally {
            setLoading(false);
        }
    };

    const updateCellule = async (celluleId, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/cellules/${celluleId}/update`, {
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
            await fetchCellules();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la mise à jour');
            throw err;
        }
    };

    const deleteCellule = async (celluleId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/cellules/${celluleId}/delete`, {
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
            await fetchCellules();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la suppression');
            throw err;
        }
    };

    const createCellule = async (data,userId) => {
        try {
            // Utiliser l'ID du leader comme idUser dans l'URL
            const leaderPersonId = data.leaderPersonId;
            if (!leaderPersonId) {
                throw new Error('ID du leader requis pour créer une cellule');
            }

            const response = await fetch(`${API_BASE_URL}/cellules/create/${userId}`, {
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
            await fetchCellules();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la création');
            throw err;
        }
    };

    useEffect(() => {
        fetchCellules();
    }, []);

    return {
        cellules,
        loading,
        error,
        refetch: fetchCellules,
        updateCellule,
        deleteCellule,
        createCellule,
    };
}