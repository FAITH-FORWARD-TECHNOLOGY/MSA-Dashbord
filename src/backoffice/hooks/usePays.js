import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://api-msa.mydigifinance.com';

export function usePays() {
    const [pays, setPays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPays = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_BASE_URL}/pays`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des pays');
            }
            const data = await response.json();
            setPays(data.reverse());
        } catch (err) {
            setError(err.message || 'Échec du chargement des pays');
        } finally {
            setLoading(false);
        }
    };

    const updatePays = async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/pays/${id}`, {
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
            await fetchPays();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la mise à jour');
            throw err;
        }
    };

    const deletePays = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/pays/${id}`, {
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
            await fetchPays();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la suppression');
            throw err;
        }
    };

    const createPays = async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/pays`, {
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
            await fetchPays();
            return true;
        } catch (err) {
            setError(err.message || 'Erreur lors de la création');
            throw err;
        }
    };

    useEffect(() => {
        fetchPays();
    }, []);

    return {
        pays,
        loading,
        error,
        refetch: fetchPays,
        updatePays,
        deletePays,
        createPays,
    };
}