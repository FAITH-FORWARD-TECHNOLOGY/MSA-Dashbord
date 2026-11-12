import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, authHeaders, handleUnauthorized } from "../config/api";
import { chaineRequete } from "../components/statistiques/cellulesFiltre";
import { messageErreur } from "./useStatistiques";
import {
    octetsDepuisBase64,
    parametresCommunes,
    parametresQuartiers,
    parametresRecherche,
    parametresRessemblants,
    trierPays,
} from "../utils/referentiel";

// Référentiel des lieux : contrat dans docs-MSA-backend/referentiel-lieux-2026-11-12.md.
const ADMIN = "/zones/admin";

// Erreur d'API : message du serveur affichable tel quel, et code HTTP.
class ErreurApi extends Error {
    constructor(message, statut) {
        super(message);
        this.statut = statut;
    }
}

// fetch dont l'échec réseau (« Failed to fetch ») devient un message lisible.
async function requeteReseau(url, options) {
    try {
        return await fetch(url, options);
    } catch (err) {
        if (err.name === "AbortError") throw err;
        throw new ErreurApi("Connexion au serveur impossible. Vérifiez votre réseau, puis réessayez.", 0);
    }
}

// Appel JSON authentifié ; lève ErreurApi avec le message du serveur.
export async function appelApi(chemin, { methode = "GET", corps, signal } = {}) {
    const res = await requeteReseau(`${API_BASE_URL}${chemin}`, {
        method: methode,
        headers: authHeaders(),
        body: corps === undefined ? undefined : JSON.stringify(corps),
        signal,
    });
    if (handleUnauthorized(res)) throw new ErreurApi("Session expirée. Reconnectez-vous.", 401);
    if (!res.ok) throw new ErreurApi(await messageErreur(res), res.status);
    return res.status === 204 ? null : res.json();
}

// Lecture d'une route (chemin + paramètres) ; 403 signalé à part.
function useLecture(chemin, params, actif = true) {
    const [etat, setEtat] = useState({ data: null, loading: actif, error: "", interdit: false });
    const [essai, setEssai] = useState(0);
    const requete = chaineRequete(params ?? {});

    useEffect(() => {
        if (!actif) {
            setEtat({ data: null, loading: false, error: "", interdit: false });
            return undefined;
        }
        const ctrl = new AbortController();
        setEtat((e) => ({ ...e, loading: true, error: "", interdit: false }));
        appelApi(`${chemin}${requete}`, { signal: ctrl.signal })
            .then((data) => setEtat({ data, loading: false, error: "", interdit: false }))
            .catch((err) => {
                if (err.name === "AbortError" || err.statut === 401) return;
                setEtat({
                    data: null,
                    loading: false,
                    error: err.statut === 403 ? "" : err.message || "Échec du chargement",
                    interdit: err.statut === 403,
                });
            });
        return () => ctrl.abort();
    }, [chemin, requete, actif, essai]);

    const recharger = useCallback(() => setEssai((n) => n + 1), []);
    return { ...etat, recharger };
}

// Valeur retardée : évite une requête par frappe dans les champs de recherche.
export function useValeurRetardee(valeur, delai = 300) {
    const [retardee, setRetardee] = useState(valeur);
    useEffect(() => {
        const t = setTimeout(() => setRetardee(valeur), delai);
        return () => clearTimeout(t);
    }, [valeur, delai]);
    return retardee;
}

// Pays triés par nom (listes déroulantes des filtres et des formulaires).
export function usePaysListe(actif = true) {
    const lecture = useLecture("/pays", null, actif);
    return { ...lecture, pays: trierPays(Array.isArray(lecture.data) ? lecture.data : []) };
}

// Communes d'un pays [{ id, nom }] ; inactif sans pays.
export function useCommunesDuPays(paysId) {
    const actif = paysId !== "" && paysId !== null && paysId !== undefined;
    const lecture = useLecture(`/zones/pays/${actif ? paysId : 0}/communes`, null, actif);
    return { ...lecture, communes: Array.isArray(lecture.data) ? lecture.data : [] };
}

