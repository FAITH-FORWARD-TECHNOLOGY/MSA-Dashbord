// Logique pure du référentiel des lieux (contrat : docs-MSA-backend/referentiel-lieux-2026-11-12.md), testée par referentiel.test.js.

export const STATUT_VALIDE = "VALIDE";
export const STATUT_EN_ATTENTE = "A_VALIDER";
export const LIMITE_PAGE = 50;
// Recherche de quartiers : le serveur renvoie 8 résultats au plus.
export const MAX_RESULTATS = 8;
export const NOM_MIN = 2;
export const NOM_MAX = 80;
export const TAILLE_MAX_IMPORT = 2 * 1024 * 1024;
// Valeur du filtre « Quartier » des utilisateurs : aucun lieu ou commune seule.
export const SANS_QUARTIER = "sans";

const pluriel = (n, mot, marque = "s") => `${n} ${mot}${n > 1 ? marque : ""}`;

export const libelleQuartiers = (n) => pluriel(n, "quartier");
export const libelleCommunes = (n) => pluriel(n, "commune");

export const libelleStatut = (statut) => (statut === STATUT_EN_ATTENTE ? "En attente" : "Validé");
export const tonStatut = (statut) => (statut === STATUT_EN_ATTENTE ? "ambre" : "vert");

// Nom saisi : espaces de bord retirés, espaces multiples réduits.
export function nettoyerNom(nom) {
    return String(nom ?? "").replace(/\s+/g, " ").trim();
}

// Message d'erreur du nom (même règle que le serveur), "" s'il est valide.
export function erreurNom(nom) {
    const n = nettoyerNom(nom);
    if (!n) return "Le nom est requis.";
    if (n.length < NOM_MIN || n.length > NOM_MAX) return `Nom : ${NOM_MIN} à ${NOM_MAX} caractères`;
    return "";
}

const idOuVide = (v) => (v === "" || v === null || v === undefined ? undefined : String(v));
const pageOuVide = (page) => (page && page > 1 ? page : undefined);

// Paramètres de GET /zones/admin/communes (vides omis par chaineRequete).
export function parametresCommunes({ paysId = "", q = "", page = 1, limite = LIMITE_PAGE } = {}) {
    return { paysId: idOuVide(paysId), q: nettoyerNom(q), page: pageOuVide(page), limite };
}

// Paramètres de GET /zones/admin/quartiers ; la commune prime sur le pays.
export function parametresQuartiers({
    paysId = "",
    communeId = "",
    statut = "",
    q = "",
    page = 1,
    limite = LIMITE_PAGE,
} = {}) {
    const commune = idOuVide(communeId);
    return {
        paysId: commune ? undefined : idOuVide(paysId),
        communeId: commune,
        statut: statut === STATUT_VALIDE || statut === STATUT_EN_ATTENTE ? statut : undefined,
        q: nettoyerNom(q),
        page: pageOuVide(page),
        limite,
    };
}

// Paramètres de GET /zones/quartiers/recherche (champ « Quartier de résidence »).
export function parametresRecherche({ q = "", paysId = "", communeId = "" } = {}) {
    return { q: nettoyerNom(q), paysId: idOuVide(paysId), communeId: idOuVide(communeId) };
}

// Paramètres de GET /zones/admin/quartiers pour le champ « Quartier » d'un admin (tous statuts).
export function parametresRechercheAdmin({ q = "" } = {}) {
    return parametresQuartiers({ q, limite: MAX_RESULTATS });
}

// Suggestions du champ « Quartier » : liste publique (tableau) ou admin ({ total, quartiers }).
export function resultatsRecherche(data) {
    if (Array.isArray(data)) return { quartiers: data, tronquee: data.length >= MAX_RESULTATS };
    const quartiers = Array.isArray(data?.quartiers) ? data.quartiers : [];
    return { quartiers, tronquee: (data?.total ?? 0) > quartiers.length };
}

// Paramètres de GET /zones/quartiers/ressemblants ; null tant que la saisie est incomplète.
export function parametresRessemblants({ communeId = "", nom = "" } = {}) {
    const n = nettoyerNom(nom);
    if (!idOuVide(communeId) || n.length < NOM_MIN) return null;
    return { communeId: String(communeId), nom: n };
}

export function nombrePages(total, limite = LIMITE_PAGE) {
    return Math.max(1, Math.ceil((total ?? 0) / (limite || LIMITE_PAGE)));
}

const parNom = (a, b) => String(a.nom).localeCompare(String(b.nom), "fr", { sensitivity: "base" });

// Pays triés par nom (GET /pays les renvoie par date de création).
export function trierPays(pays) {
    return [...(pays ?? [])].sort(parNom);
}

