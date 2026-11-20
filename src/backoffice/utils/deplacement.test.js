// Tests de la logique pure du déplacement de membres (lanceur intégré : node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    basculer,
    basculerTout,
    cellulesCibles,
    corpsDeplacement,
    peutDeplacer,
    libelleRecap,
    libelleResultat,
    purgerSelection,
    toutEstSelectionne,
} from "./deplacement.js";

const USERS = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 10 }];

test("basculer ajoute puis retire sans muter l'original", () => {
    const base = new Set([1]);
    const avec = basculer(base, 2);
    assert.deepEqual([...avec], [1, 2]);
    assert.deepEqual([...base], [1]);
    assert.deepEqual([...basculer(avec, 1)], [2]);
});

test("tout sélectionner : le responsable est exclu, et seule la liste affichée est touchée", () => {
    const tout = basculerTout(new Set(), USERS, 10);
    assert.deepEqual([...tout].sort(), [1, 2, 3]);
    const filtre = basculerTout(new Set([3]), [{ id: 1 }, { id: 10 }], 10);
    assert.deepEqual([...filtre].sort(), [1, 3]);
});

test("tout sélectionner une seconde fois décoche la liste affichée", () => {
    const plein = new Set([1, 2, 3]);
    assert.equal(toutEstSelectionne(plein, USERS, 10), true);
    assert.deepEqual([...basculerTout(plein, USERS, 10)], []);
    assert.equal(toutEstSelectionne(new Set(), [{ id: 10 }], 10), false);
});

test("purgerSelection retire les membres partis", () => {
    assert.deepEqual([...purgerSelection(new Set([1, 99]), USERS)], [1]);
});

test("corps envoyé : liste ou tous", () => {
    assert.deepEqual(corpsDeplacement({ celluleCibleId: "5", ids: new Set([1, 2]), tous: false }), {
        celluleCibleId: 5,
        userIds: [1, 2],
    });
    assert.deepEqual(corpsDeplacement({ celluleCibleId: 5, ids: new Set([1]), tous: true }), {
        celluleCibleId: 5,
        tous: true,
    });
});

test("libellés : récapitulatif et résultat", () => {
    assert.equal(
        libelleRecap(2, "A", "B"),
        "2 membres de A vers B. Ils recevront une notification. Les présences passées restent dans A.",
    );
    assert.equal(libelleResultat({ deplaces: 1, cible: { name: "B" }, ignores: [] }), "1 membre déplacé vers B");
    assert.equal(
        libelleResultat({
            deplaces: 2,
            cible: { name: "B" },
            ignores: [{ id: 9, raison: "responsable de la cellule" }],
        }),
        "2 membres déplacés vers B · 1 ignoré (responsable de la cellule)",
    );
});

test("cellules cibles : actives, hors courante, recherche, tri", () => {
    const toutes = [
        { id: 1, name: "Zèbre", isActive: true },
        { id: 2, name: "Alpha", isActive: true },
        { id: 3, name: "Éteinte", isActive: false },
        { id: 4, name: "Alphabet", isActive: true },
    ];
    assert.deepEqual(cellulesCibles(toutes, "1", "").map((c) => c.id), [2, 4]);
    assert.deepEqual(cellulesCibles(toutes, 4, "ALPH").map((c) => c.id), [2]);
});

test("peutDeplacer : admin seulement", () => {
    assert.equal(peutDeplacer({ role: "ADMIN" }), true);
    assert.equal(peutDeplacer({ role: "USER" }), false);
    assert.equal(peutDeplacer({ role: "LEADER" }), false);
    assert.equal(peutDeplacer(null), false);
    assert.equal(peutDeplacer(undefined), false);
});
