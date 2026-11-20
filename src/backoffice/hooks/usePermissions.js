import { useEffect, useMemo, useSyncExternalStore } from "react";
import { API_BASE_URL, authHeaders } from "../config/api";
import { creerAcces } from "../utils/permissions";
import { lireStockage, rafraichirDepuisServeur, sessionAplatie } from "../utils/permissionsStockage";

// Magasin partagé : tous les composants voient la même session à jour.
let etat = { session: sessionAplatie(lireStockage()), moiEnCours: false };
const abonnes = new Set();
const changer = (suite) => {
    etat = { ...etat, ...suite };
    abonnes.forEach((f) => f());
};

// GET /auth/moi : 404 sur l'ancien serveur, on garde alors le repli (role USER / ADMIN).
export async function rafraichirPermissions() {
    if (!etat.session?.token) return;
    changer({ moiEnCours: true });
    try {
        const session = await rafraichirDepuisServeur({ url: `${API_BASE_URL}/auth/moi`, headers: authHeaders() });
        if (session) changer({ session });
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
