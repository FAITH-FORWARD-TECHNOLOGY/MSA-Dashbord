// Logique pure des annonces (formulaire, dates, ordre) : sans React, testable seule.

// Fuseau métier : le même que le backend.
export const ANNOUNCEMENT_TIME_ZONE = "Africa/Abidjan";
// Abidjan est à UTC+0 toute l'année (pas d'heure d'été).
const ABIDJAN_OFFSET = "+00:00";

export const TITLE_MAX = 255;
export const DATE_LABEL_MAX = 80;

// Types d'annonce (mêmes valeurs que le backend).
export const ANNOUNCEMENT_TYPES = [
    { value: "TEXTE", label: "Texte" },
    { value: "IMAGE", label: "Image" },
    { value: "VIDEO", label: "Vidéo" },
];
const TYPE_VALUES = ANNOUNCEMENT_TYPES.map((t) => t.value);
export const announcementTypeLabel = (type) =>
    ANNOUNCEMENT_TYPES.find((t) => t.value === type)?.label ?? "Texte";

// Image d'annonce : mêmes limites que le backend.
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Onglets du tableau, dans l'ordre d'affichage.
export const ETAT_FILTERS = [
    { key: "ACTIVE", label: "Actives", empty: "Aucune annonce active." },
    { key: "PROGRAMMEE", label: "Programmées", empty: "Aucune annonce programmée." },
    { key: "EXPIREE", label: "Expirées", empty: "Aucune annonce expirée." },
    { key: "DESACTIVEE", label: "Désactivées", empty: "Aucune annonce désactivée." },
    { key: "TOUTES", label: "Toutes", empty: "Aucune annonce." },
];
export const ETAT_LABELS = {
    ACTIVE: "Active",
    PROGRAMMEE: "Programmée",
    EXPIREE: "Expirée",
    DESACTIVEE: "Désactivée",
};

export const emptyAnnouncementForm = (now = new Date()) => ({
    title: "",
    description: "",
    eventDate: abidjanDateInput(now),
    dateLabel: "",
    programUrl: "",
    rubriqueId: "",
    isActive: true,
    type: "TEXTE",
    imageUrl: "",
    videoUrl: "",
    startsAt: "",
    endsAt: "",
});

// ISO (UTC) -> "AAAA-MM-JJTHH:mm" d'un <input type="datetime-local">,
// dans le fuseau du navigateur de l'admin.
export function isoToLocalInput(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
}

// Saisie locale -> instant ISO en UTC ; null si vide ou invalide.
export function localInputToIso(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(
        value ?? "",
    );
    if (!m) return null;
    const [year, month, day, hour, minute] = m.slice(1).map(Number);
    const d = new Date(year, month - 1, day, hour, minute);
    // Refuse les dates corrigées en silence (ex. 31 février).
    if (
        Number.isNaN(d.getTime()) ||
        d.getFullYear() !== year ||
        d.getMonth() !== month - 1 ||
        d.getDate() !== day
    )
        return null;
    return d.toISOString();
}

// Fuseau du navigateur, à afficher près des champs de date, ex.
// "Europe/Paris, UTC+1".
export function browserTimeZoneLabel(now = new Date()) {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const minutes = -now.getTimezoneOffset();
    const sign = minutes < 0 ? "-" : "+";
    const abs = Math.abs(minutes);
    const rest = abs % 60 ? `:${String(abs % 60).padStart(2, "0")}` : "";
    const offset = `UTC${sign}${Math.floor(abs / 60)}${rest}`;
    return zone ? `${zone}, ${offset}` : offset;
}

