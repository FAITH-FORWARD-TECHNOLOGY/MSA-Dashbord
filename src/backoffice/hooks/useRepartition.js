import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, authHeaders, handleUnauthorized } from "../config/api";
import { chaineRequete } from "../components/statistiques/cellulesFiltre";
import { messageErreur } from "./useStatistiques";
import { nomFichierRepartition } from "../utils/repartition";

// Répartition des membres par quartier : contrat dans docs-MSA-backend (GET /zones/repartition).
const BASE = `${API_BASE_URL}/zones/repartition`;

// Données JSON d'une route ; 403 signalé à part (droits insuffisants).
function useLecture(chemin, params, actif) {
    const [etat, setEtat] = useState({ data: null, loading: actif, error: "", interdit: false });
    const [essai, setEssai] = useState(0);
    const requete = chaineRequete(params);

    useEffect(() => {
        if (!actif) return undefined;
        const ctrl = new AbortController();
        (async () => {
            setEtat((e) => ({ ...e, loading: true, error: "", interdit: false }));
            try {
                const res = await fetch(`${BASE}${chemin}${requete}`, {
                    headers: authHeaders(),
                    signal: ctrl.signal,
                });
                if (handleUnauthorized(res)) return;
                if (res.status === 403) {
                    setEtat({ data: null, loading: false, error: "", interdit: true });
                    return;
                }
                if (!res.ok) throw new Error(await messageErreur(res));
                setEtat({ data: await res.json(), loading: false, error: "", interdit: false });
            } catch (err) {
                if (err.name === "AbortError") return;
                setEtat({
                    data: null,
                    loading: false,
                    error: err.message || "Échec du chargement de la répartition",
                    interdit: false,
                });
            }
        })();
        return () => ctrl.abort();
    }, [chemin, requete, actif, essai]);

    const recharger = useCallback(() => setEssai((n) => n + 1), []);
    return { ...etat, recharger };
}

// Arbre Pays → Commune → Quartier ; paysId "" = tous, celluleIds "" = tous les membres.
export function useRepartition({ paysId = "", celluleIds = "" } = {}, actif = true) {
    return useLecture("", { paysId, celluleIds }, actif);
}

// Membres d'un nœud (params issus de parametresMembres) ; inactif tant que params est nul.
export function useMembresRepartition(params) {
    return useLecture("/membres", params ?? {}, params !== null);
}

// Télécharge l'export Excel avec le jeton, puis le propose au navigateur.
export async function telechargerRepartition({ paysId = "", celluleIds = "" } = {}) {
    const res = await fetch(`${BASE}/export${chaineRequete({ paysId, celluleIds })}`, {
        headers: authHeaders({ accept: "*/*" }),
    });
    if (handleUnauthorized(res)) return;
    if (!res.ok) throw new Error(await messageErreur(res));
    const url = URL.createObjectURL(await res.blob());
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nomFichierRepartition();
    lien.style.visibility = "hidden";
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    // Laisse le temps au navigateur de démarrer le téléchargement.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
