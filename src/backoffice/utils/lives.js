// Logique pure des directs (heure saisie, équivalent à Abidjan) : sans React.
import {
    ANNOUNCEMENT_TIME_ZONE,
    browserTimeZoneLabel,
    localInputToIso,
} from "./announcements.js";

// Jour "15 nov. 2026" et heure "19h00" d'un instant ; fuseau du navigateur
// si `timeZone` est absent.
function dayAndTime(date, timeZone) {
    const day = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone,
    }).format(date);
    const parts = new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone,
    }).formatToParts(date);
    const part = (type) => parts.find((p) => p.type === type)?.value ?? "";
    return { day, time: `${Number(part("hour"))}h${part("minute")}` };
}

const validDate = (iso) => {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
};

// Heure de l'ordinateur et équivalent à Abidjan d'un instant ; null si
// illisible. Le jour d'Abidjan n'est précisé que s'il diffère du jour local.
export function liveScheduleLabels(iso) {
    const date = validDate(iso);
    if (!date) return null;
    const local = dayAndTime(date);
    const abidjan = dayAndTime(date, ANNOUNCEMENT_TIME_ZONE);
    return {
        local: `${local.day} à ${local.time}`,
        abidjan:
            abidjan.day === local.day
                ? `${abidjan.time} à Abidjan`
                : `${abidjan.time} à Abidjan, le ${abidjan.day}`,
    };
}

// Aide sous le champ <input type="datetime-local"> d'un direct, ex.
// "Heure de votre ordinateur (Europe/Paris, UTC+1) — soit 17h00 à Abidjan".
// Le décalage affiché est celui du jour saisi (heure d'été comprise).
export function liveScheduleHint(localInput, now = new Date()) {
    const iso = localInputToIso(localInput);
    const zone = browserTimeZoneLabel(iso ? new Date(iso) : now);
    const base = `Heure de votre ordinateur (${zone})`;
    return iso ? `${base} — soit ${liveScheduleLabels(iso).abidjan}` : base;
}
