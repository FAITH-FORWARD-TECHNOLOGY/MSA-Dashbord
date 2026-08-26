import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

// Hook CRUD du module Communication (médiathèque + directs).
// Les contenus ne viennent pas de l'API YouTube : chaque entrée porte
// simplement un lien YouTube saisi ici. Le backend valide et normalise ce
// lien (formes watch?v=, youtu.be/, /live/, /shorts/ ou identifiant seul).
export function useCommunication() {
    const [videos, setVideos] = useState([]);
    const [lives, setLives] = useState([]);
    const [rubriques, setRubriques] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Les routes /communication/admin/* sont protégées par JwtAuthGuard.
    const authHeaders = () => {
        let token = '';
        try {
            const stored = localStorage.getItem('jobhubs_auth');
            if (stored) token = JSON.parse(stored)?.user?.token ?? '';
        } catch {
            token = '';
        }
        return {
            accept: '*/*',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    const request = async (path, options = {}) => {
        const response = await fetch(`${API_BASE_URL}/communication/admin${path}`, {
            headers: authHeaders(),
            ...options,
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || `Erreur ${response.status}`);
        }
        return response.status === 204 ? null : response.json();
    };

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const [v, l, r, a] = await Promise.all([
                request('/videos'),
                request('/lives'),
                request('/rubriques'),
                request('/announcements'),
            ]);
            setVideos(Array.isArray(v) ? v : []);
            setLives(Array.isArray(l) ? l : []);
            setRubriques(Array.isArray(r) ? r : []);
            setAnnouncements(Array.isArray(a) ? a : []);
        } catch (err) {
            setError(err.message || 'Échec du chargement des contenus');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Chaque mutation refetch pour garder l'UI alignée sur le serveur
    // (le lien est renvoyé normalisé, il faut donc le relire).
    const mutate = async (path, method, payload) => {
        await request(path, {
            method,
            ...(payload ? { body: JSON.stringify(payload) } : {}),
        });
        await fetchAll();
        return true;
    };

    // Pre-remplissage depuis un lien : titre, chaine, miniature, duree.
    const resolveLink = (url) =>
        request(`/resolve?url=${encodeURIComponent(url)}`);

    return {
        videos,
        lives,
        rubriques,
        announcements,
        resolveLink,
        loading,
        error,
        refresh: fetchAll,
        createVideo: (p) => mutate('/videos', 'POST', p),
        updateVideo: (id, p) => mutate(`/videos/${id}`, 'PATCH', p),
        deleteVideo: (id) => mutate(`/videos/${id}`, 'DELETE'),
        createLive: (p) => mutate('/lives', 'POST', p),
        updateLive: (id, p) => mutate(`/lives/${id}`, 'PATCH', p),
        deleteLive: (id) => mutate(`/lives/${id}`, 'DELETE'),
        createAnnouncement: (p) => mutate('/announcements', 'POST', p),
        updateAnnouncement: (id, p) => mutate(`/announcements/${id}`, 'PATCH', p),
        deleteAnnouncement: (id) => mutate(`/announcements/${id}`, 'DELETE'),
        createRubrique: (p) => mutate('/rubriques', 'POST', p),
        updateRubrique: (id, p) => mutate(`/rubriques/${id}`, 'PATCH', p),
        deleteRubrique: (id) => mutate(`/rubriques/${id}`, 'DELETE'),
    };
}
