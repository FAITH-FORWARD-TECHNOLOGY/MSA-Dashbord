// Logique pure des annonces (formulaire, dates, ordre) : sans React, testable seule.

// Fuseau métier : le même que le backend.
export const ANNOUNCEMENT_TIME_ZONE = "Africa/Douala";
// Douala est à UTC+1 toute l'année (pas d'heure d'été).
const DOUALA_OFFSET = "+01:00";

export const TITLE_MAX = 255;
export const DATE_LABEL_MAX = 80;

export const emptyAnnouncementForm = (now = new Date()) => ({
    title: "",
    description: "",
    eventDate: doualaDateInput(now),
    dateLabel: "",
    programUrl: "",
    rubriqueId: "",
    isActive: true,
});

// ISO -> "AAAA-MM-JJ" (valeur d'un <input type="date">), jour vu de Douala.
export function doualaDateInput(value) {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: ANNOUNCEMENT_TIME_ZONE,
    }).formatToParts(date);
    const part = (type) => parts.find((p) => p.type === type)?.value ?? "";
    return `${part("year")}-${part("month")}-${part("day")}`;
}

// "AAAA-MM-JJ" -> ISO à midi, heure de Douala : aucun fuseau ne change le jour.
export function doualaNoonIso(dateInput) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput ?? "")) return null;
    const date = new Date(`${dateInput}T12:00:00${DOUALA_OFFSET}`);
    if (Number.isNaN(date.getTime())) return null;
    // Refuse les dates corrigées en silence (ex. 31 février).
    return doualaDateInput(date) === dateInput ? date.toISOString() : null;
}

// Date lisible dans le tableau, ex. "16 nov. 2026".
export function formatAnnouncementDate(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: ANNOUNCEMENT_TIME_ZONE,
    }).format(date);
}

export function isHttpUrl(value) {
    if (typeof value !== "string" || /\s/.test(value.trim())) return false;
    try {
        const url = new URL(value.trim());
        return (
            (url.protocol === "http:" || url.protocol === "https:") &&
            url.hostname.includes(".")
        );
    } catch {
        return false;
    }
}

// Annonce reçue de l'API -> valeurs du formulaire (tous les champs).
export function announcementToForm(row, now = new Date()) {
    if (!row) return emptyAnnouncementForm(now);
    return {
        title: row.title ?? "",
        description: row.description ?? "",
        eventDate: doualaDateInput(row.publishedAt) || doualaDateInput(now),
        dateLabel: row.dateLabel ?? "",
        programUrl: row.programUrl ?? "",
        rubriqueId: row.rubriqueId == null ? "" : String(row.rubriqueId),
        isActive: row.isActive ?? true,
    };
}

// Erreurs par champ ; objet vide = formulaire valide.
export function validateAnnouncementForm(values) {
    const errors = {};
    const title = values.title.trim();
    if (!title) errors.title = "Le titre est obligatoire.";
    else if (title.length > TITLE_MAX)
        errors.title = `Le titre dépasse ${TITLE_MAX} caractères.`;
    if (!doualaNoonIso(values.eventDate))
        errors.eventDate = "Indiquez la date de l’évènement.";
    if (values.dateLabel.trim().length > DATE_LABEL_MAX)
        errors.dateLabel = `Le libellé dépasse ${DATE_LABEL_MAX} caractères.`;
    const url = values.programUrl.trim();
    if (url && !isHttpUrl(url))
        errors.programUrl =
            "Lien invalide : il doit commencer par http:// ou https://.";
    return errors;
}

// Corps envoyé à l'API ; null efface un champ facultatif à l'édition.
// sortOrder n'est pas envoyé : l'ordre se règle avec les flèches du tableau.
export function buildAnnouncementPayload(values) {
    return {
        title: values.title.trim(),
        description: values.description.trim(),
        publishedAt: doualaNoonIso(values.eventDate),
        dateLabel: values.dateLabel.trim() || null,
        programUrl: values.programUrl.trim() || null,
        rubriqueId: values.rubriqueId ? Number(values.rubriqueId) : null,
        isActive: Boolean(values.isActive),
    };
}

// Déplace `id` d'un cran (-1 = monter, +1 = descendre) ; null si impossible.
export function moveId(ids, id, delta) {
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return null;
    const next = [...ids];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
}
