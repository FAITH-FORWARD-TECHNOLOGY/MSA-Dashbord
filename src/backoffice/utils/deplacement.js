// Logique pure du déplacement de membres entre cellules (CEL-4).

// Le responsable reste sur place : il n'est pas sélectionnable.
export const estResponsable = (user, leaderId) => leaderId != null && user.id === leaderId;

// Basculer un membre dans la sélection (ensemble d'ids, jamais muté).
export function basculer(selection, id) {
    const suivante = new Set(selection);
    if (suivante.has(id)) suivante.delete(id);
    else suivante.add(id);
    return suivante;
}

// Ids sélectionnables parmi la liste affichée.
export const idsSelectionnables = (affiches, leaderId) =>
    affiches.filter((u) => !estResponsable(u, leaderId)).map((u) => u.id);

export function toutEstSelectionne(selection, affiches, leaderId) {
    const ids = idsSelectionnables(affiches, leaderId);
    return ids.length > 0 && ids.every((id) => selection.has(id));
}

// « Tout sélectionner » agit sur la liste affichée : tout coché -> on décoche ces membres, sinon on les coche.
export function basculerTout(selection, affiches, leaderId) {
    const ids = idsSelectionnables(affiches, leaderId);
    const suivante = new Set(selection);
    if (toutEstSelectionne(selection, affiches, leaderId)) ids.forEach((id) => suivante.delete(id));
    else ids.forEach((id) => suivante.add(id));
    return suivante;
}

// Retire de la sélection les membres qui ne sont plus dans la cellule.
export function purgerSelection(selection, users) {
    const presents = new Set(users.map((u) => u.id));
    return new Set([...selection].filter((id) => presents.has(id)));
}

// Corps envoyé : liste (sélection) ou « tous ».
export function corpsDeplacement({ celluleCibleId, ids, tous }) {
    const cible = Number(celluleCibleId);
    return tous ? { celluleCibleId: cible, tous: true } : { celluleCibleId: cible, userIds: [...ids] };
}

export const libelleNombreMembres = (n) => `${n} membre${n > 1 ? "s" : ""}`;

export const libelleSelection = (n) => `${n} sélectionné${n > 1 ? "s" : ""}`;

export const libelleRecap = (n, source, cible) =>
    `${libelleNombreMembres(n)} de ${source} vers ${cible}. Ils recevront une notification. Les présences passées restent dans ${source}.`;

// Résultat : « N membres déplacés vers B » (+ ignorés avec raison).
export function libelleResultat(res) {
    const n = res?.deplaces ?? 0;
    const principal = `${libelleNombreMembres(n)} déplacé${n > 1 ? "s" : ""} vers ${res?.cible?.name ?? "la cellule cible"}`;
    const ignores = res?.ignores ?? [];
    if (ignores.length === 0) return principal;
    const raisons = [...new Set(ignores.map((i) => i.raison))].join(", ");
    return `${principal} · ${ignores.length} ignoré${ignores.length > 1 ? "s" : ""} (${raisons})`;
}

// Cellules proposées : actives, sauf la courante, filtrées par la recherche.
export function cellulesCibles(cellules, courantId, recherche) {
    const terme = recherche.trim().toLowerCase();
    return cellules
        .filter((c) => c.isActive !== false && c.id !== Number(courantId))
        .filter((c) => !terme || (c.name ?? "").toLowerCase().includes(terme))
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "fr"));
}
