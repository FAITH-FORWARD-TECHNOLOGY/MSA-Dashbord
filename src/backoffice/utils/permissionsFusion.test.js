import test from "node:test";
import assert from "node:assert/strict";
import { creerAcces, filtrerMenu, routeAutorisee } from "./permissions.js";
import { navigation } from "../config/navigation.js";

const roles = (codes, superAdmin = false) =>
    creerAcces({ superAdmin, permissions: codes.map((code) => ({ code })) });
const repli = (role) => creerAcces({ role });

const liens = (acces) => filtrerMenu(navigation, acces).flatMap((g) => g.items.map((i) => i.href));

test("CEL-4 : déplacer = bo.cellules.modifier, repli ADMIN", () => {
    assert.equal(roles(["bo.cellules.voir", "bo.cellules.modifier"]).peutNouveau("bo.cellules.modifier"), true);
    assert.equal(roles(["bo.cellules.voir"]).peutNouveau("bo.cellules.modifier"), false);
    assert.equal(roles([], true).peutNouveau("bo.cellules.modifier"), true);
    assert.equal(repli("ADMIN").peutNouveau("bo.cellules.modifier"), true);
    assert.equal(repli("USER").peutNouveau("bo.cellules.modifier"), false);
});

test("BO-5 : Importer (CSV) = bo.utilisateurs.creer, repli ADMIN", () => {
    assert.equal(roles(["bo.utilisateurs.creer"]).peutNouveau("bo.utilisateurs.creer"), true);
    assert.equal(roles(["bo.utilisateurs.voir"]).peutNouveau("bo.utilisateurs.creer"), false);
    assert.equal(repli("ADMIN").peutNouveau("bo.utilisateurs.creer"), true);
    assert.equal(repli("USER").peutNouveau("bo.utilisateurs.creer"), false);
});

test("BO-6 : image du plan = creer (création) ou modifier (modification)", () => {
    const a = roles(["bo.plans.voir", "bo.plans.creer"]);
    assert.equal(a.peut("bo.plans.creer"), true);
    assert.equal(a.peut("bo.plans.modifier"), false);
    // Repli : comportement d'origin/develop, pas de restriction supplémentaire.
    assert.equal(repli("USER").peut("bo.plans.creer"), true);
    assert.equal(repli("USER").peut("bo.plans.modifier"), true);
});

test("PRI-3 : menu et route selon bo.prieres.voir", () => {
    const lecteur = roles(["bo.acces", "bo.prieres.voir"]);
    assert.ok(liens(lecteur).includes("/sujets-de-priere"));
    assert.equal(routeAutorisee(lecteur, "/sujets-de-priere"), true);
    const sans = roles(["bo.acces", "bo.plans.voir"]);
    assert.ok(!liens(sans).includes("/sujets-de-priere"));
    assert.equal(routeAutorisee(sans, "/sujets-de-priere"), false);
});

test("PRI-3 : gérer = bo.prieres.gerer, lecture seule avec voir", () => {
    assert.equal(roles(["bo.prieres.voir"]).peut("bo.prieres.gerer"), false);
    assert.equal(roles(["bo.prieres.voir", "bo.prieres.gerer"]).peut("bo.prieres.gerer"), true);
});

test("PRI-3 : repli ADMIN seulement (menu, route, gestion)", () => {
    const admin = repli("ADMIN");
    const user = repli("USER");
    assert.ok(liens(admin).includes("/sujets-de-priere"));
    assert.ok(!liens(user).includes("/sujets-de-priere"));
    assert.equal(routeAutorisee(user, "/sujets-de-priere"), false);
    assert.equal(admin.peut("bo.prieres.gerer"), true);
    assert.equal(user.peut("bo.prieres.gerer"), false);
});
