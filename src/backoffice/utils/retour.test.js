import { test } from "node:test";
import assert from "node:assert/strict";
import { cibleRetour } from "./retour.js";

test("retour : page précédente quand on vient d'une autre page du back-office", () => {
    assert.equal(cibleRetour("k3x9a1", "/users"), -1);
});

test("retour : liste de repli quand la fiche est ouverte directement (lien, nouvel onglet)", () => {
    assert.equal(cibleRetour("default", "/users"), "/users");
    assert.equal(cibleRetour(undefined, "/cellules"), "/cellules");
});
