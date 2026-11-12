// Logique pure de la répartition des membres par quartier (sans DOM ni réseau) : testée par repartition.test.js.

export const TOUS = "tous";
export const CLE_COMMUNE_SEULE = "commune-seule";
export const CLE_NON_RENSEIGNE = "non-renseigne";
export const LIBELLE_COMMUNE_SEULE = "Commune seule";
export const LIBELLE_NON_RENSEIGNE = "Non renseigné";
export const LIBELLE_AUCUN_LIEU = "Aucun lieu renseigné";

const fmtPart = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

// Tri par nombre de membres décroissant, puis par nom.
export function trierParMembres(noeuds, nom = (n) => n.nom) {
    return [...(noeuds ?? [])].sort(
        (a, b) => b.membres - a.membres || String(nom(a)).localeCompare(String(nom(b)), "fr")
    );
}

// Part d'un nœud dans le total : 0 à 100 (0 si le total est nul).
export function partDe(membres, total) {
    return total > 0 ? Math.min(100, (membres / total) * 100) : 0;
}

// "12,5 %" ; "—" si le total est nul.
export function libellePart(membres, total) {
    return total > 0 ? `${fmtPart.format(partDe(membres, total))} %` : "—";
}

export const libelleMembres = (n) => `${n} membre${n > 1 ? "s" : ""}`;

export const clePays = (p) => `p${p.id}`;
export const cleCommune = (p, c, rang) => `${clePays(p)}/c${c.id ?? `v${rang}`}`;

// Clés de tous les nœuds dépliables (bouton « Tout déplier »).
export function clesDepliables(pays) {
    return (pays ?? []).flatMap((p) => [
        clePays(p),
        ...p.communes.map((c, i) => cleCommune(p, c, i)),
    ]);
}

// Lignes visibles du tableau Pays → Commune → Quartier selon les nœuds ouverts.
export function lignesRepartition(pays, ouverts) {
    const lignes = [];
    for (const p of trierParMembres(pays)) {
        const kp = clePays(p);
        const paysOuvert = ouverts.has(kp);
        lignes.push({
            cle: kp,
            type: "pays",
            niveau: 0,
            libelle: p.nom,
            membres: p.membres,
            depliable: p.communes.length > 0 || p.aucunLieu > 0,
            ouvert: paysOuvert,
        });
        if (!paysOuvert) continue;
        // Communes et ligne « aucun lieu » triées ensemble.
        const enfants = [
            ...p.communes.map((c, i) => ({ c, cle: cleCommune(p, c, i), nom: c.libelle, membres: c.membres })),
            ...(p.aucunLieu > 0 ? [{ aucunLieu: true, nom: LIBELLE_AUCUN_LIEU, membres: p.aucunLieu }] : []),
        ];
        for (const e of trierParMembres(enfants)) {
            if (e.aucunLieu) {
                lignes.push({
                    cle: `${kp}/aucun-lieu`,
                    type: "aucun-lieu",
                    niveau: 1,
                    libelle: LIBELLE_AUCUN_LIEU,
                    membres: e.membres,
                    cible: { sansLieu: true, titre: LIBELLE_AUCUN_LIEU },
                });
                continue;
            }
            const ouvert = ouverts.has(e.cle);
            lignes.push({
                cle: e.cle,
                type: "commune",
                niveau: 1,
                libelle: e.c.libelle,
                membres: e.c.membres,
                depliable: e.c.quartiers.length > 0,
                ouvert,
            });
            if (!ouvert) continue;
            for (const q of trierParMembres(e.c.quartiers)) {
                // « Quartier non renseigné » : membres rattachés à la commune seule.
                const zoneId = q.nonRenseigne ? e.c.id : q.id;
                lignes.push({
                    cle: `${e.cle}/q${q.id ?? "aucun"}`,
                    type: "quartier",
                    niveau: 2,
                    libelle: q.nom,
                    membres: q.membres,
                    enAttente: Boolean(q.enAttente),
                    nonRenseigne: Boolean(q.nonRenseigne),
                    cible: zoneId ? { zoneId, titre: `${q.nom} — ${e.c.libelle}` } : null,
                });
            }
        }
    }
    return lignes;
}

// Pays ouverts par défaut, communes repliées.
export function ouvertureInitiale(pays) {
    return new Set((pays ?? []).map(clePays));
}

// Lieu d'un membre de cellule d'après sa zone (quartier, commune seule ou rien).
export function lieuDuMembre(membre) {
    const z = membre?.zone;
    if (!z) return { cle: CLE_NON_RENSEIGNE, libelle: LIBELLE_NON_RENSEIGNE, detail: "", enAttente: false };
    if (z.type === "QUARTIER") {
        return {
            cle: `q${z.id}`,
            libelle: z.nom,
            detail: z.parent?.nom ?? "",
            enAttente: z.statut === "A_VALIDER",
        };
    }
    return { cle: CLE_COMMUNE_SEULE, libelle: LIBELLE_COMMUNE_SEULE, detail: z.nom ?? "", enAttente: false };
}

// "Riviera 2 (Cocody)", "Commune seule (Cocody)" ou "Non renseigné".
export function libelleLieu(lieu) {
    return lieu.detail ? `${lieu.libelle} (${lieu.detail})` : lieu.libelle;
}

// Choix du filtre par quartier : quartiers triés par membres, puis commune seule et non renseigné.
export function optionsQuartiers(membres) {
    const parCle = new Map();
    for (const m of membres ?? []) {
        const lieu = lieuDuMembre(m);
        const o = parCle.get(lieu.cle) ?? {
            cle: lieu.cle,
            nom: lieu.cle.startsWith("q") ? libelleLieu(lieu) : lieu.libelle,
            membres: 0,
        };
        o.membres += 1;
        parCle.set(lieu.cle, o);
    }
    const speciales = [CLE_COMMUNE_SEULE, CLE_NON_RENSEIGNE];
    const quartiers = [...parCle.values()].filter((o) => !speciales.includes(o.cle));
    return [
        ...trierParMembres(quartiers),
        ...speciales.map((cle) => parCle.get(cle)).filter(Boolean),
    ];
}

// Membres d'un quartier (ou de « commune seule » / « non renseigné ») ; TOUS = sans filtre.
export function filtrerParQuartier(membres, cle) {
    if (!cle || cle === TOUS) return membres ?? [];
    return (membres ?? []).filter((m) => lieuDuMembre(m).cle === cle);
}

// Paramètres de la route des membres pour une cible du tableau ou de l'encart.
export function parametresMembres(cible, { paysId, celluleIds, page } = {}) {
    return {
        zoneId: cible.zoneId,
        sansLieu: cible.sansLieu ? "true" : undefined,
        communeSeule: cible.communeSeule ? "true" : undefined,
        // Le pays ne restreint que la liste « commune seule ».
        paysId: cible.communeSeule && paysId !== "" ? paysId : undefined,
        celluleIds,
        page: page && page > 1 ? page : undefined,
    };
}

// "Prénom Nom" sans espace superflu.
export const nomComplet = (m) => [m?.prenom, m?.nom].filter(Boolean).join(" ").trim();

// "repartition-quartiers-msa_2026-11-12.xlsx" (date locale).
export function nomFichierRepartition(date = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return `repartition-quartiers-msa_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.xlsx`;
}
