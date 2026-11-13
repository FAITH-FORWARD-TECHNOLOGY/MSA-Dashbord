// Tests du générateur et de la validation du mot de passe défini par un admin (node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    CHIFFRES,
    erreursMotDePasse,
    genererMotDePasse,
    LONGUEUR_GENEREE,
    MAJUSCULES,
    MDP_MAX,
    MDP_MIN,
    MINUSCULES,
    motDePasseValide,
    reglesMotDePasse,
    SYMBOLES,
} from "./motDePasse.js";

const contientUn = (mdp, jeu) => [...mdp].some((c) => jeu.includes(c));

test("règles alignées sur le serveur : 8 à 128 caractères", () => {
    assert.equal(MDP_MIN, 8);
    assert.equal(MDP_MAX, 128);
    assert.equal(motDePasseValide("a".repeat(7), "a".repeat(7)), false);
    assert.equal(motDePasseValide("a".repeat(8), "a".repeat(8)), true);
    assert.equal(motDePasseValide("a".repeat(128), "a".repeat(128)), true);
    assert.equal(motDePasseValide("a".repeat(129), "a".repeat(129)), false);
});

test("erreurs par champ : vide, trop court, trop long, confirmation différente", () => {
    assert.deepEqual(erreursMotDePasse("", ""), {
        mdp: "Saisissez un mot de passe.",
        confirmation: "Confirmez le mot de passe.",
    });
    assert.equal(erreursMotDePasse("court", "court").mdp, "Au moins 8 caractères.");
    assert.equal(erreursMotDePasse("a".repeat(129), "x").mdp, "Au plus 128 caractères.");
    assert.equal(
        erreursMotDePasse("Secret-123", "Secret-124").confirmation,
        "Les deux saisies ne sont pas identiques.",
    );
    assert.deepEqual(erreursMotDePasse("Secret-123", "Secret-123"), {
        mdp: "",
        confirmation: "",
    });
});

test("règles affichées : état de chaque règle", () => {
    const etat = (m, c) => reglesMotDePasse(m, c).map((r) => r.ok);
    assert.deepEqual(etat("", ""), [false, false]);
    assert.deepEqual(etat("Secret-123", ""), [true, false]);
    assert.deepEqual(etat("Secret-123", "Secret-123"), [true, true]);
    assert.deepEqual(etat("court", "court"), [false, true]);
});

test("générateur : longueur, un caractère de chaque jeu, conforme aux règles", () => {
    for (let i = 0; i < 200; i++) {
        const mdp = genererMotDePasse();
        assert.equal(mdp.length, LONGUEUR_GENEREE);
        for (const jeu of [MINUSCULES, MAJUSCULES, CHIFFRES, SYMBOLES]) {
            assert.ok(contientUn(mdp, jeu), `${jeu} absent`);
        }
        assert.ok(motDePasseValide(mdp, mdp));
        assert.doesNotMatch(mdp, /[0O1lI]/);
    }
});

test("générateur : longueur bornée entre 8 et 128", () => {
    assert.equal(genererMotDePasse(3).length, MDP_MIN);
    assert.equal(genererMotDePasse(500).length, MDP_MAX);
});

test("générateur : tirages issus de la source aléatoire, sans biais de modulo", () => {
    const appels = [];
    // Premier tirage hors plafond (rejeté), puis valeurs prévisibles.
    let k = 0;
    const source = (n) => {
        appels.push(n);
        return Uint32Array.of(k++ === 0 ? 0xffffffff : k);
    };
    const mdp = genererMotDePasse(10, source);
    assert.equal(mdp.length, 10);
    assert.ok(appels.length > 10);
    assert.ok(appels.every((n) => n === 1));
});

test("générateur : deux tirages successifs diffèrent", () => {
    const vus = new Set(Array.from({ length: 50 }, () => genererMotDePasse()));
    assert.equal(vus.size, 50);
});
