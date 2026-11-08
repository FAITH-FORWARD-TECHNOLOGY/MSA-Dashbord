// Utilitaires de dates et de noms de fichiers du module Statistiques.

const JOUR_MS = 86_400_000;
export const MAX_JOURS = 366;

const pad = (n) => String(n).padStart(2, "0");

// Date locale -> AAAA-MM-JJ.
export const versYmd = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Période par défaut : du 1er du mois courant à aujourd'hui.
export function periodeParDefaut() {
    const now = new Date();
    return {
        du: versYmd(new Date(now.getFullYear(), now.getMonth(), 1)),
        au: versYmd(now),
    };
}

// Les dates de l'API sont des jours calendaires UTC : on les lit en UTC.
const lireYmd = (ymd) => new Date(`${ymd}T00:00:00Z`);

// "2026-10-08" -> "08/10"
export const dateCourte = (ymd) => {
    const [, m, j] = ymd.split("-");
    return `${j}/${m}`;
};

// "2026-10-08" -> "08/10/2026"
export const dateFr = (ymd) => {
    const [a, m, j] = ymd.split("-");
    return `${j}/${m}/${a}`;
};

const fmtJourSemaine = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    timeZone: "UTC",
});
const fmtLong = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
});

// "2026-10-08" -> "jeu."
export const jourSemaine = (ymd) => fmtJourSemaine.format(lireYmd(ymd));

// "2026-10-08" -> "jeudi 8 octobre 2026"
export const dateLongue = (ymd) => fmtLong.format(lireYmd(ymd));

// Message d'erreur de période, ou "" si elle est valide (mêmes règles que l'API).
export function erreurPeriode(du, au) {
    if (!du || !au) return "Renseignez les deux dates de la période.";
    if (du > au) return "La date de début doit précéder la date de fin.";
    const jours = (lireYmd(au) - lireYmd(du)) / JOUR_MS + 1;
    if (jours > MAX_JOURS) return `La période est limitée à ${MAX_JOURS} jours.`;
    return "";
}

// "Cellule Saint-Éloi" -> "cellule-saint-eloi"
const slug = (s) =>
    s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

// statistiques_suivi_2026-10-01_au_2026-10-31[_cellule-test].xlsx
export function nomFichierExport(volet, { du, au }, nomCellule, format) {
    const cellule = nomCellule ? `_${slug(nomCellule)}` : "";
    return `statistiques_${volet}_${du}_au_${au}${cellule}.${format}`;
}

const fmtMois = new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
});

// "2026-10-08" -> "oct. 2026"
export const moisAnnee = (ymd) => fmtMois.format(lireYmd(ymd));

// "2026-10-08" -> "8"
export const jourDuMois = (ymd) => String(Number(ymd.split("-")[2]));

// Dates triées -> [{ cle: "2026-10", dates: [...] }] par mois consécutif.
export function grouperParMois(dates) {
    const groupes = [];
    for (const date of dates) {
        const cle = date.slice(0, 7);
        const dernier = groupes[groupes.length - 1];
        if (dernier?.cle === cle) dernier.dates.push(date);
        else groupes.push({ cle, dates: [date] });
    }
    return groupes;
}

// (2, "cellule") -> "2 cellules" ; (1, "jour de réunion", "jours de réunion") -> "1 jour de réunion"
export const pluriel = (n, singulier, forme = `${singulier}s`) =>
    `${n} ${n > 1 ? forme : singulier}`;

const fmtDecimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

// 4.25 -> "4,3" ; null -> "—"
export const decimalFr = (x) => (x === null || x === undefined ? "—" : fmtDecimal.format(x));
