// Import d'utilisateurs par CSV : règles de saisie de la fenêtre (logique pure).
import { motDePasseValide } from "./motDePasse.js";

export const TAILLE_MAX = 2 * 1024 * 1024;

// Retire accents et casse pour la recherche.
const simple = (v = "") =>
    String(v)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim();

// Cellules actives seulement, triées par nom.
export function cellulesActives(cellules) {
    return (Array.isArray(cellules) ? cellules : [])
        .filter((c) => c && c.isActive !== false)
        .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "fr"));
}

// Cellules dont le nom contient la recherche (sans accents ni casse).
export function filtrerCellules(cellules, recherche) {
    const q = simple(recherche);
    return q ? cellules.filter((c) => simple(c.name).includes(q)) : cellules;
}

// Côte d'Ivoire par défaut, sinon le premier pays.
export function paysParDefaut(pays) {
    const liste = Array.isArray(pays) ? pays : [];
    const ci = liste.find((p) => String(p.code).toUpperCase() === "CI" || simple(p.nom).includes("ivoire"));
    return (ci ?? liste[0])?.id ?? "";
}

export function erreurFichierUtilisateurs(fichier) {
    if (!fichier) return "Choisissez un fichier CSV.";
    if (!/\.csv$/i.test(fichier.name)) return "Format non pris en charge : un fichier .csv est attendu.";
    if (fichier.size === 0) return "Le fichier est vide.";
    if (fichier.size > TAILLE_MAX) return "Fichier trop volumineux (2 Mo au plus).";
    return "";
}

// Mots de passe communs trop faciles à deviner (mêmes règles que le serveur).
export const MDP_COMMUN_MIN = 10;
export const MESSAGE_MDP_FAIBLE =
    "Mot de passe trop faible : 10 caractères au moins, avec au moins une lettre et un chiffre, " +
    "sans suite évidente (1234, azerty), sans bloc répété (12341234) " +
    "ni mots comme msa, jesus, eglise, password ou motdepasse.";

const MDP_FAIBLES = new Set([
    "123123123",
    "12345678",
    "123456789",
    "1234567890",
    "00000000",
    "11111111",
    "password",
    "motdepasse",
    "azerty123",
    "qwerty123",
    "msa12345",
]);

// Mots et suites de clavier refusés où qu'ils apparaissent (sans accents ni casse).
const MOTIFS_FAIBLES = ["msa", "jesus", "eglise", "password", "motdepasse", "azerty", "qwerty", "qsdfgh", "azertyuiop", "qwertyuiop"];

const estSuite = (c) => {
    if (c.length < 3) return false;
    const pas = c[1].charCodeAt(0) - c[0].charCodeAt(0);
    return Math.abs(pas) === 1 && c.every((x, i) => i === 0 || x.charCodeAt(0) - c[i - 1].charCodeAt(0) === pas);
};

export function motDePasseCommunFaible(mdp) {
    const m = String(mdp ?? "")
        .trim()
        .toLowerCase();
    if (Array.from(m).length < MDP_COMMUN_MIN) return true;
    if (!/\p{L}/u.test(m) || !/\d/.test(m)) return true;
    if (MDP_FAIBLES.has(m)) return true;
    const sansAccent = m.normalize("NFD").replace(/\p{M}/gu, "");
    if (MOTIFS_FAIBLES.some((x) => sansAccent.includes(x))) return true;
    // Bloc répété (12341234) ou doublons de suite (11223344).
    if (/^(.+?)\1+$/su.test(m)) return true;
    const c = Array.from(m);
    return estSuite(c.filter((x, i) => x !== c[i - 1]));
}

// Le bouton « Importer » n'est actif que si tout est renseigné.
export function formulaireImportValide({ celluleId, paysId, motDePasse, confirmation, fichier }) {
    return (
        Boolean(celluleId) &&
        Boolean(paysId) &&
        motDePasseValide(motDePasse, confirmation) &&
        !motDePasseCommunFaible(motDePasse) && !erreurFichierUtilisateurs(fichier)
    );
}
