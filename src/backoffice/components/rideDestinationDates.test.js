import assert from "node:assert/strict";
import process from "node:process";
import { test } from "node:test";
import {
    debutJourAbidjan,
    finJourAbidjan,
    jourAbidjan,
} from "./rideDestinationDates.js";

test("début : minuit à Abidjan", () => {
    assert.equal(debutJourAbidjan("2026-11-14"), "2026-11-14T00:00:00.000Z");
});

test("fin : 23:59:59 à Abidjan, même convention que le début", () => {
    assert.equal(finJourAbidjan("2026-11-14"), "2026-11-14T23:59:59.000Z");
});

test("un événement d'un seul jour couvre toute la journée d'Abidjan", () => {
    const debut = new Date(debutJourAbidjan("2026-11-14"));
    const fin = new Date(finJourAbidjan("2026-11-14"));
    assert.equal(fin - debut, (24 * 3600 - 1) * 1000);
});

test("les bornes ne dépendent pas du fuseau de l'ordinateur", () => {
    const avant = process.env.TZ;
    try {
        for (const tz of ["America/New_York", "Europe/Paris", "Asia/Tokyo"]) {
            process.env.TZ = tz;
            assert.equal(debutJourAbidjan("2026-07-01"), "2026-07-01T00:00:00.000Z");
            assert.equal(finJourAbidjan("2026-07-01"), "2026-07-01T23:59:59.000Z");
            assert.equal(jourAbidjan("2026-07-01T23:59:59.000Z"), "2026-07-01");
        }
    } finally {
        if (avant === undefined) delete process.env.TZ;
        else process.env.TZ = avant;
    }
});

test("jour vide ou invalide : null", () => {
    for (const jour of ["", null, undefined, "14/11/2026", "2026-02-30", "2026-13-01"]) {
        assert.equal(debutJourAbidjan(jour), null);
        assert.equal(finJourAbidjan(jour), null);
    }
});

test("relecture : les bornes enregistrées redonnent le jour saisi", () => {
    assert.equal(jourAbidjan(debutJourAbidjan("2026-11-14")), "2026-11-14");
    assert.equal(jourAbidjan(finJourAbidjan("2026-11-14")), "2026-11-14");
    assert.equal(jourAbidjan(null), "");
    assert.equal(jourAbidjan("n'importe quoi"), "");
});
