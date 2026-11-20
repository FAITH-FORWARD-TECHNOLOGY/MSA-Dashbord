import { test } from "node:test";
import assert from "node:assert/strict";
import {
    aDesLignesDerivees,
    aPourCle,
    attributionsDepuisFormulaire,
    estSuperAdmin,
    modificationPossible,
    rolesBoProposes,
    suppressionInterdite,
    corpsSansRole,
    erreurFormulaire,
    formulaireDepuisAttributions,
    formulaireModifie,
    idUtilisateurCree,
    libelleRole,
    messageDernierSuperAdmin,
    roleMembre,
} from "./attributionsRoles.js";
import { BASCULE_FAITE } from "../config/bascule.js";
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

test("id du compte créé : uniquement data.user.id, sinon null", () => {
    assert.equal(idUtilisateurCree({ data: { user: { id: 9 } } }), 9);
    assert.equal(idUtilisateurCree({ id: 7 }), null);
    assert.equal(idUtilisateurCree({ user: { id: 3 } }), null);
    assert.equal(idUtilisateurCree({ data: { id: 4 } }), null);
    assert.equal(idUtilisateurCree({ data: { user: {} } }), null);
    assert.equal(idUtilisateurCree(true), null);
    assert.equal(idUtilisateurCree(null), null);
});

test("corps de modification en mode rôles : jamais de role ; en repli, role conservé", () => {
    const corps = { nom: "A", email: "a@b.c", paysId: 1, celluleId: 4, role: "ADMIN" };
    const envoye = corpsSansRole(corps, true);
    assert.equal("role" in envoye, false);
    assert.deepEqual(envoye, { nom: "A", email: "a@b.c", paysId: 1, celluleId: 4 });
    assert.equal(corpsSansRole(corps, false).role, "ADMIN");
    assert.equal(corps.role, "ADMIN");
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

// --- Lot R2 : règles de sécurité avant la bascule (contrat 6.12) ---

const rolesCles = [
    { id: 1, nom: "Super admin", cle: "SUPER_ADMIN", type: "BACKOFFICE", systeme: true, superAdmin: true, aPerimetre: false },
    { id: 5, nom: "Gestionnaire", cle: null, type: "BACKOFFICE", systeme: false, aPerimetre: false },
    { id: 2, nom: "Adhérent", cle: "MEMBRE", type: "APP", systeme: true, aPerimetre: false },
    { id: 3, nom: "Chef de cellule", cle: "RESPONSABLE_CELLULE", type: "APP", systeme: true, aPerimetre: true },
    { id: 6, nom: "Membre", cle: null, type: "APP", systeme: false, aPerimetre: false },
];

test("avant la bascule, seul Super admin est proposé au back-office", () => {
    assert.deepEqual(rolesBoProposes(rolesCles, { basculeFaite: false }).map((r) => r.id), [1]);
});

test("avant la bascule, le rôle déjà attribué reste affiché", () => {
    assert.deepEqual(rolesBoProposes(rolesCles, { basculeFaite: false, actuelId: 5 }).map((r) => r.id), [1, 5]);
});

test("après la bascule, tous les rôles du back-office sont proposés", () => {
    assert.deepEqual(rolesBoProposes(rolesCles, { basculeFaite: true }).map((r) => r.id), [1, 5]);
});

test("par défaut, la constante de configuration dit : bascule pas faite", () => {
    assert.equal(BASCULE_FAITE, false);
    assert.deepEqual(rolesBoProposes(rolesCles).map((r) => r.id), [1]);
});

test("lignes derive : reprises telles quelles dans le corps du PUT, sans id", () => {
    const attributions = [
        { id: null, derive: true, roleId: 1, celluleId: null },
        { id: null, derive: true, roleId: 3, celluleId: 12 },
        { id: null, derive: true, roleId: 3, celluleId: 14 },
    ];
    assert.equal(aDesLignesDerivees(attributions), true);
    const f = formulaireDepuisAttributions(attributions, rolesCles);
    assert.equal(f.boRoleId, 1);
    const corps = attributionsDepuisFormulaire(f, rolesCles);
    assert.deepEqual(corps, [
        { roleId: 3, celluleId: 12 },
        { roleId: 3, celluleId: 14 },
        { roleId: 1, celluleId: null },
    ]);
    corps.forEach((l) => assert.ok(!("id" in l) && !("derive" in l)));
});

test("des vraies lignes ne sont pas des lignes derive", () => {
    assert.equal(aDesLignesDerivees([{ id: 9, roleId: 1, celluleId: null }]), false);
    assert.equal(aDesLignesDerivees(undefined), false);
});

test("identification par cle, pas par nom", () => {
    assert.equal(roleMembre(rolesCles).id, 2);
    assert.equal(suppressionInterdite(rolesCles[3]), true);
    assert.equal(modificationPossible(rolesCles[3]), true);
    assert.equal(modificationPossible(rolesCles[0]), false);
    assert.equal(suppressionInterdite(rolesCles[4]), false);
    assert.equal(estSuperAdmin(rolesCles[0]), true);
    assert.equal(estSuperAdmin(rolesCles[1]), false);
});

test("renommer Responsable de cellule ne change pas son identification", () => {
    const renomme = { ...rolesCles[3], nom: "Pilote" };
    assert.equal(aPourCle(renomme, "RESPONSABLE_CELLULE"), true);
    assert.equal(suppressionInterdite(renomme), true);
});
