// Logique pure de l'écran de permissions (cases, « voir » obligatoire, portée).

export const TOUTES = "TOUTES";
export const SA_CELLULE = "SA_CELLULE";

const voirDe = (module) => module.permissions.find((p) => p.estVoir);
const estBackOffice = (module) => module.type === "BACKOFFICE";

// [{ code, portee }] du serveur -> { code: portee }.
export function selectionDepuisRole(permissions) {
    const sel = {};
    (permissions ?? []).forEach((p) => {
        sel[p.code] = p.portee ?? null;
    });
    return sel;
}

// { code: portee } -> corps de PUT /roles/:id/permissions.
export const corpsPermissions = (selection) =>
    Object.entries(selection).map(([code, portee]) => ({ code, portee: portee ?? null }));

// Portée proposée à la première coche d'une permission à portée.
export const porteeParDefaut = (role) => (role?.aPerimetre ? SA_CELLULE : TOUTES);

// Case désactivée : au back-office, tout sauf « voir » tant que « voir » est décoché.
export function caseDesactivee(module, selection, permission) {
    if (!estBackOffice(module) || permission.estVoir) return false;
    const voir = voirDe(module);
    return Boolean(voir) && !(voir.code in selection);
}

export function basculer(selection, module, permission, defautPortee = TOUTES) {
    if (caseDesactivee(module, selection, permission)) return selection;
    const suivante = { ...selection };
    if (permission.code in suivante) {
        delete suivante[permission.code];
        // « Voir » décoché : le reste du module est décoché aussi.
        if (permission.estVoir && estBackOffice(module)) {
            module.permissions.forEach((p) => delete suivante[p.code]);
        }
    } else {
        suivante[permission.code] = permission.aPerimetre ? defautPortee : null;
    }
    return suivante;
}

export function toutCocher(selection, module, defautPortee = TOUTES) {
    const suivante = { ...selection };
    module.permissions.forEach((p) => {
        if (!(p.code in suivante)) suivante[p.code] = p.aPerimetre ? defautPortee : null;
    });
    return suivante;
}

export function toutDecocher(selection, module) {
    const suivante = { ...selection };
    module.permissions.forEach((p) => delete suivante[p.code]);
    return suivante;
}

export function changerPortee(selection, code, portee) {
    return code in selection ? { ...selection, [code]: portee } : selection;
}

export function decompteModule(module, selection) {
    const coches = module.permissions.filter((p) => p.code in selection).length;
    return { coches, total: module.permissions.length, tout: coches === module.permissions.length };
}

// Modules (back-office) dont une case est cochée sans « voir » : le serveur répondrait 400.
export function modulesSansVoir(catalogue, selection) {
    return catalogue
        .filter(estBackOffice)
        .filter((m) => {
            const voir = voirDe(m);
            return voir && !(voir.code in selection) && m.permissions.some((p) => p.code in selection);
        })
        .map((m) => m.libelle);
}

export const modulesDuType = (catalogue, type) => (catalogue ?? []).filter((m) => m.type === type);
