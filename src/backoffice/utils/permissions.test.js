import { test } from "node:test";
import assert from "node:assert/strict";
import {
    SUPER_ADMIN,
    accesBackOfficeRefuse,
    codePourChemin,
    creerAcces,
    filtrerMenu,
    premiereRoute,
    routeAutorisee,
} from "./permissions.js";

const MENU = [
    {
        name: "Membres",
        items: [
            { name: "Utilisateurs", href: "/users", code: "bo.utilisateurs.voir" },
            { name: "Communes", href: "/communes", code: "bo.communes.voir" },
            { name: "Export", href: "/export-donnees", code: "bo.export_donnees.voir" },
        ],
    },
    { name: "Admin", items: [{ name: "Rôles", href: "/roles", code: SUPER_ADMIN }] },
];

const limite = {
    role: "USER",
    superAdmin: false,
    permissions: [
        { code: "bo.acces", portee: null },
        { code: "bo.utilisateurs.voir", portee: null },
        { code: "bo.utilisateurs.creer", portee: null },
    ],
};

test("peut : un compte limité n'a que ses codes", () => {
    const a = creerAcces(limite);
    assert.equal(a.peut("bo.utilisateurs.creer"), true);
    assert.equal(a.peut("bo.utilisateurs.modifier"), false);
    assert.equal(a.peut(SUPER_ADMIN), false);
});

test("peut : le super admin a tout, y compris le module Rôles", () => {
    const a = creerAcces({ role: "USER", superAdmin: true, permissions: [] });
    assert.equal(a.peut("bo.cellules.supprimer"), true);
    assert.equal(a.peut(SUPER_ADMIN), true);
});

test("repli : sans champ permissions, ADMIN = super admin pour l'ancien modèle", () => {
    const a = creerAcces({ role: "ADMIN" });
    assert.equal(a.nouveau, false);
    assert.equal(a.peut("bo.communes.voir"), true);
    // Pas de module Rôles tant que le serveur n'envoie pas les permissions.
    assert.equal(a.peut(SUPER_ADMIN), false);
});

test("repli : un compte non admin voit comme aujourd'hui (hors liens réservés aux admins)", () => {
    const a = creerAcces({ role: "USER" });
    assert.equal(a.peut("bo.utilisateurs.voir"), true);
    assert.equal(a.peut("bo.cellules.supprimer"), true);
    assert.equal(a.peut("bo.communes.voir"), false);
    assert.equal(a.peut("bo.quartiers.importer"), false);
    assert.equal(a.peut("bo.export_donnees.voir"), false);
    assert.equal(a.peut("bo.utilisateurs.mot_de_passe"), false);
});

test("repli : session absente = aucun droit d'admin", () => {
    assert.equal(creerAcces(null).superAdmin, false);
    assert.equal(creerAcces(undefined).peut("bo.communes.voir"), false);
});

test("repli : « ADMIN » comparé exactement", () => {
    assert.equal(creerAcces({ role: "admin" }).superAdmin, false);
});

test("menu : filtré par permissions, groupe vide retiré", () => {
    const m = filtrerMenu(MENU, creerAcces(limite));
    assert.deepEqual(m.map((g) => g.name), ["Membres"]);
    assert.deepEqual(m[0].items.map((i) => i.href), ["/users"]);
});

test("menu : repli identique à l'ancien drapeau adminOnly", () => {
    const user = filtrerMenu(MENU, creerAcces({ role: "USER" }));
    assert.deepEqual(user[0].items.map((i) => i.href), ["/users"]);
    const admin = filtrerMenu(MENU, creerAcces({ role: "ADMIN" }));
    assert.deepEqual(admin[0].items.map((i) => i.href), ["/users", "/communes", "/export-donnees"]);
    assert.equal(admin.length, 1);
});

test("menu : super admin voit le module Rôles", () => {
    const m = filtrerMenu(MENU, creerAcces({ superAdmin: true, permissions: [] }));
    assert.equal(m.length, 2);
});

test("routes : code du module, sous-pages comprises", () => {
    assert.equal(codePourChemin("/users"), "bo.utilisateurs.voir");
    assert.equal(codePourChemin("/users/12"), "bo.utilisateurs.details");
    assert.equal(codePourChemin("/cellules/3"), "bo.cellules.details");
    assert.equal(codePourChemin("/cellules"), "bo.cellules.voir");
    assert.equal(codePourChemin("/roles/3"), SUPER_ADMIN);
    assert.equal(codePourChemin("/"), null);
    assert.equal(codePourChemin("/userspace"), null);
});

test("routes : refus sans le code « voir »", () => {
    const a = creerAcces(limite);
    assert.equal(routeAutorisee(a, "/users/4"), false);
    assert.equal(routeAutorisee(creerAcces({ permissions: [{ code: "bo.utilisateurs.details" }] }), "/users/4"), true);
    assert.equal(routeAutorisee(a, "/cellules"), false);
    assert.equal(routeAutorisee(a, "/"), true);
});

test("accueil : première route accessible", () => {
    assert.equal(premiereRoute(MENU, creerAcces(limite)), "/users");
    assert.equal(premiereRoute(MENU, creerAcces({ permissions: [] })), null);
});

test("connexion : permissions sans bo.acces = refus ; ancien serveur = jamais refusé", () => {
    assert.equal(accesBackOfficeRefuse({ superAdmin: false, permissions: [{ code: "app.profil.creer_utilisateur" }] }), true);
    assert.equal(accesBackOfficeRefuse(limite), false);
    assert.equal(accesBackOfficeRefuse({ superAdmin: true, permissions: [] }), false);
    assert.equal(accesBackOfficeRefuse({ role: "USER" }), false);
});