// Début ou fin de diffusion dans le tableau, heure du navigateur.
export function formatWindowDate(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

// Identifiant d'un lien YouTube (même règle que le backend), sinon null.
export function youtubeVideoId(input) {
    const raw = (input ?? "").trim();
    const idRe = /^[A-Za-z0-9_-]{11}$/;
    if (!raw) return null;
    if (idRe.test(raw)) return raw;
    let url;
    try {
        url = new URL(raw);
    } catch {
        return null;
    }
    const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
    if (!["youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host))
        return null;
    const seg = url.pathname.split("/").filter(Boolean);
    if (host === "youtu.be") return seg[0] && idRe.test(seg[0]) ? seg[0] : null;
    const v = url.searchParams.get("v");
    if (v && idRe.test(v)) return v;
    return seg.length >= 2 &&
        ["live", "embed", "shorts", "v"].includes(seg[0]) &&
        idRe.test(seg[1])
        ? seg[1]
        : null;
}

// Contrôle avant envoi ; le backend revérifie la signature du fichier.
export function validateImageFile(file) {
    if (!file) return "Aucun fichier choisi.";
    if (!IMAGE_MIME_TYPES.includes(file.type))
        return "Format non accepté : choisissez une image JPEG, PNG ou WebP.";
    if (file.size > IMAGE_MAX_BYTES) return "Image trop lourde : 5 Mo maximum.";
    return null;
}

// État d'une annonce, recalculé à l'instant `now` (mêmes règles que le
// serveur) : le badge reste juste même si la page est ouverte depuis longtemps.
export function announcementEtat(row, now = new Date()) {
    if (!row?.isActive) return "DESACTIVEE";
    const time = (iso) => (iso ? new Date(iso).getTime() : NaN);
    if (time(row.endsAt) <= now.getTime()) return "EXPIREE";
    if (time(row.startsAt) > now.getTime()) return "PROGRAMMEE";
    return "ACTIVE";
}

// Compteurs des onglets : { ACTIVE, PROGRAMMEE, EXPIREE, DESACTIVEE, TOUTES }.
export function countByEtat(rows, now = new Date()) {
    const counts = { ACTIVE: 0, PROGRAMMEE: 0, EXPIREE: 0, DESACTIVEE: 0, TOUTES: 0 };
    for (const row of rows) {
        counts[announcementEtat(row, now)] += 1;
        counts.TOUTES += 1;
    }
    return counts;
}

export function filterByEtat(rows, key, now = new Date()) {
    if (key === "TOUTES") return rows;
    return rows.filter((row) => announcementEtat(row, now) === key);
}

// ISO -> "AAAA-MM-JJ" (valeur d'un <input type="date">), jour vu d'Abidjan.
export function abidjanDateInput(value) {
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

// "AAAA-MM-JJ" -> ISO à midi, heure d'Abidjan : aucun fuseau ne change le jour.
export function abidjanNoonIso(dateInput) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput ?? "")) return null;
    const date = new Date(`${dateInput}T12:00:00${ABIDJAN_OFFSET}`);
    if (Number.isNaN(date.getTime())) return null;
    // Refuse les dates corrigées en silence (ex. 31 février).
    return abidjanDateInput(date) === dateInput ? date.toISOString() : null;
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

// Nombre de j'aime affichable : entier positif, sinon 0.
export function likesCount(value) {
    return Number.isInteger(value) && value > 0 ? value : 0;
}

// Libellé lu par les lecteurs d'écran, ex. "3 j'aime".
export function likesLabel(value) {
    const count = likesCount(value);
    return count === 0 ? "Aucun j’aime" : `${count} j’aime`;
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
        eventDate: abidjanDateInput(row.publishedAt) || abidjanDateInput(now),
        dateLabel: row.dateLabel ?? "",
        programUrl: row.programUrl ?? "",
        rubriqueId: row.rubriqueId == null ? "" : String(row.rubriqueId),
        isActive: row.isActive ?? true,
        type: TYPE_VALUES.includes(row.type) ? row.type : "TEXTE",
        imageUrl: row.imageUrl ?? "",
        videoUrl: row.videoUrl ?? "",
        startsAt: isoToLocalInput(row.startsAt),
        endsAt: isoToLocalInput(row.endsAt),
    };
}

// Erreurs par champ ; objet vide = formulaire valide.
export function validateAnnouncementForm(values) {
    const errors = {};
    const title = values.title.trim();
    if (!title) errors.title = "Le titre est obligatoire.";
    else if (title.length > TITLE_MAX)
        errors.title = `Le titre dépasse ${TITLE_MAX} caractères.`;
    // Même ordre que l'écran : le focus va au premier champ en erreur.
    if (values.type === "IMAGE" && !values.imageUrl)
        errors.imageUrl = "Ajoutez une image pour une annonce de type Image.";
    if (values.type === "VIDEO" && !youtubeVideoId(values.videoUrl))
        errors.videoUrl = values.videoUrl?.trim()
            ? "Lien YouTube invalide (ex. https://youtu.be/…)."
            : "Indiquez le lien YouTube de la vidéo.";
    if (!abidjanNoonIso(values.eventDate))
        errors.eventDate = "Indiquez la date de l’évènement.";
    if (values.dateLabel.trim().length > DATE_LABEL_MAX)
        errors.dateLabel = `Le libellé dépasse ${DATE_LABEL_MAX} caractères.`;
    const url = values.programUrl.trim();
    if (url && !isHttpUrl(url))
        errors.programUrl =
            "Lien invalide : il doit commencer par http:// ou https://.";
    const startsAt = localInputToIso(values.startsAt);
    const endsAt = localInputToIso(values.endsAt);
    if (values.startsAt && !startsAt) errors.startsAt = "Date de début invalide.";
    if (values.endsAt && !endsAt) errors.endsAt = "Date de fin invalide.";
    else if (startsAt && endsAt && endsAt <= startsAt)
        errors.endsAt = "La date de fin doit être après la date de début.";
    return errors;
}

// Corps envoyé à l'API ; null efface un champ facultatif à l'édition.
// sortOrder n'est pas envoyé : l'ordre se règle avec les flèches du tableau.
// Image et vidéo ne partent que pour leur type ; dates en ISO (UTC).
export function buildAnnouncementPayload(values) {
    const type = TYPE_VALUES.includes(values.type) ? values.type : "TEXTE";
    return {
        title: values.title.trim(),
        description: values.description.trim(),
        publishedAt: abidjanNoonIso(values.eventDate),
        dateLabel: values.dateLabel.trim() || null,
        programUrl: values.programUrl.trim() || null,
        rubriqueId: values.rubriqueId ? Number(values.rubriqueId) : null,
        isActive: Boolean(values.isActive),
        type,
        imageUrl: type === "IMAGE" ? values.imageUrl || null : null,
        videoUrl: type === "VIDEO" ? (values.videoUrl ?? "").trim() || null : null,
        startsAt: localInputToIso(values.startsAt),
        endsAt: localInputToIso(values.endsAt),
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

// Déplace `id` parmi les lignes visibles (onglet filtré) : il échange sa place
// avec sa voisine visible dans l'ordre complet ; null si impossible.
export function moveWithin(allIds, visibleIds, id, delta) {
    const at = visibleIds.indexOf(id);
    const neighbour = visibleIds[at + delta];
    if (at < 0 || neighbour === undefined) return null;
    const from = allIds.indexOf(id);
    const to = allIds.indexOf(neighbour);
    if (from < 0 || to < 0) return null;
    const next = [...allIds];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
}
