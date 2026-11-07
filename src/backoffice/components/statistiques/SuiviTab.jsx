import React from "react";
import { EtatVide } from "./StatsUi";
import { dateCourte, dateFr, jourSemaine } from "./format";

// Onglet Suivi : tableau OK / NOK / NA (cellules en lignes, jours en colonnes).

const STATUTS = {
    OK: {
        classe: "bg-green-100 text-green-800",
        legende: "Présences saisies (au moins une personne)",
    },
    NOK: {
        classe: "bg-red-100 text-red-700",
        legende: "Jour de réunion passé sans aucune présence saisie",
    },
    NA: {
        classe: "bg-gray-100 text-gray-600",
        legende: "Jour neutre (pas de réunion ce jour-là)",
    },
};

const taux = (t) => (t === null || t === undefined ? "—" : `${t} %`);

function infoCase(date, c) {
    const morceaux = [dateFr(date)];
    if (c?.statut) morceaux.push(c.statut);
    if (c?.presents) morceaux.push(`${c.presents} présent(s)`);
    if (c?.theme) morceaux.push(`Thème : ${c.theme}`);
    if (!c?.statut) morceaux.push("pas de réunion prévue ou date future");
    return morceaux.join(" — ");
}

function LegendeSuivi() {
    return (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            {Object.entries(STATUTS).map(([statut, { classe, legende }]) => (
                <li key={statut} className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center justify-center w-10 py-0.5 rounded text-xs font-semibold ${classe}`}
                    >
                        {statut}
                    </span>
                    {legende}
                </li>
            ))}
            <li className="flex items-center gap-2">
                <span className="inline-block w-10 h-5 rounded border border-gray-200 bg-white" />
                Pas de réunion prévue, ou date future
            </li>
        </ul>
    );
}

export default function SuiviTab({ data }) {
    const dates = data?.dates ?? [];
    const lignes = data?.cellules ?? [];

    if (lignes.length === 0 || dates.length === 0) {
        return (
            <EtatVide
                titre="Aucun jour de réunion sur la période"
                message="Élargissez la période ou choisissez une autre cellule."
            />
        );
    }

    return (
        <div className="space-y-4">
            <LegendeSuivi />
            <div className="overflow-x-auto bg-white rounded shadow">
                <table className="min-w-full text-sm border-collapse">
                    <caption className="sr-only">
                        Suivi des présences du {dateFr(data.du)} au{" "}
                        {dateFr(data.au)}
                    </caption>
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th
                                scope="col"
                                className="sticky left-0 z-10 bg-gray-50 text-left p-3 min-w-40"
                            >
                                Cellule
                            </th>
                            {dates.map((date) => (
                                <th
                                    key={date}
                                    scope="col"
                                    className="p-2 text-center font-medium whitespace-nowrap"
                                >
                                    <span className="block text-xs text-gray-400">
                                        {jourSemaine(date)}
                                    </span>
                                    {dateCourte(date)}
                                </th>
                            ))}
                            <th scope="col" className="p-2 text-center">OK</th>
                            <th scope="col" className="p-2 text-center">NOK</th>
                            <th scope="col" className="p-2 text-center">NA</th>
                            <th scope="col" className="p-2 text-center">Taux</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lignes.map((l) => (
                            <tr key={l.celluleId} className="border-t border-gray-100">
                                <th
                                    scope="row"
                                    className="sticky left-0 z-10 bg-white text-left p-3 font-medium text-gray-800"
                                >
                                    {l.nom}
                                </th>
                                {dates.map((date) => {
                                    const c = l.cases?.[date];
                                    const style = STATUTS[c?.statut];
                                    return (
                                        <td
                                            key={date}
                                            className="p-1 text-center"
                                            title={infoCase(date, c)}
                                        >
                                            {style ? (
                                                <span
                                                    className={`inline-flex flex-col items-center justify-center w-12 py-1 rounded text-xs font-semibold ${style.classe}`}
                                                >
                                                    {c.statut}
                                                    {c.statut === "OK" && (
                                                        <span className="font-normal">
                                                            {c.presents}
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="sr-only">
                                                    Pas de réunion
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="p-2 text-center text-gray-700">{l.ok}</td>
                                <td className="p-2 text-center text-gray-700">{l.nok}</td>
                                <td className="p-2 text-center text-gray-700">{l.na}</td>
                                <td className="p-2 text-center font-semibold text-gray-800 whitespace-nowrap">
                                    {taux(l.taux)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200 text-gray-700">
                        <tr>
                            <th
                                scope="row"
                                className="sticky left-0 z-10 bg-gray-50 text-left p-3 font-semibold"
                            >
                                Taux de saisie
                            </th>
                            {dates.map((date) => (
                                <td
                                    key={date}
                                    className="p-2 text-center text-xs whitespace-nowrap"
                                >
                                    {taux(data.tauxParDate?.[date])}
                                </td>
                            ))}
                            <td colSpan={3} />
                            <td className="p-2 text-center font-semibold whitespace-nowrap">
                                {taux(data.tauxGlobal)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <p className="text-xs text-gray-500">
                Taux = OK / (OK + NOK). Survolez une case pour voir le nombre de
                présents et le thème du jour.
            </p>
        </div>
    );
}
