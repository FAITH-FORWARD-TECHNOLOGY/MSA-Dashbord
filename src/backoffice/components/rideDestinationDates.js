// Bornes d'un événement de covoiturage : jours d'Abidjan (UTC+0, sans heure
// d'été), quel que soit le fuseau de l'ordinateur de l'admin.

const JOUR = /^\d{4}-\d{2}-\d{2}$/;

const instant = (jour, heure) => {
    if (!JOUR.test(jour ?? "")) return null;
    const date = new Date(`${jour}T${heure}Z`);
    // Refuse aussi les dates inexistantes (2026-02-30).
    return isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== jour
        ? null
        : date.toISOString();
};

// Début : 00:00:00 à Abidjan le jour choisi (null si jour vide ou invalide).
export const debutJourAbidjan = (jour) => instant(jour, "00:00:00.000");

// Fin : 23:59:59 à Abidjan le jour choisi (null si jour vide ou invalide).
export const finJourAbidjan = (jour) => instant(jour, "23:59:59.000");

// Jour d'Abidjan (AAAA-MM-JJ) d'un instant de l'API, pour un champ date.
export const jourAbidjan = (valeur) => {
    if (!valeur) return "";
    const date = new Date(valeur);
    return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};
