import { test } from "node:test";
import assert from "node:assert/strict";
import { appliquerMoi, CLE_SESSION, lireStockage, rafraichirDepuisServeur, sessionAplatie } from "./permissionsStockage.js";

// Faux localStorage.
const stockage = (valeur) => {
    const m = new Map(valeur ? [[CLE_SESSION, JSON.stringify(valeur)]] : []);
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};
const connexion = { user: { token: "t", user: { id: 5, role: "USER", nom: "Awa" } } };
const moi = { user: { id: 5, role: "ADMIN", nom: "Awa" }, superAdmin: false, roles: [{ id: 2 }], permissions: [{ code: "bo.acces" }] };

test("appliquerMoi : écrit permissions, rôles et superAdmin dans la session stockée", () => {
    const s = stockage(connexion);
    const session = appliquerMoi(moi, s);
    assert.deepEqual(session.permissions, [{ code: "bo.acces" }]);
    assert.equal(session.role, "ADMIN");
    assert.equal(session.token, "t");
    const relu = lireStockage(s);
    assert.deepEqual(relu.user.roles, [{ id: 2 }]);
    assert.equal(relu.user.superAdmin, false);
});

test("appliquerMoi : sans session stockée, rien n'est écrit", () => {
    const s = stockage(null);
    assert.equal(appliquerMoi(moi, s), null);
    assert.equal(lireStockage(s), null);
});

test("appliquerMoi : un stockage plein ne casse pas, la session rendue est à jour", () => {
    const s = stockage(connexion);
    s.setItem = () => {
        throw new Error("quota");
    };
    assert.deepEqual(appliquerMoi(moi, s).permissions, [{ code: "bo.acces" }]);
});

test("sessionAplatie : champs de la connexion au premier niveau", () => {
    assert.equal(sessionAplatie(null), null);
    assert.equal(sessionAplatie(connexion).nom, "Awa");
});

test("rafraichir : 404 sur /auth/moi ignoré, le repli reste en place", async () => {
    const s = stockage(connexion);
    const fetchFn = async () => ({ ok: false, status: 404, json: async () => ({}) });
    assert.equal(await rafraichirDepuisServeur({ url: "x", headers: {}, storage: s, fetchFn }), null);
    assert.equal("permissions" in lireStockage(s).user, false);
});

test("rafraichir : réseau en échec ignoré ; réponse sans permissions ignorée", async () => {
    const s = stockage(connexion);
    const echec = async () => {
        throw new Error("réseau");
    };
    assert.equal(await rafraichirDepuisServeur({ url: "x", headers: {}, storage: s, fetchFn: echec }), null);
    const sans = async () => ({ ok: true, json: async () => ({ user: {} }) });
    assert.equal(await rafraichirDepuisServeur({ url: "x", headers: {}, storage: s, fetchFn: sans }), null);
});

test("rafraichir : réponse valide appliquée, en-têtes transmis", async () => {
    const s = stockage(connexion);
    let appel;
    const fetchFn = async (url, opts) => {
        appel = { url, opts };
        return { ok: true, json: async () => moi };
    };
    const session = await rafraichirDepuisServeur({ url: "/auth/moi", headers: { Authorization: "Bearer t" }, storage: s, fetchFn });
    assert.deepEqual(session.permissions, [{ code: "bo.acces" }]);
    assert.equal(appel.url, "/auth/moi");
    assert.equal(appel.opts.headers.Authorization, "Bearer t");
});
