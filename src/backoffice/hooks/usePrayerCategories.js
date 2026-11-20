import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, authHeaders } from '../config/api';
import { ARCHIVAGE_DEFAUT, ARCHIVAGE_KEY } from '../utils/prayerCategories';

async function erreurDe(response) {
    const body = await response.json().catch(() => ({}));
    const msg = Array.isArray(body.message) ? body.message.join(' ') : body.message;
    return new Error(msg || `Erreur ${response.status}`);
}

// Catégories de sujets de prière (admin) + délai d'archivage automatique.
export function usePrayerCategories() {
    const [categories, setCategories] = useState([]);
    const [jours, setJours] = useState(null); // null : valeur réelle pas encore chargée
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const charger = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const [resCats, resJours] = await Promise.all([
                fetch(`${API_BASE_URL}/prayer-categories/admin`, { headers: authHeaders() }),
                fetch(`${API_BASE_URL}/settings/${ARCHIVAGE_KEY}`),
            ]);
            if (!resCats.ok) throw await erreurDe(resCats);
            setCategories(await resCats.json());
            // 404 = réglage jamais enregistré : valeur par défaut.
            if (resJours.ok) {
                const n = Number((await resJours.json()).value);
                setJours(Number.isInteger(n) && n > 0 ? n : ARCHIVAGE_DEFAUT);
            } else if (resJours.status === 404) {
                setJours(ARCHIVAGE_DEFAUT);
            } else {
                throw await erreurDe(resJours);
            }
        } catch (err) {
            setError(err.message || 'Échec du chargement');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        charger();
    }, [charger]);

    const envoyer = async (path, method, payload) => {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw await erreurDe(response);
        return response.json();
    };

    const creer = async (libelle) => {
        await envoyer('/prayer-categories', 'POST', { libelle });
        await charger();
    };

    const modifier = async (id, patch) => {
        await envoyer(`/prayer-categories/${id}`, 'PATCH', patch);
        await charger();
    };

    const reordonner = async (ids) => {
        setCategories(await envoyer('/prayer-categories/ordre', 'PATCH', { ids }));
    };

    const enregistrerJours = async (valeur) => {
        const saved = await envoyer('/settings', 'PUT', {
            key: ARCHIVAGE_KEY,
            value: String(valeur),
        });
        setJours(Number(saved.value));
    };

    return {
        categories, jours, loading, error,
        recharger: charger, creer, modifier, reordonner, enregistrerJours,
    };
}
