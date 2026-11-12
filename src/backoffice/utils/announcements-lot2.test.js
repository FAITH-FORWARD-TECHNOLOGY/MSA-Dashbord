// Annonces lot 2 : types, image, vidéo, fenêtre de diffusion et onglets d'état.
// Fuseau du « navigateur » figé pour des résultats stables (UTC+1 en hiver).
import process from "node:process";
import test from "node:test";
import assert from "node:assert/strict";
import {
    ETAT_FILTERS,
    announcementEtat,
    announcementToForm,
    announcementTypeLabel,
    browserTimeZoneLabel,
    buildAnnouncementPayload,
    countByEtat,
    emptyAnnouncementForm,
    filterByEtat,
    isoToLocalInput,
    localInputToIso,
    moveWithin,
    validateAnnouncementForm,
    validateImageFile,
    youtubeVideoId,
} from "./announcements.js";

process.env.TZ = "Europe/Paris";

const NOW = new Date("2026-11-12T12:00:00.000Z");
const IMAGE =
    "https://api.exemple.org/communication/media/3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b.png";
const base = () => ({ ...emptyAnnouncementForm(NOW), title: "Culte" });

test("la saisie locale devient un instant UTC, et inversement", () => {
    // 9h à Paris en novembre = 8h UTC.
    assert.equal(localInputToIso("2026-11-16T09:00"), "2026-11-16T08:00:00.000Z");
    assert.equal(isoToLocalInput("2026-11-16T08:00:00.000Z"), "2026-11-16T09:00");
    // Heure d'été : UTC+2.
    assert.equal(localInputToIso("2026-07-01T09:30"), "2026-07-01T07:30:00.000Z");
    assert.equal(isoToLocalInput(localInputToIso("2026-12-31T23:59")), "2026-12-31T23:59");
    for (const invalide of ["", null, undefined, "2026-11-16", "2026-02-31T10:00", "demain"]) {
        assert.equal(localInputToIso(invalide), null);
    }
    assert.equal(isoToLocalInput(null), "");
    assert.equal(isoToLocalInput("n'importe quoi"), "");
});

test("le fuseau du navigateur est nommé près des champs de date", () => {
    assert.equal(browserTimeZoneLabel(NOW), "Europe/Paris, UTC+1");
    assert.equal(browserTimeZoneLabel(new Date("2026-07-01T12:00:00Z")), "Europe/Paris, UTC+2");
});

test("lien YouTube : mêmes formes que le backend", () => {
    for (const lien of [
        "https://www.youtube.com/watch?v=abcdefghijk",
        "https://youtu.be/abcdefghijk?t=10",
        "https://m.youtube.com/live/abcdefghijk",
        "https://www.youtube.com/shorts/abcdefghijk",
        "abcdefghijk",
    ]) {
        assert.equal(youtubeVideoId(lien), "abcdefghijk");
    }
    for (const lien of ["", null, "https://vimeo.com/1234", "youtube", "https://youtu.be/court"]) {
        assert.equal(youtubeVideoId(lien), null);
    }
});

test("validation par type : image ou lien YouTube obligatoire", () => {
    assert.deepEqual(validateAnnouncementForm({ ...base(), type: "TEXTE" }), {});
    assert.deepEqual(Object.keys(validateAnnouncementForm({ ...base(), type: "IMAGE" })), [
        "imageUrl",
    ]);
    assert.deepEqual(
        validateAnnouncementForm({ ...base(), type: "IMAGE", imageUrl: IMAGE }),
        {},
    );
    assert.match(
        validateAnnouncementForm({ ...base(), type: "VIDEO" }).videoUrl,
        /Indiquez le lien YouTube/,
    );
    assert.match(
        validateAnnouncementForm({ ...base(), type: "VIDEO", videoUrl: "https://vimeo.com/1" })
            .videoUrl,
        /invalide/,
    );
    assert.deepEqual(
        validateAnnouncementForm({
            ...base(),
            type: "VIDEO",
            videoUrl: "https://youtu.be/abcdefghijk",
        }),
        {},
    );
    // Une image restée dans le formulaire ne bloque pas une annonce Texte.
    assert.deepEqual(validateAnnouncementForm({ ...base(), type: "TEXTE", videoUrl: "x" }), {});
});

test("validation de la fenêtre : dates facultatives, fin après le début", () => {
    const avec = (startsAt, endsAt) =>
        validateAnnouncementForm({ ...base(), startsAt, endsAt });
    assert.deepEqual(avec("", ""), {});
    assert.deepEqual(avec("2026-11-16T09:00", ""), {});
    assert.deepEqual(avec("", "2026-11-20T18:00"), {});
    assert.deepEqual(avec("2026-11-16T09:00", "2026-11-20T18:00"), {});
    assert.deepEqual(Object.keys(avec("2026-11-16T09:00", "2026-11-16T09:00")), ["endsAt"]);
    assert.deepEqual(Object.keys(avec("2026-11-16T09:00", "2026-11-15T09:00")), ["endsAt"]);
    assert.deepEqual(Object.keys(avec("2026-02-31T09:00", "pas une date")), [
        "startsAt",
        "endsAt",
    ]);
});

