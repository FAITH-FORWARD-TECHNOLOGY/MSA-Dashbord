// Tests de la logique pure des jours NA (lanceur intégré : node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    cleJoursNa,
    corpsJourNa,
    ErreurJoursNa,
    erreursJourNa,
    estConflitPresences,
    estDonneePerimee,
    etatJoursNa,
    horsPeriode,
    periodeIncluant,
    trouverJourNa,
} from "./joursNa.js";

const CELLULES = [{ id: 4, name: "Cocody" }, { id: 9, name: "Dabou" }, { id: 12, name: "Yopougon" }];
const base = { date: "2026-11-15", motif: "  Convention nationale  ", cellules: CELLULES };

test("POST toutes : toutes:true, sans celluleIds, motif nettoyé", () => {
    const c = corpsJourNa({ ...base, edition: false, portee: "toutes", choix: new Set() });
    assert.deepEqual(c, { date: "2026-11-15", motif: "Convention nationale", toutes: true });
});

test("POST choisies : celluleIds, sans toutes", () => {
    const c = corpsJourNa({ ...base, edition: false, portee: "choisies", choix: new Set([9, 4]) });
    assert.deepEqual(c, { date: "2026-11-15", motif: "Convention nationale", celluleIds: [9, 4] });
});

test("POST après 409 : confirmer:true ajouté", () => {
    const c = corpsJourNa({ ...base, edition: false, portee: "choisies", choix: new Set([4]), confirmer: true });
    assert.equal(c.confirmer, true);
    assert.deepEqual(c.celluleIds, [4]);
});

test("PATCH : jamais de toutes ni de date, liste complète des cellules", () => {
    const toutes = corpsJourNa({ ...base, edition: true, portee: "toutes", choix: new Set([4]) });
    assert.deepEqual(toutes, { motif: "Convention nationale", celluleIds: [4, 9, 12] });
    const choisies = corpsJourNa({ ...base, edition: true, portee: "choisies", choix: new Set([12]), confirmer: true });
    assert.deepEqual(choisies, { motif: "Convention nationale", celluleIds: [12], confirmer: true });
    assert.ok(!("toutes" in choisies) && !("date" in choisies));
});

test("Validation : date, motif vide ou trop long, aucune cellule cochée", () => {
    const e = erreursJourNa({ date: "", motif: "   ", portee: "choisies", choix: new Set() });
    assert.deepEqual(Object.keys(e).sort(), ["cellules", "date", "motif"]);
    assert.ok(erreursJourNa({ date: "2026-11-15", motif: "x".repeat(201), portee: "toutes", choix: new Set() }).motif);
    assert.deepEqual(erreursJourNa({ date: "2026-11-15", motif: "x".repeat(200), portee: "toutes", choix: new Set() }), {});
});

test("409 PRESENCES_EXISTANTES reconnu, autres statuts non", () => {
    const conflit = new ErreurJoursNa("Conflit", { status: 409, code: "PRESENCES_EXISTANTES", cellules: [{ id: 4, name: "Cocody", presents: 12 }] });
    assert.equal(estConflitPresences(conflit), true);
    assert.equal(conflit.cellules[0].presents, 12);
    assert.equal(estConflitPresences(new ErreurJoursNa("x", { status: 409, code: "AUTRE" })), false);
    assert.equal(estConflitPresences(new Error("x")), false);
});

test("403 / 404 = données périmées, 409 et 500 non", () => {
    assert.equal(estDonneePerimee(new ErreurJoursNa("x", { status: 403 })), true);
    assert.equal(estDonneePerimee(new ErreurJoursNa("x", { status: 404 })), true);
    assert.equal(estDonneePerimee(new ErreurJoursNa("x", { status: 409 })), false);
    assert.equal(estDonneePerimee(new ErreurJoursNa("x", { status: 500 })), false);
});

test("trouverJourNa : par date et cellule (id nombre ou texte)", () => {
    const jours = [{ groupe: "g1", date: "2026-10-21", cellules: [{ id: 4 }, { id: 9 }] }];
    assert.equal(trouverJourNa(jours, "2026-10-21", "9")?.groupe, "g1");
    assert.equal(trouverJourNa(jours, "2026-10-21", 12), null);
    assert.equal(trouverJourNa(jours, "2026-10-22", 4), null);
});

test("Période : hors période et élargissement", () => {
    const p = { du: "2026-11-01", au: "2026-11-08" };
    assert.equal(horsPeriode("2026-11-15", p), true);
    assert.equal(horsPeriode("2026-11-08", p), false);
    assert.deepEqual(periodeIncluant(p, "2026-11-15"), { du: "2026-11-01", au: "2026-11-15" });
    assert.deepEqual(periodeIncluant(p, "2026-10-20"), { du: "2026-10-20", au: "2026-11-08" });
    // Au-delà de 366 jours : on affiche le mois de la date.
    assert.deepEqual(periodeIncluant(p, "2028-02-10"), { du: "2028-02-01", au: "2028-02-29" });
});

test("etatJoursNa : chargement tant que la réponse n'est pas celle de la date demandée", () => {
    const jour = { groupe: "g", date: "2026-11-15", cellules: [{ id: 4, name: "Cocody" }] };
    const cle = cleJoursNa({ du: "2026-11-15", au: "2026-11-15" });
    const recu = { cle, jours: [jour], erreur: "" };
    assert.deepEqual(etatJoursNa(recu, cle, true, false), { jours: [jour], error: "", loading: false });
    // Autre date : l'ancien groupe n'est pas montré.
    const autre = cleJoursNa({ du: "2026-11-22", au: "2026-11-22" });
    assert.deepEqual(etatJoursNa(recu, autre, true, false), { jours: [], error: "", loading: true });
    // Première ouverture : rien de reçu, pas de liste vide « définitive ».
    assert.equal(etatJoursNa({ cle: "", jours: [], erreur: "" }, cle, true, false).loading, true);
    // Rechargement de la même demande : la liste reste, en chargement.
    assert.deepEqual(etatJoursNa(recu, cle, true, true), { jours: [jour], error: "", loading: true });
    // Inactif : ni liste, ni erreur, ni chargement.
    const erreur = { cle, jours: [], erreur: "Erreur 500" };
    assert.equal(etatJoursNa(erreur, cle, true, false).error, "Erreur 500");
    assert.deepEqual(etatJoursNa(erreur, cle, false, true), { jours: [], error: "", loading: false });
});

test("cleJoursNa : distingue période et cellules, celluleIds absent = vide", () => {
    assert.equal(cleJoursNa({ du: "a", au: "b" }), cleJoursNa({ du: "a", au: "b", celluleIds: "" }));
    assert.notEqual(cleJoursNa({ du: "a", au: "b" }), cleJoursNa({ du: "a", au: "b", celluleIds: "1,4" }));
});