// Ressemblant que le serveur traiterait comme la saisie (création refusée), ou null.
export function ressemblantIdentique(ressemblants) {
    return (ressemblants ?? []).find((r) => r.identique) ?? null;
}

// Quartiers que l'on peut conserver lors d'une fusion : validés, même commune, sans le quartier supprimé.
export function candidatsFusion(quartiers, source) {
    if (!source) return [];
    return (quartiers ?? []).filter(
        (q) =>
            q.id !== source.id &&
            (q.statut ?? STATUT_VALIDE) === STATUT_VALIDE &&
            (q.commune?.id ?? null) === (source.commune?.id ?? null)
    );
}

// Phrase de confirmation de la fusion, à partir de l'aperçu du serveur.
export function phraseFusion(apercu) {
    if (!apercu) return "";
    const n = apercu.membresDeplaces ?? 0;
    const membres =
        n === 0
            ? "Aucun membre n'est rattaché à ce quartier."
            : n === 1
              ? "1 membre sera déplacé"
              : `${n} membres seront déplacés`;
    return n === 0 ? membres : `${membres} vers « ${apercu.cible.nom} » (${apercu.commune.nom}).`;
}

// ───────────────────────────── Imports ─────────────────────────────

export const IMPORTS = {
    communes: {
        extensions: [".xlsx"],
        formats: "Excel (.xlsx)",
        bouton: "Importer (Excel)",
        colonnes: ["Pays", "Commune"],
        nom: "commune",
        feminin: true,
    },
    quartiers: {
        extensions: [".xlsx", ".csv"],
        formats: "Excel (.xlsx) ou CSV",
        bouton: "Importer (Excel ou CSV)",
        colonnes: ["Pays", "Commune", "Quartier"],
        nom: "quartier",
        feminin: false,
    },
};

// Vérification locale du fichier avant envoi : "" s'il est acceptable.
export function erreurFichier(fichier, type) {
    const regle = IMPORTS[type];
    if (!fichier) return "Choisissez un fichier.";
    const nom = String(fichier.name ?? "").toLowerCase();
    if (!regle.extensions.some((ext) => nom.endsWith(ext))) {
        return `Format non accepté : un fichier ${regle.formats} est attendu.`;
    }
    if (fichier.size === 0) return "Fichier vide : aucune ligne à importer";
    if (fichier.size > TAILLE_MAX_IMPORT) return "Fichier trop volumineux (2 Mo au plus)";
    return "";
}

export const CLASSE_A_CREER = "a-creer";
export const CLASSE_EXISTANT = "existant";
export const CLASSE_DOUBLON = "doublon";
export const CLASSE_ERREUR = "erreur";

const CLASSES = { IMPORTE: CLASSE_A_CREER, IGNORE: CLASSE_EXISTANT, REJETE: CLASSE_ERREUR };
// Raison donnée par le serveur à une ligne répétée plus haut dans le fichier.
const RAISON_DOUBLON = /^Doublon dans le fichier/i;

// Classe d'une ligne d'après son statut serveur (inconnu = erreur) ; les ignorées se séparent selon la raison.
export function classeLigne(ligne) {
    const classe = CLASSES[ligne?.statut] ?? CLASSE_ERREUR;
    return classe === CLASSE_EXISTANT && RAISON_DOUBLON.test(String(ligne?.raison ?? "")) ? CLASSE_DOUBLON : classe;
}

// Lignes réparties en « à créer », « déjà existants », « doublons dans le fichier » et « en erreur ».
export function classerApercu(lignes) {
    const classes = { [CLASSE_A_CREER]: [], [CLASSE_EXISTANT]: [], [CLASSE_DOUBLON]: [], [CLASSE_ERREUR]: [] };
    for (const l of lignes ?? []) classes[classeLigne(l)].push(l);
    return classes;
}

// Lignes d'une classe, erreurs en tête pour « toutes » (ce que l'admin doit corriger d'abord).
export function lignesVisibles(lignes, classe = "") {
    const toutes = lignes ?? [];
    if (classe) return toutes.filter((l) => classeLigne(l) === classe);
    const rang = { [CLASSE_ERREUR]: 0, [CLASSE_DOUBLON]: 1, [CLASSE_EXISTANT]: 2, [CLASSE_A_CREER]: 3 };
    return [...toutes].sort((a, b) => rang[classeLigne(a)] - rang[classeLigne(b)] || a.ligne - b.ligne);
}

