import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { FOCUS } from "../statistiques/StatsUi";
import {
    clesDepliables,
    libelleMembres,
    libellePart,
    lignesRepartition,
    ouvertureInitiale,
    partDe,
} from "../../utils/repartition";

// Tableau dépliable Pays → Commune → Quartier, trié par nombre de membres.

const RETRAIT = ["pl-3", "pl-9", "pl-16"];
const BOUTON_TEXTE = `text-sm font-medium text-blue-700 hover:underline rounded ${FOCUS}`;

function Libelle({ ligne, onBasculer, onVoirMembres }) {
    if (ligne.depliable) {
        const Icone = ligne.ouvert ? ChevronDown : ChevronRight;
        return (
            <button
                type="button"
                onClick={() => onBasculer(ligne.cle)}
                aria-expanded={ligne.ouvert}
                className={`inline-flex min-h-9 items-center gap-2 rounded text-left ${ligne.niveau === 0 ? "font-semibold text-gray-900" : "font-medium text-gray-800"} hover:text-blue-700 ${FOCUS}`}
            >
                <Icone className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
                {ligne.libelle}
            </button>
        );
    }
    if (ligne.cible && onVoirMembres) {
        return (
            <button
                type="button"
                onClick={(e) => onVoirMembres(ligne.cible, e.currentTarget)}
                aria-label={`Voir les membres : ${ligne.cible.titre}`}
                className={`inline-flex min-h-9 items-center gap-2 text-left ${BOUTON_TEXTE} ${ligne.nonRenseigne || ligne.type === "aucun-lieu" ? "italic" : ""}`}
            >
                <Users className="size-4 shrink-0" aria-hidden="true" />
                {ligne.libelle}
            </button>
        );
    }
    return <span className="inline-flex min-h-9 items-center text-gray-800">{ligne.libelle}</span>;
}

export default function RepartitionTable({ pays, total, onVoirMembres, legende }) {
    const [ouverts, setOuverts] = useState(() => ouvertureInitiale(pays));
    // Nouvel arbre (filtre, rechargement) : pays rouverts, communes repliées.
    useEffect(() => setOuverts(ouvertureInitiale(pays)), [pays]);

    const lignes = useMemo(() => lignesRepartition(pays, ouverts), [pays, ouverts]);
    const toutes = useMemo(() => clesDepliables(pays), [pays]);
    const toutOuvert = toutes.length > 0 && toutes.every((c) => ouverts.has(c));

    const basculer = (cle) =>
        setOuverts((actuel) => {
            const suite = new Set(actuel);
            if (suite.has(cle)) suite.delete(cle);
            else suite.add(cle);
            return suite;
        });

    return (
        <div>
            <div className="flex justify-end px-3 pb-2">
                <button
                    type="button"
                    onClick={() => setOuverts(toutOuvert ? new Set() : new Set(toutes))}
                    className={BOUTON_TEXTE}
                >
                    {toutOuvert ? "Tout replier" : "Tout déplier"}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <caption className="sr-only">{legende}</caption>
                    <thead>
                        <tr className="border-y border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <th scope="col" className="px-3 py-2">Pays, commune, quartier</th>
                            <th scope="col" className="px-3 py-2 text-right">Membres</th>
                            <th scope="col" className="hidden px-3 py-2 sm:table-cell sm:w-56">Part</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {lignes.map((ligne) => (
                            <tr key={ligne.cle} className={ligne.niveau === 0 ? "bg-white" : "bg-white hover:bg-gray-50"}>
                                <th scope="row" className={`${RETRAIT[ligne.niveau]} py-1 pr-3 text-left font-normal`}>
                                    <span className="inline-flex flex-wrap items-center gap-2">
                                        <Libelle ligne={ligne} onBasculer={basculer} onVoirMembres={onVoirMembres} />
                                        {ligne.enAttente && (
                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                                En attente
                                            </span>
                                        )}
                                    </span>
                                </th>
                                <td
                                    className={`px-3 py-1 text-right tabular-nums ${ligne.niveau === 0 ? "font-semibold text-gray-900" : "text-gray-800"}`}
                                    aria-label={libelleMembres(ligne.membres)}
                                >
                                    {ligne.membres}
                                </td>
                                <td className="hidden px-3 py-1 sm:table-cell">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                                            <div
                                                className={`h-full rounded-full ${ligne.niveau === 0 ? "bg-blue-600" : "bg-blue-400"}`}
                                                style={{ width: `${partDe(ligne.membres, total)}%` }}
                                            />
                                        </div>
                                        <span className="w-14 text-right text-xs tabular-nums text-gray-500">
                                            {libellePart(ligne.membres, total)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
