// Tests de la logique pure des annonces : node --test src/backoffice/utils/
import test from "node:test";
import assert from "node:assert/strict";
import {
    announcementToForm,
    buildAnnouncementPayload,
    abidjanDateInput,
    abidjanNoonIso,
    emptyAnnouncementForm,
    formatAnnouncementDate,
    isHttpUrl,
    moveId,
    validateAnnouncementForm,
} from "./announcements.js";

test("la date saisie est stockée à midi, heure d'Abidjan", () => {
    assert.equal(abidjanNoonIso("2026-11-16"), "2026-11-16T12:00:00.000Z");
    assert.equal(abidjanNoonIso(""), null);
    assert.equal(abidjanNoonIso("16/11/2026"), null);
    assert.equal(abidjanNoonIso("2026-02-31"), null);
});

test("le jour relu est celui d'Abidjan (UTC+0)", () => {
    // Abidjan est à UTC+0 : 23h30 UTC le 31 août reste le 31 août.
    assert.equal(abidjanDateInput("2026-08-31T23:30:00.000Z"), "2026-08-31");
    assert.equal(abidjanDateInput("2026-11-16T12:00:00.000Z"), "2026-11-16");
    assert.equal(abidjanDateInput(null), "");
    assert.equal(abidjanDateInput("n'importe quoi"), "");
    assert.equal(formatAnnouncementDate("2026-08-31T23:30:00.000Z"), "31 août 2026");
});

test("aller-retour : la date saisie est relue à l'identique", () => {
    for (const jour of ["2026-01-01", "2026-03-29", "2026-10-25", "2026-12-31"]) {
        assert.equal(abidjanDateInput(abidjanNoonIso(jour)), jour);
    }
});

test("seuls les liens http(s) sont acceptés", () => {
    assert.equal(isHttpUrl("https://exemple.org/programme.pdf"), true);
    assert.equal(isHttpUrl("http://exemple.org"), true);
    assert.equal(isHttpUrl("exemple.org"), false);
    assert.equal(isHttpUrl("ftp://exemple.org"), false);
    assert.equal(isHttpUrl("javascript:alert(1)"), false);
    assert.equal(isHttpUrl("https://exemple .org"), false);
    assert.equal(isHttpUrl("https://exemple"), false);
    assert.equal(isHttpUrl(""), false);
    assert.equal(isHttpUrl(null), false);
});

test("l'édition pré-remplit tous les champs", () => {
    const form = announcementToForm({
        id: 4,
        title: "Convention",
        description: "Trois jours.",
        publishedAt: "2026-11-16T12:00:00.000Z",
        dateLabel: "Dimanche 16 nov. à 9h",
        programUrl: "https://exemple.org/p.pdf",
        rubriqueId: 2,
        isActive: false,
        sortOrder: 3,
    });
    assert.deepEqual(form, {
        title: "Convention",
        description: "Trois jours.",
        eventDate: "2026-11-16",
        dateLabel: "Dimanche 16 nov. à 9h",
        programUrl: "https://exemple.org/p.pdf",
        rubriqueId: "2",
        isActive: false,
    });
});

test("une annonce incomplète (créée avant le correctif) reste éditable", () => {
    const form = announcementToForm({
        id: 1,
        title: "Culte",
        description: "",
        publishedAt: "2026-11-01T23:30:00.000Z",
        dateLabel: null,
        programUrl: null,
        rubriqueId: null,
        isActive: true,
    });
    assert.equal(form.eventDate, "2026-11-01");
    assert.equal(form.rubriqueId, "");
    assert.equal(form.dateLabel, "");
    assert.equal(form.programUrl, "");
    assert.deepEqual(validateAnnouncementForm(form), {});
});

test("nouvelle annonce : date du jour à Abidjan, active, sans rubrique", () => {
    const form = emptyAnnouncementForm(new Date("2026-11-12T23:30:00.000Z"));
    assert.equal(form.eventDate, "2026-11-12");
    assert.equal(form.rubriqueId, "");
    assert.equal(form.isActive, true);
});

test("validation : titre et date obligatoires, lien http(s), longueurs", () => {
    const base = emptyAnnouncementForm(new Date("2026-11-12T10:00:00.000Z"));
    assert.deepEqual(Object.keys(validateAnnouncementForm(base)), ["title"]);
    assert.deepEqual(
        Object.keys(
            validateAnnouncementForm({
                ...base,
                title: "   ",
                eventDate: "",
                dateLabel: "x".repeat(81),
                programUrl: "exemple.org",
            }),
        ),
        ["title", "eventDate", "dateLabel", "programUrl"],
    );
    assert.ok(validateAnnouncementForm({ ...base, title: "x".repeat(256) }).title);
    assert.deepEqual(validateAnnouncementForm({ ...base, title: "Culte" }), {});
});

test("le corps envoyé contient tous les champs, null pour les champs vidés", () => {
    assert.deepEqual(
        buildAnnouncementPayload({
            title: "  Convention ",
            description: "Trois jours.\nVenez. ",
            eventDate: "2026-11-16",
            dateLabel: " Dimanche 16 nov. à 9h ",
            programUrl: " https://exemple.org/p.pdf ",
            rubriqueId: "2",
            isActive: true,
        }),
        {
            title: "Convention",
            description: "Trois jours.\nVenez.",
            publishedAt: "2026-11-16T12:00:00.000Z",
            dateLabel: "Dimanche 16 nov. à 9h",
            programUrl: "https://exemple.org/p.pdf",
            rubriqueId: 2,
            isActive: true,
        },
    );
    const vide = buildAnnouncementPayload({
        title: "Culte",
        description: "",
        eventDate: "2026-11-16",
        dateLabel: "",
        programUrl: "",
        rubriqueId: "",
        isActive: false,
    });
    assert.equal(vide.dateLabel, null);
    assert.equal(vide.programUrl, null);
    assert.equal(vide.rubriqueId, null);
    assert.equal(vide.isActive, false);
    assert.equal("sortOrder" in vide, false);
    assert.equal("likes" in vide, false);
});

test("monter et descendre réécrivent l'ordre complet", () => {
    assert.deepEqual(moveId([3, 1, 2], 1, -1), [1, 3, 2]);
    assert.deepEqual(moveId([3, 1, 2], 1, 1), [3, 2, 1]);
    assert.equal(moveId([3, 1, 2], 3, -1), null);
    assert.equal(moveId([3, 1, 2], 2, 1), null);
    assert.equal(moveId([3, 1, 2], 9, 1), null);
});
