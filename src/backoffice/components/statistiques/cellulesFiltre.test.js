// Tests de la logique pure du filtre multi-cellules (lanceur intégré : node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    basculerCellule,
    chaineRequete,
    filtrerCellules,
    libelleCellules,
    MAX_CELLULES,
    parametreCelluleIds,
    selectionValide,
} from "./cellulesFiltre.js";

const CELLULES = [
    { id: 1, name: "Abobo" },
    { id: 4, name: "Cocody" },
    { id: 9, name: "Dabou" },
    { id: 12, name: "Saint-Éloi" },
];

test("URL : celluleIds=1,4,9 avec virgules lisibles", () => {
    const celluleIds = parametreCelluleIds([1, 4, 9]);
    assert.equal(
        chaineRequete({ du: "2026-11-01", au: "2026-11-12", celluleIds }),
        "?du=2026-11-01&au=2026-11-12&celluleIds=1,4,9"
    );
});

test("URL : « Toutes » n'envoie ni celluleIds ni celluleId", () => {
    const s = chaineRequete({ du: "2026-11-01", au: "2026-11-12", celluleIds: parametreCelluleIds([]) });
    assert.equal(s, "?du=2026-11-01&au=2026-11-12");
});

test("URL : format d'export ajouté, paramètres vides ignorés", () => {
    assert.equal(
        chaineRequete({ du: "2026-11-01", au: "2026-11-12", celluleIds: "4", format: "pdf" }),
        "?du=2026-11-01&au=2026-11-12&celluleIds=4&format=pdf"
    );
    assert.equal(chaineRequete({ du: "", au: null, celluleIds: undefined }), "");
});

test("parametreCelluleIds : entiers > 0, sans doublon", () => {
    assert.equal(parametreCelluleIds([4, "9", 4, 0, -2, "a", 1.5]), "4,9");
    assert.equal(parametreCelluleIds([]), "");
    assert.equal(parametreCelluleIds(undefined), "");
});

test("Libellé : toutes, nom de la cellule, N cellules", () => {
    assert.equal(libelleCellules([], CELLULES), "Toutes les cellules");
    assert.equal(libelleCellules([4], CELLULES), "Cocody");
    assert.equal(libelleCellules([4, 9, 12], CELLULES), "3 cellules");
    assert.equal(libelleCellules([99], CELLULES), "1 cellule");
});

test("Sélection : Toutes -> une cellule -> plusieurs, dans l'ordre de la liste", () => {
    const une = basculerCellule([], 9, CELLULES);
    assert.deepEqual(une, [9]);
    assert.deepEqual(basculerCellule(une, 1, CELLULES), [1, 9]);
});

test("Sélection : décocher la dernière cellule revient à Toutes", () => {
    assert.deepEqual(basculerCellule([4], 4, CELLULES), []);
});

test("Sélection : tout cocher revient à Toutes", () => {
    assert.deepEqual(basculerCellule([1, 4, 9], 12, CELLULES), []);
});

test("Sélection : limite de 100 cellules", () => {
    const beaucoup = Array.from({ length: MAX_CELLULES + 5 }, (_, i) => ({ id: i + 1, name: `C${i + 1}` }));
    const pleine = beaucoup.slice(0, MAX_CELLULES).map((c) => c.id);
    assert.equal(basculerCellule(pleine, MAX_CELLULES + 1, beaucoup), pleine);
    assert.equal(basculerCellule(pleine, 1, beaucoup).length, MAX_CELLULES - 1);
});

test("selectionValide : retire les cellules disparues de la liste", () => {
    assert.deepEqual(selectionValide([4, 77, 9], CELLULES), [4, 9]);
    assert.deepEqual(selectionValide([77], CELLULES), []);
});

test("Recherche : sans accents ni casse ; vide = tout", () => {
    assert.deepEqual(filtrerCellules(CELLULES, "  eloi ").map((c) => c.id), [12]);
    assert.deepEqual(filtrerCellules(CELLULES, "DA").map((c) => c.id), [9]);
    assert.equal(filtrerCellules(CELLULES, "").length, 4);
    assert.deepEqual(filtrerCellules(CELLULES, "zzz"), []);
});
