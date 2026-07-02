import { useState, useEffect } from "react";
import { API_BASE_URL, authHeaders } from "../config/api";

// CRUD des plans de lecture (back-office). Liste avec nb de souscrits/termines.
export function useReadingPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchPlans = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch(`${API_BASE_URL}/reading-plans/admin`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const body = await res.json();
            setPlans(Array.isArray(body) ? body : body?.data ?? []);
        } catch (err) {
            setError(err.message || "Echec du chargement des plans");
        } finally {
            setLoading(false);
        }
    };

    const createPlan = async (payload) => {
        const res = await fetch(`${API_BASE_URL}/reading-plans`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            throw new Error(b.message || `Erreur ${res.status}`);
        }
        await fetchPlans();
        return true;
    };

    const updatePlan = async (id, payload) => {
        const res = await fetch(`${API_BASE_URL}/reading-plans/${id}`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            throw new Error(b.message || `Erreur ${res.status}`);
        }
        await fetchPlans();
        return true;
    };

    const setStatus = async (id, isActive) => {
        const res = await fetch(`${API_BASE_URL}/reading-plans/${id}/status`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({ isActive }),
        });
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            throw new Error(b.message || `Erreur ${res.status}`);
        }
        await fetchPlans();
        return true;
    };

    const deletePlan = async (id) => {
        const res = await fetch(`${API_BASE_URL}/reading-plans/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            throw new Error(b.message || `Erreur ${res.status}`);
        }
        await fetchPlans();
        return true;
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    return {
        plans,
        loading,
        error,
        refetch: fetchPlans,
        createPlan,
        updatePlan,
        setStatus,
        deletePlan,
    };
}
