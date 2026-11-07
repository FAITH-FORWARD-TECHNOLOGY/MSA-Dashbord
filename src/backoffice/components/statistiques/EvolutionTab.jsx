import React from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { EtatVide } from "./StatsUi";
import { dateCourte, dateFr, dateLongue } from "./format";

// Onglet Évolution : une courbe Membres / Invités / Total par cellule.

// Couleurs = variables du thème Tailwind ; la pastille (classe) garantit leur émission.
const SERIES = [
    { cle: "membres", libelle: "Membres", couleur: "var(--color-blue-600)", pastille: "bg-blue-600" },
    { cle: "invites", libelle: "Invités", couleur: "var(--color-amber-600)", pastille: "bg-amber-600" },
    { cle: "total", libelle: "Total", couleur: "var(--color-gray-800)", pastille: "bg-gray-800" },
];
const NON_SAISI = "var(--color-red-600)";
const FOND = "var(--color-white)";
const GRILLE = "var(--color-gray-200)";
const AXE = "var(--color-gray-500)";

// Au-delà, les points normaux sont masqués pour garder la courbe lisible.
const MAX_POINTS_AVEC_MARQUEURS = 31;

// Marqueur du Total : cercle creux rouge pour un jour de réunion non saisi.
function marqueurTotal(avecMarqueurs) {
    function Marqueur({ cx, cy, payload, index }) {
        if (cx == null || cy == null) return <g key={index} />;
        if (payload?.saisi === false) {
            return (
                <circle key={index} cx={cx} cy={cy} r={5} fill={FOND} stroke={NON_SAISI} strokeWidth={2} />
            );
        }
        if (!avecMarqueurs) return <g key={index} />;
        return <circle key={index} cx={cx} cy={cy} r={4} fill={SERIES[2].couleur} stroke={FOND} strokeWidth={2} />;
    }
    return Marqueur;
}

function InfoBulle({ active, payload }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
        <div className="bg-white border border-gray-200 rounded shadow-lg p-3 text-sm">
            <p className="font-medium text-gray-800 mb-1 first-letter:uppercase">
                {dateLongue(point.date)}
            </p>
            {point.saisi === false ? (
                <p className="text-red-700 font-medium">Présences non saisies</p>
            ) : (
                <ul className="space-y-0.5">
                    {SERIES.map((s) => (
                        <li key={s.cle} className="flex items-center gap-2 text-gray-700">
                            <span className={`inline-block w-3 h-0.5 ${s.pastille}`} aria-hidden="true" />
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
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            {SERIES.map((s) => (
                <li key={s.cle} className="flex items-center gap-1.5">
                    <span className={`inline-block w-4 h-0.5 ${s.pastille}`} aria-hidden="true" />
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

function CarteCellule({ cellule }) {
    const points = cellule.points ?? [];
    const nonSaisis = points.filter((p) => p.saisi === false);
    const titreId = `evolution-${cellule.id}`;

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
                            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                                <CartesianGrid stroke={GRILLE} vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={dateCourte}
                                    tick={{ fill: AXE, fontSize: 12 }}
                                    stroke={GRILLE}
                                    minTickGap={16}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: AXE, fontSize: 12 }}
                                    stroke={GRILLE}
                                />
                                <Tooltip content={<InfoBulle />} cursor={{ stroke: GRILLE }} />
                                {SERIES.slice(0, 2).map((s) => (
                                    <Line
                                        key={s.cle}
                                        type="monotone"
                                        dataKey={s.cle}
                                        name={s.libelle}
                                        stroke={s.couleur}
                                        strokeWidth={2}
                                        dot={points.length <= MAX_POINTS_AVEC_MARQUEURS ? { r: 4, fill: s.couleur, stroke: FOND, strokeWidth: 2 } : false}
                                        activeDot={{ r: 5 }}
                                        isAnimationActive={false}
                                    />
                                ))}
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    name="Total"
                                    stroke={SERIES[2].couleur}
                                    strokeWidth={2}
                                    dot={marqueurTotal(points.length <= MAX_POINTS_AVEC_MARQUEURS)}
                                    activeDot={{ r: 5 }}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

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
