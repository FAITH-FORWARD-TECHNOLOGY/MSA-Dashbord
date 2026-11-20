import assert from "node:assert/strict";
import { test } from "node:test";
import {
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