// Compteurs de l'aperçu ou du rapport ; les ignorés sont séparés grâce aux raisons des lignes.
export function compteursImport(resume, type, termine = false, lignes = []) {
    const { feminin } = IMPORTS[type];
    const e = feminin ? "e" : "";
    const accord = (n) => (n > 1 ? `${e}s` : e);
    const r = resume ?? {};
    const importes = r.importes ?? 0;
    const ignores = r.ignores ?? 0;
    const rejetes = r.rejetes ?? 0;
    const doublons = Math.min(ignores, classerApercu(lignes)[CLASSE_DOUBLON].length);
    const existants = ignores - doublons;
    // Après l'import : « 2 ignorés (déjà existants) ».
    const ignore = (n, raison) => (termine ? `ignoré${accord(n)} (${raison})` : raison);
    return [
        {
            classe: CLASSE_A_CREER,
            nombre: importes,
            libelle: termine ? `importé${accord(importes)}` : "à créer",
            ton: "vert",
        },
        {
            classe: CLASSE_EXISTANT,
            nombre: existants,
            libelle: ignore(existants, `déjà existant${accord(existants)}`),
            ton: "gris",
        },
        {
            classe: CLASSE_DOUBLON,
            nombre: doublons,
            libelle: ignore(doublons, `doublon${doublons > 1 ? "s" : ""} dans le fichier`),
            ton: "ambre",
        },
        { classe: CLASSE_ERREUR, nombre: rejetes, libelle: "en erreur", ton: "rouge" },
    ];
}

// Libellé du bouton de validation : « Importer 3 communes ».
export function libelleValidation(resume, type) {
    const n = resume?.importes ?? 0;
    return n === 0 ? "Rien à importer" : `Importer ${pluriel(n, IMPORTS[type].nom)}`;
}

// Résultat d'une ligne : « À créer » dans l'aperçu, « Importé » une fois l'import fait.
export const libelleStatutLigne = (ligne, termine = false) =>
    ({
        [CLASSE_A_CREER]: termine ? "Importé" : "À créer",
        [CLASSE_EXISTANT]: "Déjà existant",
        [CLASSE_DOUBLON]: "Doublon dans le fichier",
        [CLASSE_ERREUR]: "En erreur",
    })[classeLigne(ligne)];

// Octets d'un rapport renvoyé en base64 (classeur Excel).
export function octetsDepuisBase64(base64) {
    const binaire = atob(String(base64 ?? ""));
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
    return octets;
}

// ─────────────────────────── Utilisateurs ───────────────────────────

// Lieu d'un utilisateur (champ `lieu`, sinon `zone`) : { quartier, commune, pays } ou null.
export function lieuUtilisateur(user) {
    const l = user?.lieu;
    if (l) return { quartier: l.quartier ?? null, commune: l.commune ?? null, pays: l.pays ?? null };
    const z = user?.zone;
    if (!z) return null;
    if (z.type === "QUARTIER") {
        return {
            quartier: { id: z.id, nom: z.nom, statut: z.statut },
            commune: z.parent ? { id: z.parent.id, nom: z.parent.nom } : null,
            pays: null,
        };
    }
    return { quartier: null, commune: { id: z.id, nom: z.nom }, pays: null };
}

// "Riviera 2, Cocody", "Cocody (commune seule)" ou "" sans lieu.
export function libelleLieuUtilisateur(user) {
    const lieu = lieuUtilisateur(user);
    if (!lieu) return "";
    if (lieu.quartier) return [lieu.quartier.nom, lieu.commune?.nom].filter(Boolean).join(", ");
    return lieu.commune ? `${lieu.commune.nom} (commune seule)` : "";
}

// Quartier d'un utilisateur au format du champ de saisie, ou null.
export function quartierUtilisateur(user) {
    const lieu = lieuUtilisateur(user);
    if (!lieu?.quartier) return null;
    return { id: lieu.quartier.id, nom: lieu.quartier.nom, statut: lieu.quartier.statut, commune: lieu.commune };
}

// "Riviera 2, Cocody" pour un quartier du champ de saisie ou de la recherche.
export function libelleQuartier(quartier) {
    if (!quartier) return "";
    return [quartier.nom, quartier.commune?.nom].filter(Boolean).join(", ");
}

// Champs de lieu à envoyer avec l'utilisateur ; {} si le quartier n'a pas changé.
export function corpsLieu(quartier, initial = null) {
    const avant = initial?.id ?? null;
    const apres = quartier?.id ?? null;
    if (avant === apres) return {};
    // Quartier retiré : le lieu est effacé.
    return apres === null ? { communeId: null } : { quartierId: apres };
}

// Paramètres de GET /users pour le filtre « Quartier ».
export function parametresUtilisateurs(filtre) {
    if (filtre === SANS_QUARTIER) return { sansQuartier: "true" };
    const id = Number(filtre?.id);
    return Number.isInteger(id) && id > 0 ? { quartierId: String(id) } : {};
}

// Libellé du filtre actif, "" sans filtre.
export function libelleFiltreQuartier(filtre) {
    if (filtre === SANS_QUARTIER) return "Sans quartier renseigné";
    return libelleQuartier(filtre);
}
