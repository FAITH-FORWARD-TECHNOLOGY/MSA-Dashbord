import React, { useRef, useState } from "react";
import { CalendarX, CheckCircle2, X } from "lucide-react";
import {
    telechargerExport,
    useStatistiquesCellules,
    useStatistiquesVolet,
} from "../hooks/useStatistiques";
import { estDonneePerimee, trouverJourNa, useJoursNa } from "../hooks/useJoursNa";
import {
    BarreExport,
    CarteRegularite,
    EtatErreur,
    EtatVide,
    FOCUS,
    Squelette,
} from "../components/statistiques/StatsUi";
import SuiviTab from "../components/statistiques/SuiviTab";
import EvolutionTab from "../components/statistiques/EvolutionTab";
import PresentsTab from "../components/statistiques/PresentsTab";
import { JourNaDetailModal, JourNaFormModal } from "../components/statistiques/JoursNaModales";
import { horsPeriode, periodeIncluant } from "../components/statistiques/joursNa";
import CellulesMultiSelect from "../components/statistiques/CellulesMultiSelect";
import {
    libelleCellules,
    parametreCelluleIds,
    selectionValide,
} from "../components/statistiques/cellulesFiltre";
import {
    dateFr,
    erreurPeriode,
    nomFichierExport,
    periodeParDefaut,
    pluriel,
    versYmd,
} from "../components/statistiques/format";

// Page « Statistiques » : suivi, évolution et liste des présents par cellule.

const ONGLETS = [
    { id: "suivi", libelle: "Suivi", chemin: "/presences/suivi", formats: ["xlsx", "pdf"], Vue: SuiviTab },
    { id: "evolution", libelle: "Évolution", chemin: "/presences/evolution", formats: ["xlsx"], Vue: EvolutionTab },
    { id: "presents", libelle: "Présents", chemin: "/presences/presents", formats: ["xlsx"], Vue: PresentsTab },
];

