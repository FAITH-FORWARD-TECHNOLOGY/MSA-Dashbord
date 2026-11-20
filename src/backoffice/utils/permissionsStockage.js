// Session et permissions stockées (localStorage) : logique pure, sans React, testable sous node.

export const CLE_SESSION = "jobhubs_auth";

export function lireStockage(storage = globalThis.localStorage) {
    try {
        const brut = storage?.getItem(CLE_SESSION);
        return brut ? JSON.parse(brut) : null;
    } catch {
        return null;
    }
}

// Connexion aplatie, comme useAuth : user.role, superAdmin, permissions au premier niveau.
export function sessionAplatie(stock) {
    const s = stock?.user;
    return s ? { ...(s.user ?? {}), ...s } : null;
}

// Écrit la réponse de /auth/moi dans la session stockée ; rend la session aplatie, null sans session.
export function appliquerMoi(moi, storage = globalThis.localStorage) {
    const stock = lireStockage(storage);
    if (!stock?.user) return null;
    stock.user = {
        ...stock.user,
        ...(moi.user ? { user: moi.user } : {}),
        superAdmin: moi.superAdmin === true,
        roles: moi.roles ?? [],
        permissions: moi.permissions ?? [],
    };
    try {
        storage.setItem(CLE_SESSION, JSON.stringify(stock));
    } catch {
        /* stockage plein ou indisponible : la session mémoire suffit */
    }
    return sessionAplatie(stock);
}

// GET /auth/moi : 404 sur l'ancien serveur (ou réseau en échec), on garde alors le repli (role USER / ADMIN).
// Rend la session mise à jour, ou null si rien n'a changé.
export async function rafraichirDepuisServeur({ url, headers, storage, fetchFn = globalThis.fetch }) {
    try {
        const res = await fetchFn(url, { headers });
        if (!res.ok) return null;
        const moi = await res.json();
        return Array.isArray(moi?.permissions) ? appliquerMoi(moi, storage) : null;
    } catch {
        /* réseau indisponible : les permissions de la connexion restent valables */
        return null;
    }
}
