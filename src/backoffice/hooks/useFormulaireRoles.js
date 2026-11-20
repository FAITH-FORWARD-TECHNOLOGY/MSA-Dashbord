import { useEffect, useState } from "react";
import { aDesLignesDerivees, formulaireDepuisAttributions } from "../utils/attributionsRoles";
import { useListeRoles, useRolesUtilisateur } from "./useRoles";

// Valeur initiale du formulaire (rôles du compte, ou Membre pour un nouveau compte).
// Rend { roles, form, setForm, chargement, erreur, repli } ; repli = GET /roles a échoué (contrat 6.10),
// les formulaires reviennent alors au select USER / ADMIN ; form reste null tant que tout n'est pas chargé.
export function useFormulaireRoles(userId, actif) {
    const roles = useListeRoles(undefined, actif);
    const attributions = useRolesUtilisateur(actif ? (userId ?? null) : null);
    const [form, setForm] = useState(null);
    const [initial, setInitial] = useState(null);

    useEffect(() => {
        if (!actif || form || !roles.data) return;
        if (userId != null && !attributions.data) return;
        const f = formulaireDepuisAttributions(attributions.data ?? [], roles.data);
        setForm(f);
        setInitial(f);
    }, [actif, roles.data, attributions.data, userId, form]);

    return {
        roles: roles.data ?? [],
        form,
        derive: aDesLignesDerivees(attributions.data),
        initial,
        setForm,
        chargement: roles.loading || (userId != null && attributions.loading),
        repli: Boolean(actif && roles.error),
        erreur: roles.error || (userId != null ? attributions.error : ""),
        recharger: () => {
            roles.recharger();
            attributions.recharger();
        },
    };
}
