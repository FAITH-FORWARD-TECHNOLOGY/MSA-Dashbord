import { useCallback, useEffect, useState } from "react";
import { appelApi } from "./useReferentiel";
import { chaineRequete } from "../components/statistiques/cellulesFiltre";

// Routes d'administration des rôles : contrat dans docs-MSA-backend/contrat-ROLE-permissions.md.

export const listerRoles = (type) => appelApi(`/roles${chaineRequete({ type })}`);
export const lireRole = (id) => appelApi(`/roles/${id}`);
export const creerRole = (corps) => appelApi("/roles", { methode: "POST", corps });
export const modifierRole = (id, corps) => appelApi(`/roles/${id}`, { methode: "PATCH", corps });
export const dupliquerRole = (id, nom) => appelApi(`/roles/${id}/dupliquer`, { methode: "POST", corps: { nom } });
export const supprimerRole = (id) => appelApi(`/roles/${id}`, { methode: "DELETE" });
export const enregistrerPermissions = (id, permissions) =>
    appelApi(`/roles/${id}/permissions`, { methode: "PUT", corps: { permissions } });
export const lireRolesUtilisateur = (userId) => appelApi(`/users/${userId}/roles`);
export const remplacerRolesUtilisateur = (userId, attributions) =>
    appelApi(`/users/${userId}/roles`, { methode: "PUT", corps: { attributions } });
export const attribuerEnMasse = (roleId, userIds, celluleId) =>
    appelApi(`/roles/${roleId}/attribuer`, {
        methode: "POST",
        corps: { userIds, ...(celluleId != null ? { celluleId } : {}) },
    });
export const lireJournal = (params) => appelApi(`/roles/audit${chaineRequete(params)}`);

// Lecture avec chargement / erreur / rechargement ; `charger` renvoie une promesse.
function useChargement(charger, cle, actif = true) {
    const [etat, setEtat] = useState({ data: null, loading: actif, error: "" });
    const [essai, setEssai] = useState(0);
    useEffect(() => {
        if (!actif) return undefined;
        let annule = false;
        setEtat((e) => ({ ...e, loading: true, error: "" }));
        charger()
            .then((data) => !annule && setEtat({ data, loading: false, error: "" }))
            .catch((err) => {
                if (annule || err.statut === 401) return;
                setEtat({ data: null, loading: false, error: err.message || "Échec du chargement" });
            });
        return () => {
            annule = true;
        };
        // `cle` résume les paramètres de `charger`.
    }, [cle, actif, essai]); // eslint-disable-line react-hooks/exhaustive-deps
    const recharger = useCallback(() => setEssai((n) => n + 1), []);
    return { ...etat, recharger };
}

export const useListeRoles = (type, actif = true) => useChargement(() => listerRoles(type), `roles:${type ?? ""}`, actif);
export const useRole = (id) => useChargement(() => lireRole(id), `role:${id}`, id != null);
export const useCatalogue = () => useChargement(() => appelApi("/permissions/catalogue"), "catalogue");
export const useRolesUtilisateur = (userId) =>
    useChargement(() => lireRolesUtilisateur(userId), `roles-user:${userId}`, userId != null);
export const useJournal = (params) => useChargement(() => lireJournal(params), `journal:${chaineRequete(params)}`);

// Noms des cellules (id -> nom), pour afficher « Responsable de cellule (Yopougon) » ; rien si inactif.
export function useCellulesNoms(actif) {
    const { data } = useChargement(() => appelApi("/cellules/all"), "cellules-noms", actif);
    return new Map((data?.data ?? []).map((c) => [Number(c.id), c.name]));
}

// Comptes ayant un rôle de back-office (filtre « Acteur » du journal) : GET /users?roleId= par rôle, sans doublon.
export function useActeursJournal(roles) {
    const bo = (roles ?? []).filter((r) => r.type === "BACKOFFICE");
    const cle = bo.map((r) => r.id).join(",");
    const { data } = useChargement(
        async () => {
            const listes = await Promise.all(bo.map((r) => appelApi(`/users${chaineRequete({ roleId: r.id })}`)));
            const parId = new Map();
            listes.flat().forEach((u) => u?.id != null && parId.set(u.id, u));
            return [...parId.values()];
        },
        `acteurs:${cle}`,
        bo.length > 0,
    );
    return Array.isArray(data) ? data : [];
}
