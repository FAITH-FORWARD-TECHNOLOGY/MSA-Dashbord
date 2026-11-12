// Directs : heure de l'ordinateur de l'admin et équivalent à Abidjan.
// Fuseau du « navigateur » changé d'un test à l'autre (Intl relit TZ).
import process from "node:process";
import test from "node:test";
import assert from "node:assert/strict";
import { liveScheduleHint, liveScheduleLabels } from "./lives.js";

const NOW = new Date("2026-11-12T12:00:00.000Z");
const setZone = (zone) => {
    process.env.TZ = zone;
};

test("aide du champ : admin à Paris, équivalent à Abidjan", () => {
    setZone("Europe/Paris");
    assert.equal(
        liveScheduleHint("2026-11-15T18:00", NOW),
        "Heure de votre ordinateur (Europe/Paris, UTC+1) — soit 17h00 à Abidjan",
    );
    // Minutes conservées, heure sans zéro initial.
    assert.equal(
        liveScheduleHint("2026-11-15T10:05", NOW),
        "Heure de votre ordinateur (Europe/Paris, UTC+1) — soit 9h05 à Abidjan",
    );
});

test("aide du champ : le décalage est celui du jour saisi (heure d'été)", () => {
    setZone("Europe/Paris");
    assert.equal(
        liveScheduleHint("2026-07-04T18:00", NOW),
        "Heure de votre ordinateur (Europe/Paris, UTC+2) — soit 16h00 à Abidjan",
    );
});

test("aide du champ : jour d'Abidjan précisé quand il diffère", () => {
    setZone("Europe/Paris");
    assert.equal(
        liveScheduleHint("2026-11-16T00:30", NOW),
        "Heure de votre ordinateur (Europe/Paris, UTC+1) — soit 23h30 à Abidjan, le 15 nov. 2026",
    );
    setZone("America/Los_Angeles");
    assert.equal(
        liveScheduleHint("2026-11-15T20:00", NOW),
        "Heure de votre ordinateur (America/Los_Angeles, UTC-8) — soit 4h00 à Abidjan, le 16 nov. 2026",
    );
});

test("aide du champ : admin à Abidjan, même heure", () => {
    setZone("Africa/Abidjan");
    assert.equal(
        liveScheduleHint("2026-11-15T18:00", NOW),
        "Heure de votre ordinateur (Africa/Abidjan, UTC+0) — soit 18h00 à Abidjan",
    );
});

test("aide du champ : décalage à la demi-heure", () => {
    setZone("Asia/Kolkata");
    // Le nom de la zone dépend de la version d'ICU (Kolkata ou Calcutta).
    assert.match(
        liveScheduleHint("2026-11-15T23:30", NOW),
        /^Heure de votre ordinateur \(Asia\/\w+, UTC\+5:30\) — soit 18h00 à Abidjan$/,
    );
});

test("aide du champ : sans saisie valide, seul le fuseau est rappelé", () => {
    setZone("Europe/Paris");
    for (const vide of ["", null, undefined, "2026-11-15", "2026-02-31T10:00"]) {
        assert.equal(
            liveScheduleHint(vide, NOW),
            "Heure de votre ordinateur (Europe/Paris, UTC+1)",
        );
    }
});

test("liste : heure de l'ordinateur et heure d'Abidjan", () => {
    setZone("Europe/Paris");
    assert.deepEqual(liveScheduleLabels("2026-11-15T18:00:00.000Z"), {
        local: "15 nov. 2026 à 19h00",
        abidjan: "18h00 à Abidjan",
    });
    // 23h30 à Abidjan = le lendemain à Paris.
    assert.deepEqual(liveScheduleLabels("2026-11-15T23:30:00.000Z"), {
        local: "16 nov. 2026 à 0h30",
        abidjan: "23h30 à Abidjan, le 15 nov. 2026",
    });
    setZone("Asia/Tokyo");
    assert.deepEqual(liveScheduleLabels("2026-11-15T18:00:00.000Z"), {
        local: "16 nov. 2026 à 3h00",
        abidjan: "18h00 à Abidjan, le 15 nov. 2026",
    });
    setZone("Africa/Abidjan");
    assert.deepEqual(liveScheduleLabels("2026-11-15T18:00:00.000Z"), {
        local: "15 nov. 2026 à 18h00",
        abidjan: "18h00 à Abidjan",
    });
});

test("liste : instant absent ou illisible", () => {
    for (const vide of [null, undefined, "", "demain"]) {
        assert.equal(liveScheduleLabels(vide), null);
    }
});
