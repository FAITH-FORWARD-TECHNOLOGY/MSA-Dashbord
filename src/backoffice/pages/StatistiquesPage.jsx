import React, { useRef, useState } from "react";
import {
    telechargerExport,
    useStatistiquesCellules,
    useStatistiquesVolet,
} from "../hooks/useStatistiques";
import {
    BarreExport,
    EtatErreur,
    EtatVide,
    FOCUS,
    Squelette,
} from "../components/statistiques/StatsUi";
import SuiviTab from "../components/statistiques/SuiviTab";
import EvolutionTab from "../components/statistiques/EvolutionTab";
import PresentsTab from "../components/statistiques/PresentsTab";
import {
    erreurPeriode,
    nomFichierExport,
    periodeParDefaut,
} from "../components/statistiques/format";

// Page « Statistiques » : suivi, évolution et liste des présents par cellule.

const ONGLETS = [
    { id: "suivi", libelle: "Suivi", chemin: "/presences/suivi", formats: ["xlsx", "pdf"], Vue: SuiviTab },
    { id: "evolution", libelle: "Évolution", chemin: "/presences/evolution", formats: ["xlsx"], Vue: EvolutionTab },
    { id: "presents", libelle: "Présents", chemin: "/presences/presents", formats: ["xlsx"], Vue: PresentsTab },
];

