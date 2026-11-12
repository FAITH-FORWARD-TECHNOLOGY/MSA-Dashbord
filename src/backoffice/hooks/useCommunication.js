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
    const authToken = () => {
        try {
            const stored = localStorage.getItem('jobhubs_auth');
            return stored ? (JSON.parse(stored)?.user?.token ?? '') : '';
        } catch {
            return '';
        }
    };

    const authHeaders = () => {
        const token = authToken();
        return {
            accept: '*/*',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    // Envoi d'une image d'annonce sur le backend MSA ; renvoie son URL.
    // Pas de Content-Type : le navigateur pose la frontière multipart.
    const uploadAnnouncementImage = async (file) => {
        const body = new FormData();
        body.append('file', file);
        const token = authToken();
        const response = await fetch(`${API_BASE_URL}/communication/admin/uploads`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body,
        });
        const result = await response.json().catch(() => ({}));
        if (response.status === 413) {
            throw new Error('Image trop lourde : 5 Mo maximum.');
        }
        if (!response.ok || !result.url) {
            throw new Error(result.message || `Échec de l'envoi (erreur ${response.status})`);
        }
        return result.url;
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

    // Ordre des annonces : le serveur renvoie la liste réordonnée, sans
    // repasser par l'état de chargement (le tableau garde le focus clavier).
    const reorderAnnouncements = async (ids) => {
        try {
            const list = await request('/announcements/order', {
                method: 'PATCH',
                body: JSON.stringify({ ids }),
            });
            if (Array.isArray(list)) setAnnouncements(list);
            else await fetchAll();
            return true;
        } catch (err) {
            // Liste probablement périmée (autre admin) : on la relit.
            await fetchAll();
            throw err;
        }
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
        reorderAnnouncements,
        uploadAnnouncementImage,
        createRubrique: (p) => mutate('/rubriques', 'POST', p),
        updateRubrique: (id, p) => mutate(`/rubriques/${id}`, 'PATCH', p),
        deleteRubrique: (id) => mutate(`/rubriques/${id}`, 'DELETE'),
    };
}