test("le corps envoyé porte le type, son contenu seul et la fenêtre en UTC", () => {
    const image = buildAnnouncementPayload({
        ...base(),
        type: "IMAGE",
        imageUrl: IMAGE,
        videoUrl: "https://youtu.be/abcdefghijk",
        startsAt: "2026-11-16T09:00",
        endsAt: "",
    });
    assert.equal(image.type, "IMAGE");
    assert.equal(image.imageUrl, IMAGE);
    assert.equal(image.videoUrl, null);
    assert.equal(image.startsAt, "2026-11-16T08:00:00.000Z");
    assert.equal(image.endsAt, null);

    const video = buildAnnouncementPayload({
        ...base(),
        type: "VIDEO",
        imageUrl: IMAGE,
        videoUrl: " https://youtu.be/abcdefghijk ",
    });
    assert.equal(video.imageUrl, null);
    assert.equal(video.videoUrl, "https://youtu.be/abcdefghijk");

    const texte = buildAnnouncementPayload({ ...base(), type: "INCONNU", imageUrl: IMAGE });
    assert.equal(texte.type, "TEXTE");
    assert.equal(texte.imageUrl, null);
});

test("une annonce du serveur remplit le formulaire, dates en heure locale", () => {
    const form = announcementToForm(
        {
            title: "Affiche",
            type: "IMAGE",
            imageUrl: IMAGE,
            videoUrl: null,
            startsAt: "2026-11-16T08:00:00.000Z",
            endsAt: null,
            publishedAt: "2026-11-16T12:00:00.000Z",
        },
        NOW,
    );
    assert.equal(form.type, "IMAGE");
    assert.equal(form.imageUrl, IMAGE);
    assert.equal(form.videoUrl, "");
    assert.equal(form.startsAt, "2026-11-16T09:00");
    assert.equal(form.endsAt, "");
    // Annonce d'avant le lot 2 : type absent = Texte.
    assert.equal(announcementToForm({ title: "Ancienne" }, NOW).type, "TEXTE");
    assert.equal(announcementTypeLabel("VIDEO"), "Vidéo");
    assert.equal(announcementTypeLabel(undefined), "Texte");
});

test("contrôle du fichier image avant envoi", () => {
    assert.equal(validateImageFile({ type: "image/png", size: 1024 }), null);
    assert.equal(validateImageFile({ type: "image/webp", size: 5 * 1024 * 1024 }), null);
    assert.match(validateImageFile({ type: "image/gif", size: 10 }), /JPEG, PNG ou WebP/);
    assert.match(validateImageFile({ type: "image/svg+xml", size: 10 }), /Format non accepté/);
    assert.match(validateImageFile({ type: "image/jpeg", size: 5 * 1024 * 1024 + 1 }), /5 Mo/);
    assert.match(validateImageFile(null), /Aucun fichier/);
});

const lignes = [
    { id: 1, isActive: true, startsAt: null, endsAt: null },
    { id: 2, isActive: true, startsAt: "2026-11-13T00:00:00.000Z", endsAt: null },
    { id: 3, isActive: true, startsAt: null, endsAt: "2026-11-12T12:00:00.000Z" },
    { id: 4, isActive: false, startsAt: "2026-11-13T00:00:00.000Z", endsAt: null },
    { id: 5, isActive: true, startsAt: "2026-11-01T00:00:00.000Z", endsAt: "2026-12-01T00:00:00.000Z" },
];

test("état d'une annonce : recalculé à l'instant présent", () => {
    assert.deepEqual(
        lignes.map((l) => announcementEtat(l, NOW)),
        ["ACTIVE", "PROGRAMMEE", "EXPIREE", "DESACTIVEE", "ACTIVE"],
    );
    // L'état reçu au chargement ne fige pas le badge : la fin est passée depuis.
    const chargee = { isActive: true, etat: "ACTIVE", endsAt: "2026-11-12T11:00:00.000Z" };
    assert.equal(announcementEtat(chargee, NOW), "EXPIREE");
});

test("onglets : compteurs et filtre par état", () => {
    assert.deepEqual(countByEtat(lignes, NOW), {
        ACTIVE: 2,
        PROGRAMMEE: 1,
        EXPIREE: 1,
        DESACTIVEE: 1,
        TOUTES: 5,
    });
    assert.deepEqual(filterByEtat(lignes, "ACTIVE", NOW).map((l) => l.id), [1, 5]);
    assert.deepEqual(filterByEtat(lignes, "DESACTIVEE", NOW).map((l) => l.id), [4]);
    assert.equal(filterByEtat(lignes, "TOUTES", NOW), lignes);
    assert.deepEqual(
        ETAT_FILTERS.map((f) => f.label),
        ["Actives", "Programmées", "Expirées", "Désactivées", "Toutes"],
    );
});

test("ordre dans un onglet filtré : échange avec la voisine visible", () => {
    const toutes = [1, 2, 3, 4, 5];
    // Onglet Actives (1 et 5) : descendre 1 l'échange avec 5.
    assert.deepEqual(moveWithin(toutes, [1, 5], 1, 1), [5, 2, 3, 4, 1]);
    assert.deepEqual(moveWithin(toutes, [1, 5], 5, -1), [5, 2, 3, 4, 1]);
    assert.equal(moveWithin(toutes, [1, 5], 1, -1), null);
    assert.equal(moveWithin(toutes, [1, 5], 5, 1), null);
    assert.equal(moveWithin(toutes, [1, 5], 3, 1), null);
    // Onglet Toutes : même résultat qu'un déplacement d'un cran.
    assert.deepEqual(moveWithin(toutes, toutes, 2, -1), [2, 1, 3, 4, 5]);
});
