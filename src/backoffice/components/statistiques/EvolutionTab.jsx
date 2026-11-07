import React from "react";
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { EtatVide } from "./StatsUi";
import { dateCourte, dateFr, dateLongue, decimalFr } from "./format";

// Onglet Évolution : une courbe Membres / Invités / Total par cellule.

// Couleurs = variables du thème Tailwind ; la pastille (classe) garantit leur émission.
const SERIES = [
    { cle: "membres", libelle: "Membres", couleur: "var(--color-blue-500)", pastille: "bg-blue-500" },
    { cle: "invites", libelle: "Invités", couleur: "var(--color-amber-500)", pastille: "bg-amber-500" },
    { cle: "total", libelle: "Total", couleur: "var(--color-blue-800)", pastille: "bg-blue-800" },
];
const TOTAL = SERIES[2];
const NON_SAISI = "var(--color-red-600)";
const FOND = "var(--color-white)";
const GRILLE = "var(--color-gray-200)";
const AXE = "var(--color-gray-500)";

// Au-delà, les points normaux du Total sont masqués pour garder la courbe lisible.
const MAX_POINTS_AVEC_MARQUEURS = 31;

// Marqueur du Total : point blanc cerclé ; jour non saisi = point creux cerclé de rouge.
function marqueurTotal(avecMarqueurs) {
    function Marqueur({ cx, cy, payload, index }) {
        if (cx == null || cy == null) return <g key={index} />;
        if (payload?.saisi === false) {
            return (
                <circle key={index} cx={cx} cy={cy} r={5} fill={FOND} stroke={NON_SAISI} strokeWidth={2} />
            );
        }
        if (!avecMarqueurs) return <g key={index} />;
        return <circle key={index} cx={cx} cy={cy} r={3.5} fill={FOND} stroke={TOTAL.couleur} strokeWidth={2} />;
    }
    return Marqueur;
}

// Moyenne par réunion (jours saisis seulement), meilleur jour et invités cumulés.
function indicateurs(points) {
    const saisis = points.filter((p) => p.saisi !== false);
    let meilleur = null;
    for (const p of saisis) {
        if (!meilleur || p.total > meilleur.total) meilleur = p;
    }
    return {
        moyenne: saisis.length
            ? saisis.reduce((s, p) => s + (p.total ?? 0), 0) / saisis.length
            : null,
        meilleur,
        invites: points.reduce((s, p) => s + (p.invites ?? 0), 0),
    };
}

