// Logique pure des jours NA (sans DOM ni réseau) : testée par joursNa.test.js.
import { erreurPeriode, versYmd } from "./format.js";

export const MOTIF_MAX = 200;

// Erreur d'écriture : statut HTTP, code métier et cellules en conflit (409).
export class ErreurJoursNa extends Error {
    constructor(message, { status = 0, code = "", cellules = [] } = {}) {
        super(message);
        this.name = "ErreurJoursNa";
        this.status = status;
        this.code = code;
        this.cellules = cellules;
    }
}

// Vrai si l'API refuse faute de confirmation (présences déjà saisies).
export const estConflitPresences = (err) =>
    err instanceof ErreurJoursNa &&
    err.status === 409 &&
    err.code === "PRESENCES_EXISTANTES";

// 403 / 404 en écriture : les données affichées sont périmées.
export const estDonneePerimee = (err) =>
    err instanceof ErreurJoursNa && (err.status === 403 || err.status === 404);

// Groupe NA couvrant cette cellule à cette date, ou null.
export const trouverJourNa = (jours, date, celluleId) =>
    jours.find(
        (j) =>
            j.date === date &&
            j.cellules?.some((c) => String(c.id) === String(celluleId))
    ) ?? null;

// 403 en lecture sous sélection de cellules.
export const CELLULE_REFUSEE =
    "Une cellule sélectionnée n'est plus accessible. Actualisez la page pour mettre à jour la liste des cellules.";

// Identifie une demande de jours NA (période et cellules).
export const cleJoursNa = ({ du, au, celluleIds }) => `${du}|${au}|${celluleIds ?? ""}`;

// Vue du hook : « chargement » tant que la réponse reçue n'est pas celle de la demande en cours.
export function etatJoursNa(recu, cle, actif, enCours) {
    const aJour = actif && recu.cle === cle;
    return {
        jours: aJour ? recu.jours : [],
        error: aJour ? recu.erreur : "",
        loading: actif && (enCours || !aJour),
    };
}

// Erreurs du formulaire par champ (objet vide si valide).
export function erreursJourNa({ date, motif, portee, choix }) {
    const e = {};
    if (!date) e.date = "Choisissez la date du jour NA.";
    const m = motif.trim();
    if (!m) e.motif = "Décrivez l'autre activité de ce jour-là.";
    else if (m.length > MOTIF_MAX) e.motif = `${MOTIF_MAX} caractères au maximum.`;
    if (portee === "choisies" && choix.size === 0)
        e.cellules = "Cochez au moins une cellule.";
    return e;
}

// Corps de requête : POST { date, motif, toutes | celluleIds }, PATCH { motif, celluleIds } (pas de `toutes`).
export function corpsJourNa({ edition, date, motif, portee, choix, cellules, confirmer }) {
    const m = motif.trim();
    let base;
    if (edition) {
        const celluleIds = portee === "toutes" ? cellules.map((c) => c.id) : [...choix];
        base = { motif: m, celluleIds };
    } else if (portee === "toutes") {
        base = { date, motif: m, toutes: true };
    } else {
        base = { date, motif: m, celluleIds: [...choix] };
    }
    return confirmer ? { ...base, confirmer: true } : base;
}

// Vrai si la date est hors de la période affichée.
export const horsPeriode = (date, { du, au }) => Boolean(date) && (date < du || date > au);

// Période élargie jusqu'à la date ; sinon le mois de la date si la limite de jours est dépassée.
export function periodeIncluant({ du, au }, date) {
    const elargie = { du: date < du ? date : du, au: date > au ? date : au };
    if (!erreurPeriode(elargie.du, elargie.au)) return elargie;
    const [a, m] = date.split("-").map(Number);
    return { du: versYmd(new Date(a, m - 1, 1)), au: versYmd(new Date(a, m, 0)) };
}