export function useCommunes(filtres, actif = true) {
    return useLecture(`${ADMIN}/communes`, parametresCommunes(filtres), actif);
}

export function useQuartiers(filtres, actif = true) {
    return useLecture(`${ADMIN}/quartiers`, parametresQuartiers(filtres), actif);
}

// Quartiers validés ressemblant à la saisie (8 au plus) ; inactif si `actif` est faux.
export function useRechercheQuartiers(filtres, actif = true) {
    const lecture = useLecture("/zones/quartiers/recherche", parametresRecherche(filtres), actif);
    return { ...lecture, quartiers: Array.isArray(lecture.data) ? lecture.data : [] };
}

// Quartiers de la commune qui ressemblent au nom saisi ; inactif tant que la saisie est incomplète.
export function useRessemblants({ communeId, nom }) {
    const params = parametresRessemblants({ communeId, nom });
    const lecture = useLecture("/zones/quartiers/ressemblants", params, params !== null);
    return { ...lecture, ressemblants: Array.isArray(lecture.data) ? lecture.data : [] };
}

export const creerCommune = (corps) => appelApi(`${ADMIN}/communes`, { methode: "POST", corps });
export const modifierCommune = (id, corps) => appelApi(`${ADMIN}/communes/${id}`, { methode: "PATCH", corps });
export const supprimerCommune = (id) => appelApi(`${ADMIN}/communes/${id}`, { methode: "DELETE" });

export const creerQuartier = (corps) => appelApi(`${ADMIN}/quartiers`, { methode: "POST", corps });
export const modifierQuartier = (id, corps) => appelApi(`${ADMIN}/quartiers/${id}`, { methode: "PATCH", corps });
export const supprimerQuartier = (id) => appelApi(`${ADMIN}/quartiers/${id}`, { methode: "DELETE" });
export const validerQuartier = (id, corps = {}) =>
    appelApi(`${ADMIN}/quartiers/${id}/valider`, { methode: "POST", corps });
export const apercuFusion = (id, cibleId) =>
    appelApi(`${ADMIN}/quartiers/${id}/fusion/apercu${chaineRequete({ cibleId })}`);
export const fusionnerQuartier = (id, cibleId) =>
    appelApi(`${ADMIN}/quartiers/${id}/fusionner`, { methode: "POST", corps: { cibleId } });

// Propose un fichier au navigateur (modèle d'import, rapport).
export function proposerFichier(blob, nom) {
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nom;
    lien.style.visibility = "hidden";
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    // Laisse le temps au navigateur de démarrer le téléchargement.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Modèle d'import (type = "communes" ou "quartiers").
export async function telechargerModele(type) {
    const res = await requeteReseau(`${API_BASE_URL}${ADMIN}/${type}/import/modele`, {
        headers: authHeaders({ accept: "*/*" }),
    });
    if (handleUnauthorized(res)) return;
    if (!res.ok) throw new ErreurApi(await messageErreur(res), res.status);
    proposerFichier(await res.blob(), `modele-${type}.xlsx`);
}

// Envoi du fichier : aperçu (rien n'est écrit) ou import définitif.
export async function envoyerImport(type, fichier, { apercu }) {
    const corps = new FormData();
    corps.append("fichier", fichier);
    // Pas de Content-Type : le navigateur pose la frontière multipart.
    const { "Content-Type": _json, ...entetes } = authHeaders();
    const res = await requeteReseau(`${API_BASE_URL}${ADMIN}/${type}/import${apercu ? "/apercu" : ""}`, {
        method: "POST",
        headers: entetes,
        body: corps,
    });
    if (handleUnauthorized(res)) throw new ErreurApi("Session expirée. Reconnectez-vous.", 401);
    if (!res.ok) throw new ErreurApi(await messageErreur(res), res.status);
    return res.json();
}

// Rapport final de l'import (classeur renvoyé en base64).
export function telechargerRapport(rapport) {
    proposerFichier(new Blob([octetsDepuisBase64(rapport.base64)], { type: rapport.type }), rapport.nom);
}
