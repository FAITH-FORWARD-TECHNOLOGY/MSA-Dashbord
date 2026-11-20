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

export const MESSAGE_MDP_FAIBLE = "Mot de passe trop faible : choisissez-en un plus difficile à deviner.";

export function motDePasseCommunFaible(mdp) {
    const m = String(mdp ?? "")
        .trim()
        .toLowerCase();
    if (MDP_FAIBLES.has(m)) return true;
    const c = Array.from(m);
    if (c.length > 0 && c.every((x) => x === c[0])) return true;
    if (/^\d+$/.test(m) && c.length > 1) {
        const d = c.map(Number);
        const pas = d[1] - d[0];
        return (pas === 1 || pas === -1) && d.every((x, i) => i === 0 || x - d[i - 1] === pas);
    }
    return false;
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
