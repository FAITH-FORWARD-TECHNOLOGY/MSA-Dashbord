// Journal d'audit des rôles : libellés et alerte.

export const ACTIONS_JOURNAL = [
    { code: "ROLE_CREE", libelle: "Rôle créé" },
    { code: "ROLE_MODIFIE", libelle: "Rôle modifié" },
    { code: "ROLE_PERMISSIONS", libelle: "Permissions modifiées" },
    { code: "ROLE_SUPPRIME", libelle: "Rôle supprimé" },
    { code: "ROLE_ATTRIBUE", libelle: "Rôle attribué" },
    { code: "ROLE_RETIRE", libelle: "Rôle retiré" },
];

export const libelleAction = (code) => ACTIONS_JOURNAL.find((a) => a.code === code)?.libelle ?? code;

export const MIN_SUPER_ADMINS = 2;

// Vrai s'il y a moins de 2 super admins (liste GET /roles?type=BACKOFFICE).
export function alerteSuperAdmins(roles) {
    const sa = (roles ?? []).find((r) => r.superAdmin);
    return sa ? sa.nbUtilisateurs < MIN_SUPER_ADMINS : false;
}
