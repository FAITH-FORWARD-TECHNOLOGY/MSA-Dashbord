// Tests de la logique pure de l'import d'utilisateurs (lanceur intégré : node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    cellulesActives,
    erreurFichierUtilisateurs,
    filtrerCellules,
    formulaireImportValide,
    motDePasseCommunFaible,
    MESSAGE_MDP_FAIBLE,
    paysParDefaut,
} from "./importUtilisateurs.js";

const fichier = (nom, taille = 10) => ({ name: nom, size: taille });

test("cellulesActives : écarte les inactives et trie par nom", () => {
    const r = cellulesActives([
        { id: 1, name: "Zion", isActive: true },
        { id: 2, name: "Alpha", isActive: false },
        { id: 3, name: "Béthel" },
    ]);
    assert.deepEqual(r.map((c) => c.id), [3, 1]);
});

test("filtrerCellules : sans accents ni casse", () => {
    const l = [{ name: "Béthel" }, { name: "Zion" }];
    assert.equal(filtrerCellules(l, "BETHE").length, 1);
    assert.equal(filtrerCellules(l, "").length, 2);
    assert.equal(filtrerCellules(l, "xyz").length, 0);
});

test("paysParDefaut : Côte d'Ivoire, sinon le premier", () => {
    assert.equal(paysParDefaut([{ id: 5, nom: "Ghana", code: "GH" }, { id: 9, nom: "Côte d'Ivoire", code: "CI" }]), 9);
    assert.equal(paysParDefaut([{ id: 5, nom: "Ghana", code: "GH" }]), 5);
    assert.equal(paysParDefaut([]), "");
});

test("erreurFichierUtilisateurs : extension, vide, taille", () => {
    assert.match(erreurFichierUtilisateurs(null), /Choisissez/);
    assert.match(erreurFichierUtilisateurs(fichier("a.xlsx")), /\.csv/);
    assert.match(erreurFichierUtilisateurs(fichier("a.csv", 0)), /vide/);
    assert.match(erreurFichierUtilisateurs(fichier("a.csv", 3 * 1024 * 1024)), /2 Mo/);
    assert.equal(erreurFichierUtilisateurs(fichier("A.CSV")), "");
});

test("formulaireImportValide : tout est requis, mots de passe identiques", () => {
    const ok = { celluleId: 1, paysId: 2, motDePasse: "Secret-1234", confirmation: "Secret-1234", fichier: fichier("a.csv") };
    assert.equal(formulaireImportValide(ok), true);
    assert.equal(formulaireImportValide({ ...ok, celluleId: "" }), false);
    assert.equal(formulaireImportValide({ ...ok, confirmation: "autre" }), false);
    assert.equal(formulaireImportValide({ ...ok, motDePasse: "court", confirmation: "court" }), false);
    assert.equal(formulaireImportValide({ ...ok, fichier: null }), false);
});

test("motDePasseCommunFaible : longueur, lettre et chiffre, motifs, répétitions, suites", () => {
    const faibles = [
        "123123123", "Password", "msa12345", "aaaaaaaa", "987654321", "12341234", "11223344",
        "azertyuiop", "qwertyuiop", "Msa@2026", "jesus123", "Password1", "Église#Vivante1",
        "Motdepasse2026", "abcdefgh1", "Court1", "1234123412", "Ab1Ab1Ab1Ab1",
    ];
    for (const m of faibles) assert.equal(motDePasseCommunFaible(m), true, m);
    for (const m of ["Commun-e2e-2026", "Tournesol7Lac", "ciel-Bleu-42x"]) assert.equal(motDePasseCommunFaible(m), false, m);
    assert.match(MESSAGE_MDP_FAIBLE, /10 caractères/);
    const ok = { celluleId: 1, paysId: 2, motDePasse: "123123123", confirmation: "123123123", fichier: fichier("a.csv") };
    assert.equal(formulaireImportValide(ok), false);
});
