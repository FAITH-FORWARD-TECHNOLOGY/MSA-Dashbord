import { useState, useEffect } from "react";
import { API_BASE_URL, authHeaders, handleUnauthorized } from "../config/api";

// CRUD du pool de versets du jour (back-office).
export function useDailyVerses() {
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchVerses = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch(`${API_BASE_URL}/daily-verse/admin`, {
                headers: authHeaders(),
            });
            if (handleUnauthorized(res)) return;
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const body = await res.json();
            setVerses(Array.isArray(body) ? body : body?.data ?? []);
        } catch (err) {
            setError(err.message || "Echec du chargement");
        } finally {
            setLoading(false);
        }
    };

    const createVerse = async (payload) => {
        const res = await fetch(`${API_BASE_URL}/daily-verse`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            throw new Error(b.message || `Erreur ${res.status}`);
        }
        await fetchVerses();
        return true;
    };

    const updateVerse = async (id, payload) => {
        const res = await fetch(`${API_BASE_URL}/daily-verse/${id}`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            throw new Error(b.message || `Erreur ${res.status}`);
        }
        await fetchVerses();
        return true;
    };

    const setStatus = async (id, isActive) => {
        const res = await fetch(`${API_BASE_URL}/daily-verse/${id}/status`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({ isActive }),
        });
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            throw new Error(b.message || `Erreur ${res.status}`);
        }
        await fetchVerses();
        return true;
    };

    const deleteVerse = async (id) => {
        const res = await fetch(`${API_BASE_URL}/daily-verse/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            throw new Error(b.message || `Erreur ${res.status}`);
        }
        await fetchVerses();
        return true;
    };

    useEffect(() => {
        fetchVerses();
    }, []);

    return {
        verses,
        loading,
        error,
        refetch: fetchVerses,
        createVerse,
        updateVerse,
        setStatus,
        deleteVerse,
    };
}
