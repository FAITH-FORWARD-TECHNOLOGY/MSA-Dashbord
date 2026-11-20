import { useEffect, useMemo, useSyncExternalStore } from "react";
import { API_BASE_URL, authHeaders } from "../config/api";
import { creerAcces } from "../utils/permissions";

// Session stockée par useAuth : { user: { user, token, superAdmin, roles, permissions }, ... }.
const CLE = "jobhubs_auth";

function lireStockage() {
    try {
        const brut = localStorage.getItem(CLE);
        return brut ? JSON.parse(brut) : null;
    } catch {
        return null;
    }
}

// Connexion aplatie, comme useAuth : user.role, superAdmin, permissions au premier niveau.
function sessionAplatie(stock) {
    const s = stock?.user;
    return s ? { ...(s.user ?? {}), ...s } : null;
}

// Petit magasin partagé : tous les composants voient la même session à jour.
let etat = { session: sessionAplatie(lireStockage()), moiEnCours: false };
const abonnes = new Set();
const changer = (suite) => {
    etat = { ...etat, ...suite };
    abonnes.forEach((f) => f());
};

// Écrit la réponse de /auth/moi dans la session stockée.
function appliquerMoi(moi) {
    const stock = lireStockage();
    if (!stock?.user) return;
    stock.user = {
        ...stock.user,
        ...(moi.user ? { user: moi.user } : {}),
        superAdmin: moi.superAdmin === true,
        roles: moi.roles ?? [],
        permissions: moi.permissions ?? [],
    };
    try {
        localStorage.setItem(CLE, JSON.stringify(stock));
    } catch {
        /* stockage plein ou indisponible : la session mémoire suffit */
    }
    changer({ session: sessionAplatie(stock) });
}

// GET /auth/moi : 404 sur l'ancien serveur, on garde alors le repli (role USER / ADMIN).
export async function rafraichirPermissions() {
    if (!etat.session?.token) return;
    changer({ moiEnCours: true });
    try {
        const res = await fetch(`${API_BASE_URL}/auth/moi`, { headers: authHeaders() });
        if (res.ok) {
            const moi = await res.json();
            if (Array.isArray(moi?.permissions)) appliquerMoi(moi);
        }
    } catch {
        /* réseau indisponible : les permissions de la connexion restent valables */
    } finally {
        changer({ moiEnCours: false });
    }
}

let moiDejaDemande = false;

const abonner = (f) => {
    abonnes.add(f);
    return () => abonnes.delete(f);
};
const lire = () => etat;

// Droits de l'utilisateur connecté : peut(code), superAdmin, nouveau (serveur à rôles).
export function usePermissions() {
    const { session, moiEnCours } = useSyncExternalStore(abonner, lire);
    useEffect(() => {
        if (moiDejaDemande || !session?.token) return;
        moiDejaDemande = true;
        rafraichirPermissions();
    }, [session?.token]);
    const acces = useMemo(() => creerAcces(session), [session]);
    return { ...acces, session, chargement: moiEnCours };
}