const CHAMP =
    "block w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const StatistiquesPage = () => {
    const cellulesApi = useStatistiquesCellules();
    const [periode, setPeriode] = useState(periodeParDefaut);
    // Cellules cochées (identifiants) ; [] = toutes les cellules.
    const [selection, setSelection] = useState([]);
    const [ongletId, setOngletId] = useState("suivi");
    const refsOnglets = useRef([]);
    const refBoutonNa = useRef(null);
    // Modales des jours NA : détail d'une case, puis formulaire (création si jour null).
    const [naDetail, setNaDetail] = useState(null);
    const [naForm, setNaForm] = useState(null);
    // Confirmation après écriture NA : { texte, date? } (date = hors période affichée).
    const [avisNa, setAvisNa] = useState(null);

    // Une cellule disparue de la liste sort de la sélection (sinon 403).
    const cellulesChoisies = selectionValide(selection, cellulesApi.cellules);
    const celluleIds = parametreCelluleIds(cellulesChoisies);
    const filtres = { du: periode.du, au: periode.au, celluleIds };
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
    // Sans filtre : jours NA de la période. Filtre actif : la modale lit le groupe entier du jour ouvert.
    const joursNa = useJoursNa(
        { du: periode.du, au: periode.au },
        pret && ongletId === "suivi" && celluleIds === ""
    );
    const dateDetail = naDetail?.infos.date ?? "";
    const naEntier = useJoursNa(
        { du: dateDetail, au: dateDetail },
        pret && celluleIds !== "" && dateDetail !== ""
    );
    const naModale = celluleIds === "" ? joursNa : naEntier;
    const onglet = ONGLETS.find((o) => o.id === ongletId);
    const volet = volets[ongletId];

    // Après une écriture NA : les trois volets et la liste NA sont rechargés.
    const apresEcriture = () => {
        volets.suivi.recharger();
        volets.evolution.recharger();
        volets.presents.recharger();
        joursNa.recharger();
        naEntier.recharger();
    };
    // 403 / 404 : données périmées, on recharge aussi les cellules avant de relancer l'erreur.
    const ecrireNa = async (action) => {
        try {
            const res = await action();
            apresEcriture();
            return res;
        } catch (err) {
            if (estDonneePerimee(err)) {
                apresEcriture();
                cellulesApi.recharger({ silencieux: true });
                err.message = `${err.message} — les données ont été actualisées.`;
            }
            throw err;
        }
    };
    const enregistrerNa = async (corps) => {
        const jour = naForm?.jour;
        setAvisNa(null);
        const res = await ecrireNa(() =>
            jour ? joursNa.modifier(jour.groupe, corps) : joursNa.creer(corps)
        );
        const date = res?.date ?? jour?.date ?? corps.date;
        const nb = pluriel(res?.cellules?.length ?? corps.celluleIds?.length ?? 0, "cellule");
        setAvisNa({
            texte: jour
                ? `Jour NA du ${dateFr(date)} modifié (${nb}).`
                : `Jour NA du ${dateFr(date)} enregistré pour ${nb}.`,
            date: horsPeriode(date, periode) ? date : null,
        });
    };
    const supprimerNa = async (jour) => {
        setAvisNa(null);
        await ecrireNa(() => joursNa.supprimer(jour.groupe));
        setAvisNa({ texte: `Jour NA du ${dateFr(jour.date)} supprimé.`, date: null });
    };

    // Suffixe du fichier : nom de la cellule ou « N cellules » ; rien pour toutes.
    const nomCellule = celluleIds
        ? libelleCellules(cellulesChoisies, cellulesApi.cellules)
        : "";

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

    // Régularité globale du Suivi, affichée à côté de ses boutons d'export.
    const suivi = volets.suivi;
    const carteRegularite =
        ongletId === "suivi" && !erreurFiltre && !suivi.error ? (
            <CarteRegularite
                chargement={suivi.loading || !suivi.data}
                taux={suivi.data?.tauxGlobal == null ? "—" : `${suivi.data.tauxGlobal} %`}
                detail={`${pluriel(suivi.data?.cellules?.length ?? 0, "cellule")} · ${pluriel(
                    suivi.data?.dates?.length ?? 0,
                    "jour de réunion",
                    "jours de réunion"
                )}`}
            />
        ) : null;

    // Même hauteur que la carte et les exports (ligne en items-stretch).
    const boutonNa =
        ongletId === "suivi" ? (
            <button
                ref={refBoutonNa}
                type="button"
                onClick={() => setNaForm({ jour: null })}
                aria-haspopup="dialog"
                className={`inline-flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md border border-blue-600 bg-white text-blue-700 hover:bg-blue-50 transition-colors duration-200 ${FOCUS}`}
            >
                <CalendarX className="h-4 w-4" aria-hidden="true" />
                Marquer un jour NA
            </button>
        ) : null;

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
                <CellulesMultiSelect
                    cellules={cellulesApi.cellules}
                    selection={cellulesChoisies}
                    onChange={setSelection}
                />
                {erreurFiltre && (
                    <p className="sm:col-span-3 text-sm text-red-600" role="alert">
                        {erreurFiltre}
                    </p>
                )}
            </div>

            {/* Onglets + exports */}
            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-end sm:justify-between">
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
                    avant={
                        <>
                            {carteRegularite}
                            {boutonNa}
                        </>
                    }
                />
            </div>

            {/* Région toujours présente pour que l'annonce soit lue par les lecteurs d'écran. */}
            <div role="status" aria-live="polite">
                {avisNa && (
                    <div className="mb-4 flex flex-col gap-2 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800 sm:flex-row sm:items-center sm:justify-between">
                        <p className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span>
                                {avisNa.texte}
                                {avisNa.date && " Cette date est hors de la période affichée."}
                            </span>
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                            {avisNa.date && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPeriode((p) => periodeIncluant(p, avisNa.date));
                                        setAvisNa(null);
                                    }}
                                    className={`px-3 py-1.5 rounded-md border border-green-300 bg-white text-sm font-medium text-green-800 hover:bg-green-100 ${FOCUS}`}
                                >
                                    Afficher le {dateFr(avisNa.date)}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setAvisNa(null)}
                                aria-label="Masquer le message"
                                className={`rounded-md p-1 text-green-700 hover:bg-green-100 ${FOCUS}`}
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                )}
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
                    <Vue data={volet.data} onOuvrirNa={(infos, element) => setNaDetail({ infos, element })} />
                )}
            </div>

            {naDetail && (
                <JourNaDetailModal
                    infos={naDetail.infos}
                    origine={naDetail.element}
                    jour={trouverJourNa(naModale.jours, naDetail.infos.date, naDetail.infos.celluleId)}
                    chargement={naModale.loading}
                    erreur={naModale.error}
                    onRecharger={naModale.recharger}
                    onModifier={(jour) => {
                        setNaDetail(null);
                        setNaForm({ jour });
                    }}
                    onSupprimer={supprimerNa}
                    onFermer={() => setNaDetail(null)}
                    retourFocus={refBoutonNa}
                />
            )}
            {naForm && (
                <JourNaFormModal
                    jour={naForm.jour}
                    cellules={cellulesApi.cellules}
                    dateInitiale={versYmd(new Date())}
                    onEnregistrer={enregistrerNa}
                    onFermer={() => setNaForm(null)}
                    retourFocus={refBoutonNa}
                />
            )}
        </div>
    );
};

export default StatistiquesPage;
