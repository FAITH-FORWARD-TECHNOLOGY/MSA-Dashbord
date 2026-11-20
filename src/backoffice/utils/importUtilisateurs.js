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

// Le bouton « Importer » n'est actif que si tout est renseigné.
export function formulaireImportValide({ celluleId, paysId, motDePasse, confirmation, fichier }) {
    return Boolean(celluleId) && Boolean(paysId) && motDePasseValide(motDePasse, confirmation) && !erreurFichierUtilisateurs(fichier);
}
