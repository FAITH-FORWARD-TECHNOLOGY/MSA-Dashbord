import { useState, useEffect } from 'react';

// URL de l'API NestJS. Par défaut on tape la prod.
// Pour tester en local : npm run dev:local (qui set VITE_API_URL=http://localhost:3000)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-msa.mydigifinance.com';

// Hook CRUD pour les destinations de covoiturage.
// Expose la liste, les méthodes create/update/delete + le toggle actif.
// Chaque mutation refetch la liste pour que l'UI reste cohérente.
export function useRideDestinations() {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Récupère toutes les destinations (actives et inactives).
    // On accepte 2 formats de réponse pour être tolérant si jamais l'API
    // change son wrapping : soit directement un tableau, soit {data: [...]}
    const fetchDestinations = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_BASE_URL}/ride-destinations`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des destinations');
            }
            const body = await response.json();
            const data = Array.isArray(body) ? body : body?.data ?? [];
            setDestinations(data);
        } catch (err) {
            setError(err.message || 'Échec du chargement des destinations');
        } finally {
            setLoading(false);
        }
    };

    const createDestination = async (payload) => {
        const response = await fetch(`${API_BASE_URL}/ride-destinations`, {
            method: 'POST',
            headers: { accept: '*/*', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || `Erreur ${response.status}`);
        }
        await fetchDestinations();
        return true;
    };

    const updateDestination = async (id, payload) => {
        const response = await fetch(`${API_BASE_URL}/ride-destinations/${id}`, {
            method: 'PATCH',
            headers: { accept: '*/*', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || `Erreur ${response.status}`);
        }
        await fetchDestinations();
        return true;
    };

    // Switch du dashboard : le backend fait le toggle (pas besoin de lui envoyer
    // la valeur courante, ce qui évite les race conditions entre 2 clics rapides).
    const toggleActive = async (id) => {
        const response = await fetch(
            `${API_BASE_URL}/ride-destinations/${id}/active`,
            {
                method: 'PATCH',
                headers: { accept: '*/*', 'Content-Type': 'application/json' },
            }
        );
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || `Erreur ${response.status}`);
        }
        await fetchDestinations();
        return true;
    };

    const deleteDestination = async (id) => {
        const response = await fetch(`${API_BASE_URL}/ride-destinations/${id}`, {
            method: 'DELETE',
            headers: { accept: '*/*', 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || `Erreur ${response.status}`);
        }
        await fetchDestinations();
        return true;
    };

    // Importe les cellules actives du backend comme destinations type 'cellule'.
    // L'endpoint dédoublonne par nom pour ne pas recréer ce qui existe déjà.
    const syncFromCellules = async () => {
        const response = await fetch(
            `${API_BASE_URL}/ride-destinations/sync-from-cellules`,
            {
                method: 'POST',
                headers: { accept: '*/*', 'Content-Type': 'application/json' },
            }
        );
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || `Erreur ${response.status}`);
        }
        const body = await response.json();
        await fetchDestinations();
        return body?.data ?? {};
    };

    useEffect(() => {
        fetchDestinations();
    }, []);

    return {
        destinations,
        loading,
        error,
        refetch: fetchDestinations,
        createDestination,
        updateDestination,
        toggleActive,
        deleteDestination,
        syncFromCellules,
    };
}
