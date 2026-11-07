import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, authHeaders, handleUnauthorized } from "../config/api";

// Module Statistiques : contrat dans docs-MSA-backend/module-statistiques-2026-11-07.md
const BASE = `${API_BASE_URL}/statistiques`;

// Message d'erreur NestJS (message texte ou tableau de messages de validation).
async function messageErreur(res) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body?.message)
        ? body.message.join(" ; ")
        : body?.message;
    return msg || `Erreur ${res.status}`;
}

// Query string sans les paramètres vides (celluleId absent = toutes).
function construireUrl(chemin, params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    const s = qs.toString();
    return `${BASE}${chemin}${s ? `?${s}` : ""}`;
}

// Cellules autorisées pour l'utilisateur connecté (filtre « Cellule »).
export function useStatistiquesCellules() {
    const [cellules, setCellules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const charger = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch(`${BASE}/cellules`, {
                headers: authHeaders(),
            });
            if (handleUnauthorized(res)) return;
            // 403 = aucune cellule autorisée : même affichage qu'une liste vide.
            if (res.status === 403) {
                setCellules([]);
                return;
            }
            if (!res.ok) throw new Error(await messageErreur(res));
            const body = await res.json();
            setCellules(Array.isArray(body) ? body : []);
        } catch (err) {
            setError(err.message || "Échec du chargement des cellules");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        charger();
    }, [charger]);

    return { cellules, loading, error, recharger: charger };
}

// Données JSON d'un volet ; ne charge rien tant que `actif` est faux.
export function useStatistiquesVolet(chemin, { du, au, celluleId }, actif) {
    const [data, setData] = useState(null);
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
                const res = await fetch(
                    construireUrl(chemin, { du, au, celluleId }),
                    { headers: authHeaders(), signal: ctrl.signal }
                );
                if (handleUnauthorized(res)) return;
                if (!res.ok) throw new Error(await messageErreur(res));
                setData(await res.json());
            } catch (err) {
                if (err.name === "AbortError") return;
                setData(null);
                setError(err.message || "Échec du chargement des statistiques");
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        })();
        return () => ctrl.abort();
    }, [chemin, du, au, celluleId, actif, essai]);

    const recharger = useCallback(() => setEssai((n) => n + 1), []);

    return { data, loading, error, recharger };
}

// Télécharge un export (xlsx/pdf) avec le jeton, puis le propose au navigateur.
export async function telechargerExport(
    chemin,
    { du, au, celluleId },
    format,
    nomFichier
) {
    const res = await fetch(construireUrl(chemin, { du, au, celluleId, format }), {
        headers: authHeaders({ accept: "*/*" }),
    });
    if (handleUnauthorized(res)) return;
    if (!res.ok) throw new Error(await messageErreur(res));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomFichier;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Laisse le temps au navigateur de démarrer le téléchargement.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
