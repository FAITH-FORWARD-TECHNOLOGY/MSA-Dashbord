// Attributions de rôles d'un compte : un rôle d'application (+ cellules) et un rôle du back-office.

export const APP = "APP";
export const BACKOFFICE = "BACKOFFICE";

// Rôle d'application par défaut : « Membre » (système).
export const roleMembre = (roles) => roles.find((r) => r.type === APP && r.systeme && !r.aPerimetre) ?? null;

// GET /users/:id/roles -> état du formulaire ; les autres attributions sont conservées telles quelles.
export function formulaireDepuisAttributions(attributions, roles) {
    const parId = new Map(roles.map((r) => [r.id, r]));
    const apps = attributions.filter((a) => (parId.get(a.roleId)?.type ?? a.type) === APP);
    const bos = attributions.filter((a) => (parId.get(a.roleId)?.type ?? a.type) === BACKOFFICE);
    const premierApp = apps[0]?.roleId ?? roleMembre(roles)?.id ?? null;
    const duRole = apps.filter((a) => a.roleId === premierApp);
    return {
        appRoleId: premierApp,
        appCellules: duRole.map((a) => a.celluleId).filter((c) => c != null),
        boRoleId: bos[0]?.roleId ?? null,
        conservees: [
            ...apps.filter((a) => a.roleId !== premierApp),
            ...bos.slice(1),
        ].map((a) => ({ roleId: a.roleId, celluleId: a.celluleId ?? null })),
    };
}

// État du formulaire -> corps de PUT /users/:id/roles.
export function attributionsDepuisFormulaire(form, roles) {
    const out = [];
    const app = roles.find((r) => r.id === form.appRoleId);
    if (app) {
        if (app.aPerimetre) form.appCellules.forEach((c) => out.push({ roleId: app.id, celluleId: c }));
        else out.push({ roleId: app.id, celluleId: null });
    }
    if (form.boRoleId != null) out.push({ roleId: form.boRoleId, celluleId: null });
    return [...out, ...form.conservees];
}

// Message à afficher avant l'envoi (null = valide).
export function erreurFormulaire(form, roles) {
    const app = roles.find((r) => r.id === form.appRoleId);
    if (app?.aPerimetre && form.appCellules.length === 0) {
        return `Choisissez au moins une cellule pour le rôle « ${app.nom} ».`;
    }
    return null;
}

// Libellé d'un rôle d'une ligne de liste : « Responsable de cellule (Cellule 3) ».
export function libelleRole(role, cellulesParId) {
    if (role.celluleId == null) return role.nom;
    const c = cellulesParId?.get(Number(role.celluleId));
    return c ? `${role.nom} (${c})` : role.nom;
}

// Message d'un 409 d'attribution (dernier super admin) : celui du serveur, sinon un texte clair.
export function messageDernierSuperAdmin(message) {
    return message && /dernier super admin/i.test(message)
        ? "Action impossible : c'est le dernier super admin. Nommez d'abord un autre super admin, puis recommencez."
        : message;
}
