import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, authHeaders, handleUnauthorized } from "../config/api";
import { construireUrl, messageErreur } from "./useStatistiques";
import { ErreurJoursNa } from "../components/statistiques/joursNa";

// Ré-export des utilitaires purs pour les consommateurs du hook.
export { ErreurJoursNa, estConflitPresences, estDonneePerimee, trouverJourNa } from "../components/statistiques/joursNa";

// Jours NA avec motif : contrat dans docs-MSA-backend/jours-na-2026-11-08.md
const BASE = `${API_BASE_URL}/statistiques/jours-na`;

// Appel d'écriture ; lève ErreurJoursNa exploitable par le formulaire.
async function ecrire(methode, chemin, corps) {
    const res = await fetch(`${BASE}${chemin}`, {
        method: methode,
        headers: authHeaders(),
        body: corps ? JSON.stringify(corps) : undefined,
    });
    if (handleUnauthorized(res)) {
        throw new ErreurJoursNa("Session expirée", { status: 401 });
    }
    if (res.ok) return res.json().catch(() => ({}));
    if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        throw new ErreurJoursNa(body?.message || "Conflit", {
            status: 409,
            code: body?.code ?? "",
            cellules: Array.isArray(body?.cellules) ? body.cellules : [],
        });
    }
    throw new ErreurJoursNa(await messageErreur(res), { status: res.status });
}

// Jours NA de la période (périmètre de l'utilisateur) et leurs écritures.
export function useJoursNa({ du, au }, actif) {
    const [jours, setJours] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [essai, setEssai] = useState(0);

    useEffect(() => {
        if (!actif) return undefined;
        const ctrl = new AbortController();
        (async () => {
            try {
                setLoading(true);
                setError("");
                const res = await fetch(construireUrl("/jours-na", { du, au }), {
                    headers: authHeaders(),
                    signal: ctrl.signal,
                });
                if (handleUnauthorized(res)) return;
                // 403 = aucune cellule accessible : aucun jour NA à gérer.
                if (res.status === 403) {
                    setJours([]);
                    return;
                }
                if (!res.ok) throw new Error(await messageErreur(res));
                const body = await res.json();
                setJours(Array.isArray(body) ? body : []);
            } catch (err) {
                if (err.name === "AbortError") return;
                setJours([]);
                setError(err.message || "Échec du chargement des jours NA");
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        })();
        return () => ctrl.abort();
    }, [du, au, actif, essai]);

    const recharger = useCallback(() => setEssai((n) => n + 1), []);

    // { date, motif, toutes: true } ou { date, motif, celluleIds, confirmer? }
    const creer = useCallback((corps) => ecrire("POST", "", corps), []);

    // { motif?, celluleIds?, confirmer? }
    const modifier = useCallback(
        (groupe, corps) =>
            ecrire("PATCH", `/${encodeURIComponent(groupe)}`, corps),
        []
    );

    const supprimer = useCallback(
        (groupe) => ecrire("DELETE", `/${encodeURIComponent(groupe)}`),
        []
    );

    return { jours, loading, error, recharger, creer, modifier, supprimer };
}
