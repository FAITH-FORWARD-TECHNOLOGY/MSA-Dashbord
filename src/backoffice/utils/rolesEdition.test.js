import { test } from "node:test";
import assert from "node:assert/strict";
import {
    SA_CELLULE,
    TOUTES,
    basculer,
    caseDesactivee,
    changerPortee,
    corpsPermissions,
    decompteModule,
    modulesSansVoir,
    porteeParDefaut,
    selectionDepuisRole,
    toutCocher,
    toutDecocher,
} from "./rolesEdition.js";

const perm = (code, extra = {}) => ({ code, libelle: code, aPerimetre: false, sensible: false, estVoir: false, ...extra });
const cellules = {
    cle: "cellules",
    libelle: "Cellules",
    type: "BACKOFFICE",
    permissions: [perm("bo.cellules.voir", { estVoir: true }), perm("bo.cellules.creer"), perm("bo.cellules.supprimer", { sensible: true })],
};
const stats = {
    cle: "statistiques",
    libelle: "Statistiques",
    type: "APP",
    permissions: [perm("app.statistiques.voir", { aPerimetre: true }), perm("app.statistiques.exporter", { aPerimetre: true })],
};
const [voir, creer] = cellules.permissions;

test("voir obligatoire : les autres cases sont désactivées tant que voir est décoché", () => {
    assert.equal(caseDesactivee(cellules, {}, creer), true);
    assert.equal(caseDesactivee(cellules, {}, voir), false);
    assert.equal(caseDesactivee(cellules, { "bo.cellules.voir": null }, creer), false);
});

test("voir obligatoire : cocher une case sans voir ne change rien", () => {
    assert.deepEqual(basculer({}, cellules, creer), {});
});

test("voir obligatoire : décocher voir décoche tout le module", () => {
    const sel = { "bo.cellules.voir": null, "bo.cellules.creer": null, "autre.code": null };
    assert.deepEqual(basculer(sel, cellules, voir), { "autre.code": null });
});

test("les modules de l'app n'ont pas de voir obligatoire", () => {
    assert.equal(caseDesactivee(stats, {}, stats.permissions[1]), false);
});

test("tout cocher / tout décocher par module", () => {
    const tout = toutCocher({}, cellules);
    assert.equal(decompteModule(cellules, tout).tout, true);
    assert.deepEqual(toutDecocher({ ...tout, x: null }, cellules), { x: null });
});

test("portée : coche à portée = défaut du rôle, modifiable ensuite", () => {
    assert.equal(porteeParDefaut({ aPerimetre: true }), SA_CELLULE);
    assert.equal(porteeParDefaut({ aPerimetre: false }), TOUTES);
    let sel = basculer({}, stats, stats.permissions[0], SA_CELLULE);
    assert.equal(sel["app.statistiques.voir"], SA_CELLULE);
    sel = changerPortee(sel, "app.statistiques.voir", TOUTES);
    assert.equal(sel["app.statistiques.voir"], TOUTES);
    assert.deepEqual(changerPortee(sel, "absent", TOUTES), sel);
});

test("corps : liste { code, portee } et validation avant envoi", () => {
    assert.deepEqual(corpsPermissions({ "bo.cellules.voir": null }), [{ code: "bo.cellules.voir", portee: null }]);
    assert.deepEqual(selectionDepuisRole([{ code: "a", portee: "TOUTES" }, { code: "b", portee: null }]), { a: "TOUTES", b: null });
    assert.deepEqual(modulesSansVoir([cellules, stats], { "bo.cellules.creer": null }), ["Cellules"]);
    assert.deepEqual(modulesSansVoir([cellules, stats], { "bo.cellules.voir": null, "bo.cellules.creer": null }), []);
});

test("rôle sans périmètre : seule la portée « Toutes les cellules » est proposée", async () => {
    const { porteesDisponibles, TOUTES, SA_CELLULE } = await import("./rolesEdition.js");
    assert.deepEqual(porteesDisponibles({ aPerimetre: false }), [TOUTES]);
    assert.deepEqual(porteesDisponibles({ aPerimetre: true }), [TOUTES, SA_CELLULE]);
});
