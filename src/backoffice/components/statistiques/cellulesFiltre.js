// Logique pure du filtre multi-cellules (sans DOM ni réseau) : testée par cellulesFiltre.test.js.
// Contrat : docs-MSA-backend/statistiques-multi-cellules-2026-11-12.md

export const LIBELLE_TOUTES = "Toutes les cellules";
// Limite de l'API : au-delà, la requête est refusée (400).
export const MAX_CELLULES = 100;

// "?du=…&celluleIds=1,4,9" sans les paramètres vides ; "" si aucun.
export function chaineRequete(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    // Les virgules restent lisibles, comme dans le contrat.
    const s = qs.toString().replaceAll("%2C", ",");
    return s ? `?${s}` : "";
}

// Sélection -> valeur de `celluleIds` ; "" = toutes (paramètre non envoyé).
export function parametreCelluleIds(selection) {
    const ids = (selection ?? [])
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0);
    return [...new Set(ids)].join(",");
}

// Sélection limitée aux cellules encore proposées (évite un 403 après rechargement).
export function selectionValide(selection, cellules) {
    const connus = new Set(cellules.map((c) => Number(c.id)));
    return selection.filter((id) => connus.has(Number(id)));
}

// Libellé résumé : « Toutes les cellules », le nom, ou « N cellules ».
export function libelleCellules(selection, cellules) {
    if (selection.length === 0) return LIBELLE_TOUTES;
    if (selection.length > 1) return `${selection.length} cellules`;
    const cellule = cellules.find((c) => Number(c.id) === Number(selection[0]));
    return cellule?.name ?? "1 cellule";
}

// Coche ou décoche une cellule ; [] = toutes. Tout cocher revient à « Toutes ».
export function basculerCellule(selection, id, cellules) {
    const cle = Number(id);
    const actuelle = new Set(selection.map(Number));
    if (actuelle.has(cle)) actuelle.delete(cle);
    else actuelle.add(cle);
    const suite = cellules.map((c) => Number(c.id)).filter((i) => actuelle.has(i));
    if (suite.length === cellules.length) return [];
    // Au-delà de la limite de l'API, la sélection ne bouge pas.
    if (suite.length > MAX_CELLULES) return selection;
    return suite;
}

const normaliser = (s) =>
    String(s ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim();

// Cellules dont le nom contient la recherche (sans accents ni casse).
export function filtrerCellules(cellules, recherche) {
    const r = normaliser(recherche);
    if (!r) return cellules;
    return cellules.filter((c) => normaliser(c.name).includes(r));
}
