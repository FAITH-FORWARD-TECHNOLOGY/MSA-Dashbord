import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, authHeaders, handleUnauthorized } from "../config/api";
import { construireUrl, messageErreur } from "./useStatistiques";
import {
    CELLULE_REFUSEE,
    cleJoursNa,
    ErreurJoursNa,
    etatJoursNa,
} from "../components/statistiques/joursNa";

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

// Réponse reçue : `cle` dit à quelle demande elle répond.
const AUCUNE = { cle: "", jours: [], erreur: "" };

// Jours NA de la période et leurs écritures ; celluleIds ("1,4,9") limite les groupes, "" = périmètre entier.
export function useJoursNa({ du, au, celluleIds }, actif) {
    const [recu, setRecu] = useState(AUCUNE);
    const [enCours, setEnCours] = useState(false);
    const [essai, setEssai] = useState(0);
    const cle = cleJoursNa({ du, au, celluleIds });

    useEffect(() => {
        if (!actif) return undefined;
        const ctrl = new AbortController();
        (async () => {
            try {
                setEnCours(true);
                const res = await fetch(construireUrl("/jours-na", { du, au, celluleIds }), {
                    headers: authHeaders(),
                    signal: ctrl.signal,
                });
                if (handleUnauthorized(res)) return;
                // 403 sous sélection : une cellule choisie n'est plus accessible.
                if (res.status === 403 && celluleIds) throw new Error(CELLULE_REFUSEE);
                // 403 sans sélection = aucune cellule accessible : aucun jour NA à gérer.
                if (res.status !== 403 && !res.ok) throw new Error(await messageErreur(res));
                const body = res.ok ? await res.json() : [];
                if (ctrl.signal.aborted) return;
                setRecu({ cle, jours: Array.isArray(body) ? body : [], erreur: "" });
            } catch (err) {
                if (err.name === "AbortError" || ctrl.signal.aborted) return;
                setRecu({ cle, jours: [], erreur: err.message || "Échec du chargement des jours NA" });
            } finally {
                if (!ctrl.signal.aborted) setEnCours(false);
            }
        })();
        return () => ctrl.abort();
    }, [du, au, celluleIds, cle, actif, essai]);

    // Demande changée ou hook désactivé : la réponse précédente est oubliée.
    useEffect(() => () => setRecu(AUCUNE), [cle, actif]);

    const { jours, loading, error } = etatJoursNa(recu, cle, actif, enCours);

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