const CHAMP =
    "block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const StatistiquesPage = () => {
    const cellulesApi = useStatistiquesCellules();
    const [periode, setPeriode] = useState(periodeParDefaut);
    const [celluleId, setCelluleId] = useState("");
    const [ongletId, setOngletId] = useState("suivi");
    const refsOnglets = useRef([]);

    const filtres = { du: periode.du, au: periode.au, celluleId };
    const erreurFiltre = erreurPeriode(periode.du, periode.au);
    const pret =
        !cellulesApi.loading &&
        !cellulesApi.error &&
        cellulesApi.cellules.length > 0 &&
        !erreurFiltre;

    // Un hook par volet ; seul l'onglet affiché interroge l'API.
    const volets = {
        suivi: useStatistiquesVolet(ONGLETS[0].chemin, filtres, pret && ongletId === "suivi"),
        evolution: useStatistiquesVolet(ONGLETS[1].chemin, filtres, pret && ongletId === "evolution"),
        presents: useStatistiquesVolet(ONGLETS[2].chemin, filtres, pret && ongletId === "presents"),
    };
    const onglet = ONGLETS.find((o) => o.id === ongletId);
    const volet = volets[ongletId];

    const nomCellule =
        cellulesApi.cellules.find((c) => String(c.id) === celluleId)?.name ?? "";

    const exporter = (format) =>
        telechargerExport(
            onglet.chemin,
            filtres,
            format,
            nomFichierExport(onglet.id, periode, nomCellule, format)
        );

    // Flèches, Début et Fin déplacent le focus entre onglets (motif ARIA tabs).
    const surToucheOnglet = (e, index) => {
        let cible = null;
        if (e.key === "ArrowRight") cible = (index + 1) % ONGLETS.length;
        else if (e.key === "ArrowLeft") cible = (index - 1 + ONGLETS.length) % ONGLETS.length;
        else if (e.key === "Home") cible = 0;
        else if (e.key === "End") cible = ONGLETS.length - 1;
        if (cible === null) return;
        e.preventDefault();
        setOngletId(ONGLETS[cible].id);
        refsOnglets.current[cible]?.focus();
    };

    const enTete = (
        <>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Statistiques</h2>
            <p className="text-sm text-gray-500 mb-6">
                Présences des cellules sur une période : suivi de la saisie,
                évolution des effectifs et liste des présents.
            </p>
        </>
    );

    if (cellulesApi.loading) {
        return (
            <div className="p-4">
                {enTete}
                <Squelette lignes={5} />
            </div>
        );
    }

    if (cellulesApi.error) {
        return (
            <div className="p-4">
                {enTete}
                <EtatErreur message={cellulesApi.error} onReessayer={cellulesApi.recharger} />
            </div>
        );
    }

    if (cellulesApi.cellules.length === 0) {
        return (
            <div className="p-4">
                {enTete}
                <EtatVide
                    titre="Aucune cellule accessible"
                    message="Votre compte n'a accès aux statistiques d'aucune cellule."
                />
            </div>
        );
    }

    const Vue = onglet.Vue;

    return (
        <div className="p-4">
            {enTete}

            {/* Filtres communs aux trois onglets */}
            <div className="bg-white rounded shadow p-4 mb-4 grid gap-4 sm:grid-cols-3">
                <div>
                    <label htmlFor="stats-du" className="block text-sm font-medium text-gray-700 mb-1">
                        Du
                    </label>
                    <input
                        id="stats-du"
                        type="date"
                        value={periode.du}
                        max={periode.au || undefined}
                        onChange={(e) => setPeriode((p) => ({ ...p, du: e.target.value }))}
                        className={CHAMP}
                    />
                </div>
                <div>
                    <label htmlFor="stats-au" className="block text-sm font-medium text-gray-700 mb-1">
                        Au
                    </label>
                    <input
                        id="stats-au"
                        type="date"
                        value={periode.au}
                        min={periode.du || undefined}
                        onChange={(e) => setPeriode((p) => ({ ...p, au: e.target.value }))}
                        className={CHAMP}
                    />
                </div>
                <div>
                    <label htmlFor="stats-cellule" className="block text-sm font-medium text-gray-700 mb-1">
                        Cellule
                    </label>
                    <select
                        id="stats-cellule"
                        value={celluleId}
                        onChange={(e) => setCelluleId(e.target.value)}
                        className={CHAMP}
                    >
                        <option value="">Toutes</option>
                        {cellulesApi.cellules.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                {erreurFiltre && (
                    <p className="sm:col-span-3 text-sm text-red-600" role="alert">
                        {erreurFiltre}
                    </p>
                )}
            </div>

            {/* Onglets + exports */}
            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
                <div role="tablist" aria-label="Volets des statistiques" className="flex flex-wrap gap-2">
                    {ONGLETS.map((o, i) => {
                        const actif = o.id === ongletId;
                        return (
                            <button
                                key={o.id}
                                ref={(el) => {
                                    refsOnglets.current[i] = el;
                                }}
                                id={`onglet-${o.id}`}
                                type="button"
                                role="tab"
                                aria-selected={actif}
                                aria-controls={`panneau-${o.id}`}
                                tabIndex={actif ? 0 : -1}
                                onClick={() => setOngletId(o.id)}
                                onKeyDown={(e) => surToucheOnglet(e, i)}
                                className={`px-4 py-2 rounded text-sm font-medium transition ${actif ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"} ${FOCUS}`}
                            >
                                {o.libelle}
                            </button>
                        );
                    })}
                </div>
                <BarreExport
                    key={onglet.id}
                    formats={onglet.formats}
                    onExport={exporter}
                    desactive={Boolean(erreurFiltre)}
                />
            </div>

            <div
                id={`panneau-${onglet.id}`}
                role="tabpanel"
                aria-labelledby={`onglet-${onglet.id}`}
                aria-busy={volet.loading}
            >
                {erreurFiltre ? (
                    <EtatVide titre="Période invalide" message={erreurFiltre} />
                ) : volet.error ? (
                    <EtatErreur message={volet.error} onReessayer={volet.recharger} />
                ) : volet.loading || !volet.data ? (
                    <Squelette lignes={onglet.id === "evolution" ? 1 : 5} hauteur={onglet.id === "evolution" ? "h-64" : "h-8"} />
                ) : (
                    <Vue data={volet.data} />
                )}
            </div>
        </div>
    );
};

export default StatistiquesPage;
