import React from "react";
import { EtatVide, FOCUS } from "./StatsUi";
import { dateFr, grouperParMois, jourDuMois, jourSemaine, moisAnnee } from "./format";

// Onglet Suivi : tableau OK / NOK / NA (cellules en lignes, jours en colonnes).

// Couleurs exactes de la maquette client (tokens suivi-* de index.css).
const STATUTS = {
    OK: {
        classe: "bg-suivi-ok text-suivi-encre",
        legende: "Présences saisies (au moins une personne)",
    },
    NOK: {
        classe: "bg-suivi-nok text-suivi-encre",
        legende: "Jour de réunion passé sans aucune présence saisie",
    },
    NA: {
        classe: "bg-suivi-na text-suivi-encre",
        legende: "Autre activité / pas de réunion",
    },
};

const taux = (t) => (t === null || t === undefined ? "—" : `${t} %`);

function infoCase(date, c) {
    const morceaux = [dateFr(date)];
    if (c?.statut) morceaux.push(c.statut);
    if (c?.presents) morceaux.push(`${c.presents} présent(s)`);
    if (c?.theme) morceaux.push(`Thème : ${c.theme}`);
    if (c?.statut === "NA") morceaux.push(c.motif ? `Motif : ${c.motif}` : "aucun motif saisi");
    if (!c?.statut) morceaux.push("pas de réunion prévue ou date future");
    return morceaux.join(" — ");
}

function LegendeSuivi() {
    return (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            {Object.entries(STATUTS).map(([statut, { classe, legende }]) => (
                <li key={statut} className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center justify-center min-w-10 px-2.5 py-0.5 rounded-full text-xs font-semibold ${classe}`}
                    >
                        {statut}
                    </span>
                    {legende}
                </li>
            ))}
            <li className="flex items-center gap-2">
                <span
                    className="inline-block min-w-10 h-5 rounded-full border border-gray-300 bg-white"
                    aria-hidden="true"
                />
                Pas de réunion prévue, ou date future
            </li>
        </ul>
    );
}

export default function SuiviTab({ data, onOuvrirNa }) {
    const dates = data?.dates ?? [];
    const lignes = data?.cellules ?? [];
    const mois = grouperParMois(dates);

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
                                rowSpan={2}
                                className="sticky left-0 z-10 bg-gray-50 text-left p-3 min-w-40 align-bottom"
                            >
                                Cellule
                            </th>
                            {mois.map((m, i) => (
                                <th
                                    key={m.cle}
                                    scope="colgroup"
                                    colSpan={m.dates.length}
                                    className={`px-2 pt-2 pb-1 text-left text-xs font-semibold text-gray-700 whitespace-nowrap ${i > 0 ? "border-l border-gray-200" : ""}`}
                                >
                                    {moisAnnee(m.dates[0])}
                                </th>
                            ))}
                            {["OK", "NOK", "NA"].map((t) => (
                                <th key={t} scope="col" rowSpan={2} className="p-2 text-center align-bottom">
                                    {t}
                                </th>
                            ))}
                            <th scope="col" rowSpan={2} className="p-2 text-center align-bottom">
                                <abbr title="Régularité" className="no-underline">Régul.</abbr>
                            </th>
                        </tr>
                        <tr>
                            {dates.map((date) => (
                                <th
                                    key={date}
                                    scope="col"
                                    aria-label={dateFr(date)}
                                    className="px-1 pb-2 text-center font-semibold text-gray-700 whitespace-nowrap"
                                >
                                    <span className="block text-[11px] font-normal text-gray-400">
                                        {jourSemaine(date)}
                                    </span>
                                    {jourDuMois(date)}
                                </th>
                            ))}
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
                                            {c?.statut === "NA" && onOuvrirNa ? (
                                                // Case NA cliquable : ouvre le détail du jour (motif, cellules).
                                                <button
                                                    type="button"
                                                    onClick={(e) =>
                                                        onOuvrirNa(
                                                            { date, celluleId: l.celluleId, nomCellule: l.nom, motif: c.motif ?? null },
                                                            e.currentTarget
                                                        )
                                                    }
                                                    aria-label={`${l.nom}, ${infoCase(date, c)}. Voir le détail du jour NA`}
                                                    aria-haspopup="dialog"
                                                    className={`inline-flex flex-col items-center justify-center w-12 min-h-10 py-1 rounded-md text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-gray-400 ${style.classe} ${FOCUS}`}
                                                >
                                                    {c.statut}
                                                    {c.presents > 0 && (
                                                        <span className="font-normal">
                                                            {c.presents}
                                                        </span>
                                                    )}
                                                </button>
                                            ) : style ? (
                                                <span
                                                    className={`inline-flex flex-col items-center justify-center w-12 min-h-10 py-1 rounded-md text-xs font-semibold ${style.classe}`}
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
                                Régularité du jour
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
                Régularité = OK / (OK + NOK). Survolez une case pour voir le nombre de
                présents et le thème du jour ; cliquez sur une case NA pour voir son
                motif, le modifier ou le supprimer.
            </p>
        </div>
    );
}
