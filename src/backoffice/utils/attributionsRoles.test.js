import { test } from "node:test";
import assert from "node:assert/strict";
import {
    attributionsDepuisFormulaire,
    erreurFormulaire,
    formulaireDepuisAttributions,
    formulaireModifie,
    idUtilisateurCree,
    libelleRole,
    messageDernierSuperAdmin,
    roleMembre,
} from "./attributionsRoles.js";
import { alerteSuperAdmins, libelleAction } from "./journalRoles.js";

const roles = [
    { id: 1, nom: "Super admin", type: "BACKOFFICE", systeme: true, superAdmin: true, aPerimetre: false, nbUtilisateurs: 1 },
    { id: 2, nom: "Membre", type: "APP", systeme: true, aPerimetre: false },
    { id: 3, nom: "Responsable de cellule", type: "APP", systeme: false, aPerimetre: true },
    { id: 4, nom: "Responsable général", type: "APP", systeme: false, aPerimetre: false },
];

test("Membre par défaut quand aucune attribution", () => {
    assert.equal(roleMembre(roles).id, 2);
    assert.equal(formulaireDepuisAttributions([], roles).appRoleId, 2);
});

test("formulaire : rôle d'app avec cellules et rôle du back-office séparés", () => {
    const f = formulaireDepuisAttributions(
        [{ roleId: 3, celluleId: 12 }, { roleId: 3, celluleId: 14 }, { roleId: 1, celluleId: null }],
        roles,
    );
    assert.deepEqual(f, { appRoleId: 3, appCellules: [12, 14], boRoleId: 1, conservees: [] });
    assert.deepEqual(attributionsDepuisFormulaire(f, roles), [
        { roleId: 3, celluleId: 12 },
        { roleId: 3, celluleId: 14 },
        { roleId: 1, celluleId: null },
    ]);
});

test("un rôle d'app supplémentaire est conservé à l'enregistrement", () => {
    const f = formulaireDepuisAttributions([{ roleId: 3, celluleId: 1 }, { roleId: 4, celluleId: null }], roles);
    assert.deepEqual(attributionsDepuisFormulaire(f, roles).at(-1), { roleId: 4, celluleId: null });
});

test("rôle à périmètre sans cellule : erreur claire ; rôle sans périmètre : cellules ignorées", () => {
    assert.match(erreurFormulaire({ appRoleId: 3, appCellules: [], boRoleId: null, conservees: [] }, roles), /au moins une cellule/);
    assert.equal(erreurFormulaire({ appRoleId: 4, appCellules: [], boRoleId: null, conservees: [] }, roles), null);
    assert.deepEqual(
        attributionsDepuisFormulaire({ appRoleId: 4, appCellules: [9], boRoleId: null, conservees: [] }, roles),
        [{ roleId: 4, celluleId: null }],
    );
});

test("409 dernier super admin : message explicite", () => {
    assert.match(messageDernierSuperAdmin("Impossible : c'est le dernier super admin"), /Nommez d'abord/);
    assert.equal(messageDernierSuperAdmin("Autre"), "Autre");
});

test("journal : libellé français et alerte sous 2 super admins", () => {
    assert.equal(libelleAction("ROLE_ATTRIBUE"), "Rôle attribué");
    assert.equal(libelleAction("INCONNU"), "INCONNU");
    assert.equal(alerteSuperAdmins(roles), true);
    assert.equal(alerteSuperAdmins([{ ...roles[0], nbUtilisateurs: 2 }]), false);
    assert.equal(alerteSuperAdmins([]), false);
});

test("id du compte créé : plusieurs formes de réponse, sinon null", () => {
    assert.equal(idUtilisateurCree({ id: 7 }), 7);
    assert.equal(idUtilisateurCree({ data: { user: { id: "9" } } }), 9);
    assert.equal(idUtilisateurCree({ user: { id: 3 } }), 3);
    assert.equal(idUtilisateurCree(true), null);
    assert.equal(idUtilisateurCree(null), null);
});

test("formulaire modifié : l'ordre des cellules ne compte pas", () => {
    const a = { appRoleId: 3, appCellules: [1, 2], boRoleId: null, conservees: [] };
    assert.equal(formulaireModifie(a, { ...a, appCellules: [2, 1] }), false);
    assert.equal(formulaireModifie(a, { ...a, boRoleId: 1 }), true);
});

test("libellé d'un rôle de liste avec le nom de la cellule", () => {
    assert.equal(libelleRole({ nom: "Responsable de cellule", celluleId: 12 }, new Map([[12, "Yopougon"]])), "Responsable de cellule (Yopougon)");
    assert.equal(libelleRole({ nom: "Membre", celluleId: null }, new Map()), "Membre");
});
