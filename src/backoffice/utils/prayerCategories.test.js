import assert from "node:assert/strict";
import { test } from "node:test";
import {
    delaiModifiable,
    estVerrouillee,
    validerJours,
    validerLibelle,
} from "./prayerCategories.js";

test("délai : entier de 1 à 3650", () => {
    assert.equal(validerJours("30"), "");
    assert.equal(validerJours(" 3650 "), "");
    assert.notEqual(validerJours("0"), "");
    assert.notEqual(validerJours("3651"), "");
    assert.notEqual(validerJours("1.5"), "");
    assert.notEqual(validerJours(""), "");
    assert.notEqual(validerJours("abc"), "");
});

test("libellé : 1 à 40 caractères", () => {
    assert.equal(validerLibelle("Santé"), "");
    assert.notEqual(validerLibelle("   "), "");
    assert.notEqual(validerLibelle("x".repeat(41)), "");
});

test("seule « Autre » est verrouillée", () => {
    assert.equal(estVerrouillee({ cle: "Autre" }), true);
    assert.equal(estVerrouillee({ cle: "Famille" }), false);
});

test("champ délai bloqué tant que la valeur réelle n'est pas chargée", () => {
    assert.equal(delaiModifiable(null, true), false); // chargement initial
    assert.equal(delaiModifiable(null, false), false); // chargement en erreur
    assert.equal(delaiModifiable(30, true), false); // rechargement en cours
    assert.equal(delaiModifiable(30, false), true);
    assert.equal(delaiModifiable(45, false), true);
});
