// Tests du générateur et de la validation du mot de passe défini par un admin (node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    CHIFFRES,
    erreursMotDePasse,
    genererMotDePasse,
    LONGUEUR_GENEREE,
    MAJUSCULES,
    MDP_MIN,
    MDP_OCTETS_MAX,
    MINUSCULES,
    motDePasseValide,
    octets,
    reglesMotDePasse,
    SYMBOLES,
} from "./motDePasse.js";

const contientUn = (mdp, jeu) => [...mdp].some((c) => jeu.includes(c));

test("règles alignées sur le serveur : 8 caractères au moins, 72 octets UTF-8 au plus", () => {
    assert.equal(MDP_MIN, 8);
    assert.equal(MDP_OCTETS_MAX, 72);
    assert.equal(motDePasseValide("a".repeat(7), "a".repeat(7)), false);
    assert.equal(motDePasseValide("a".repeat(8), "a".repeat(8)), true);
    assert.equal(motDePasseValide("a".repeat(72), "a".repeat(72)), true);
    assert.equal(motDePasseValide("a".repeat(73), "a".repeat(73)), false);
    // « é » vaut 2 octets : 36 passent, 37 non.
    assert.equal(octets("é"), 2);
    assert.equal(motDePasseValide("é".repeat(36), "é".repeat(36)), true);
    assert.equal(motDePasseValide("é".repeat(37), "é".repeat(37)), false);
});

test("erreurs par champ : vide, trop court, trop long, confirmation différente", () => {
    assert.deepEqual(erreursMotDePasse("", ""), {
        mdp: "Saisissez un mot de passe.",
        confirmation: "Confirmez le mot de passe.",
    });
    assert.equal(erreursMotDePasse("court", "court").mdp, "Au moins 8 caractères.");
    assert.equal(
        erreursMotDePasse("a".repeat(73), "x").mdp,
        "Mot de passe trop long : 72 octets au plus (environ 72 caractères sans accents).",
    );
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
    assert.deepEqual(etat("é".repeat(37), "é".repeat(37)), [false, true]);
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

test("générateur : longueur bornée entre 8 et 72", () => {
    assert.equal(genererMotDePasse(3).length, MDP_MIN);
    assert.equal(genererMotDePasse(500).length, MDP_OCTETS_MAX);
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
