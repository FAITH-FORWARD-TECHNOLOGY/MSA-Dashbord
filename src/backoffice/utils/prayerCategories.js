// Règles du réglage des sujets de prière (page « Sujets de prière »).
export const ARCHIVAGE_KEY = "prieres_archivage_jours";
export const ARCHIVAGE_DEFAUT = 30;
export const ARCHIVAGE_MIN = 1;
export const ARCHIVAGE_MAX = 3650;
export const LIBELLE_MAX = 40;
export const CLE_AUTRE = "Autre";

// Message d'erreur si le délai saisi est invalide, sinon chaîne vide.
export function validerJours(value) {
    const texte = String(value).trim();
    if (!/^\d+$/.test(texte)) return "Saisissez un nombre entier de jours.";
    const n = Number(texte);
    if (n < ARCHIVAGE_MIN || n > ARCHIVAGE_MAX) {
        return `Le délai doit être compris entre ${ARCHIVAGE_MIN} et ${ARCHIVAGE_MAX} jours.`;
    }
    return "";
}

// Message d'erreur si le libellé est invalide, sinon chaîne vide.
export function validerLibelle(value) {
    const texte = value.trim();
    if (!texte) return "Le libellé est obligatoire.";
    if (texte.length > LIBELLE_MAX) {
        return `Le libellé ne doit pas dépasser ${LIBELLE_MAX} caractères.`;
    }
    return "";
}

// « Autre » est verrouillée : ni renommage ni désactivation.
export const estVerrouillee = (categorie) => categorie.cle === CLE_AUTRE;
