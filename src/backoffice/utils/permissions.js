// Permissions du back-office : contrat dans docs-MSA-backend/contrat-ROLE-permissions.md.

export const CODE_ACCES = "bo.acces";
// Marqueur de route ou de lien réservé au super admin (rôles, journal).
export const SUPER_ADMIN = "super-admin";

// Route -> code « voir » du module (ordre : le premier préfixe qui correspond).
export const ROUTES_MODULES = [
    { chemin: "/users", code: "bo.utilisateurs.voir" },
    { chemin: "/cellules", code: "bo.cellules.voir" },
    // Pas de code dédié dans le contrat : rattaché au module Quartiers (réservé aux admins aujourd'hui).
    { chemin: "/membres-par-quartier", code: "bo.quartiers.voir" },
    { chemin: "/communes", code: "bo.communes.voir" },
    { chemin: "/quartiers", code: "bo.quartiers.voir" },
    { chemin: "/statistiques", code: "bo.statistiques.voir" },
    { chemin: "/export-donnees", code: "bo.export_donnees.voir" },
    { chemin: "/activites", code: "bo.activites.voir" },
    { chemin: "/categorie", code: "bo.categories.voir" },
    { chemin: "/pays", code: "bo.pays.voir" },
    { chemin: "/destinations", code: "bo.destinations.voir" },
    { chemin: "/reading-plans", code: "bo.plans.voir" },
    { chemin: "/daily-verse", code: "bo.verset.voir" },
    { chemin: "/communication", code: "bo.communication.voir" },
    { chemin: "/app-version", code: "bo.versions.voir" },
    { chemin: "/roles", code: SUPER_ADMIN },
    { chemin: "/journal", code: SUPER_ADMIN },
];

// Repli (serveur sans permissions) : ce qui n'était déjà visible que d'un admin.
const RESERVES_ADMIN = [
    "bo.communes.",
    "bo.quartiers.",
    "bo.export_donnees.",
    "bo.utilisateurs.mot_de_passe",
];

const estReserveAdmin = (code) => RESERVES_ADMIN.some((p) => code.startsWith(p));

// Le serveur envoie `permissions` : sinon ancien modèle (role USER / ADMIN).
export const modeRoles = (session) => Array.isArray(session?.permissions);

// Accès de la session ; `session` = connexion aplatie (user.role, superAdmin, permissions).
export function creerAcces(session) {
    const nouveau = modeRoles(session);
    const superAdmin = nouveau ? session.superAdmin === true : session?.role === "ADMIN";
    const codes = new Set(nouveau ? session.permissions.map((p) => p?.code) : []);
    const peut = (code) => {
        if (!code) return true;
        if (code === SUPER_ADMIN) return nouveau && superAdmin;
        if (superAdmin) return true;
        if (nouveau) return codes.has(code);
        return !estReserveAdmin(code);
    };
    // Portée d'une permission de l'app (TOUTES, SA_CELLULE ou null).
    const portee = (code) =>
        nouveau ? (session.permissions.find((p) => p?.code === code)?.portee ?? null) : null;
    return { nouveau, superAdmin, peut, portee };
}

// Fiches (détail) : permission « détails » du module, en plus de la liste.
const ROUTES_DETAIL = [
    { motif: /^\/users\/[^/]+/, code: "bo.utilisateurs.details" },
    { motif: /^\/cellules\/[^/]+/, code: "bo.cellules.details" },
];

// Code exigé pour un chemin ; null = pas de contrôle (accueil, connexion).
export function codePourChemin(pathname) {
    const fiche = ROUTES_DETAIL.find((r) => r.motif.test(pathname));
    if (fiche) return fiche.code;
    const r = ROUTES_MODULES.find(
        (m) => pathname === m.chemin || pathname.startsWith(`${m.chemin}/`),
    );
    return r ? r.code : null;
}

export const routeAutorisee = (acces, pathname) => acces.peut(codePourChemin(pathname));

// Menu filtré : un lien sans la permission disparaît, un groupe vide aussi.
export function filtrerMenu(navigation, acces) {
    return navigation
        .map((g) => ({ ...g, items: g.items.filter((i) => acces.peut(i.code)) }))
        .filter((g) => g.items.length > 0);
}

// Première page accessible (accueil d'un compte sans accès aux utilisateurs).
export function premiereRoute(navigation, acces) {
    return filtrerMenu(navigation, acces)[0]?.items[0]?.href ?? null;
}

// Connexion refusée côté client : permissions fournies, mais sans accès au back-office.
export function accesBackOfficeRefuse(session) {
    if (!modeRoles(session)) return false;
    const a = creerAcces(session);
    return !a.superAdmin && !a.peut(CODE_ACCES);
}