function InfoBulle({ active, payload }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm">
            <p className="font-medium text-gray-800 mb-1 first-letter:uppercase">
                {dateLongue(point.date)}
            </p>
            {point.saisi === false ? (
                <p className="text-red-700 font-medium">Présences non saisies</p>
            ) : (
                <ul className="space-y-0.5">
                    {SERIES.map((s) => (
                        <li key={s.cle} className="flex items-center gap-2 text-gray-700">
                            <span className={`inline-block w-3 h-0.5 rounded-full ${s.pastille}`} aria-hidden="true" />
                            <span className="flex-1">{s.libelle}</span>
                            <span className="font-semibold text-gray-900">{point[s.cle]}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Legende() {
    return (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
            {SERIES.map((s) => (
                <li key={s.cle} className="flex items-center gap-1.5">
                    <span
                        className={`inline-block w-4 rounded-full ${s === TOTAL ? "h-1" : "h-0.5"} ${s.pastille}`}
                        aria-hidden="true"
                    />
                    {s.libelle}
                </li>
            ))}
            <li className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-red-600 bg-white" aria-hidden="true" />
                Jour de réunion sans saisie
            </li>
        </ul>
    );
}

// Trois cases de même largeur et même hauteur (grille, étirement par défaut).
function Indicateurs({ points }) {
    const { moyenne, meilleur, invites } = indicateurs(points);
    const cases = [
        { libelle: "Moyenne", valeur: decimalFr(moyenne), detail: "par réunion saisie" },
        {
            libelle: "Meilleur jour",
            valeur: meilleur ? meilleur.total : "—",
            detail: meilleur ? `le ${dateCourte(meilleur.date)}` : "aucune saisie",
        },
        { libelle: "Invités", valeur: invites, detail: "sur la période" },
    ];
    return (
        <dl className="mt-3 grid grid-cols-3 gap-2">
            {cases.map((c) => (
                <div
                    key={c.libelle}
                    className="flex flex-col rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                >
                    <dt className="text-xs font-medium text-gray-500">{c.libelle}</dt>
                    <dd className="text-xl font-bold leading-tight text-blue-800">{c.valeur}</dd>
                    <dd className="text-xs text-gray-500">{c.detail}</dd>
                </div>
            ))}
        </dl>
    );
}

function CarteCellule({ cellule }) {
    const points = cellule.points ?? [];
    const nonSaisis = points.filter((p) => p.saisi === false);
    const titreId = `evolution-${cellule.id}`;
    const degradeId = `degrade-total-${cellule.id}`;

    return (
        <section className="bg-white rounded shadow p-4" aria-labelledby={titreId}>
            <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-start sm:justify-between">
                <h3 id={titreId} className="font-semibold text-gray-800">
                    {cellule.name}
                </h3>
                <Legende />
            </div>

            {points.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                    Aucun jour de réunion sur la période.
                </p>
            ) : (
                <>
                    <div
                        className="h-64 w-full"
                        role="img"
                        aria-label={`Évolution des présences de ${cellule.name} : membres, invités et total par jour`}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                                <defs>
                                    <linearGradient id={degradeId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" style={{ stopColor: TOTAL.couleur, stopOpacity: 0.16 }} />
                                        <stop offset="100%" style={{ stopColor: TOTAL.couleur, stopOpacity: 0 }} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={GRILLE} strokeDasharray="4 4" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={dateCourte}
                                    tick={{ fill: AXE, fontSize: 12 }}
                                    stroke={GRILLE}
                                    tickLine={false}
                                    minTickGap={16}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: AXE, fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<InfoBulle />} cursor={{ stroke: GRILLE }} />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    name="Total"
                                    stroke={TOTAL.couleur}
                                    strokeWidth={3}
                                    fill={`url(#${degradeId})`}
                                    dot={marqueurTotal(points.length <= MAX_POINTS_AVEC_MARQUEURS)}
                                    activeDot={{ r: 5, fill: FOND, stroke: TOTAL.couleur, strokeWidth: 2 }}
                                    isAnimationActive={false}
                                />
                                {SERIES.slice(0, 2).map((s) => (
                                    <Line
                                        key={s.cle}
                                        type="monotone"
                                        dataKey={s.cle}
                                        name={s.libelle}
                                        stroke={s.couleur}
                                        strokeWidth={1.5}
                                        dot={false}
                                        activeDot={{ r: 4, fill: s.couleur, stroke: FOND, strokeWidth: 2 }}
                                        isAnimationActive={false}
                                    />
                                ))}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    <Indicateurs points={points} />

                    {nonSaisis.length > 0 && (
                        <p className="mt-2 text-sm text-red-700">
                            {nonSaisis.length} jour(s) de réunion sans saisie :{" "}
                            {nonSaisis.map((p) => dateCourte(p.date)).join(", ")}
                        </p>
                    )}

                    <details className="mt-3 text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            Voir les données
                        </summary>
                        <div className="overflow-x-auto mt-2">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th scope="col" className="text-left p-2">Date</th>
                                        <th scope="col" className="text-right p-2">Membres</th>
                                        <th scope="col" className="text-right p-2">Invités</th>
                                        <th scope="col" className="text-right p-2">Total</th>
                                        <th scope="col" className="text-left p-2">Saisi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {points.map((p) => (
                                        <tr key={p.date} className="border-t border-gray-100">
                                            <td className="p-2 text-gray-700">{dateFr(p.date)}</td>
                                            <td className="p-2 text-right text-gray-700">{p.membres}</td>
                                            <td className="p-2 text-right text-gray-700">{p.invites}</td>
                                            <td className="p-2 text-right font-medium text-gray-800">{p.total}</td>
                                            <td className={`p-2 ${p.saisi ? "text-gray-700" : "text-red-700 font-medium"}`}>
                                                {p.saisi ? "Oui" : "Non"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </>
            )}
        </section>
    );
}

export default function EvolutionTab({ data }) {
    const cellules = data?.cellules ?? [];

    if (cellules.length === 0) {
        return (
            <EtatVide
                titre="Aucune donnée sur la période"
                message="Élargissez la période ou choisissez une autre cellule."
            />
        );
    }

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {cellules.map((c) => (
                <CarteCellule key={c.id} cellule={c} />
            ))}
        </div>
    );
}
