import { useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, GitMerge, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
    supprimerQuartier,
    useCommunesDuPays,
    usePaysListe,
    useQuartiers,
    useValeurRetardee,
    validerQuartier,
} from "../hooks/useReferentiel";
import { EtatErreur, EtatVide, FOCUS, Squelette } from "../components/statistiques/StatsUi";
import {
    AccesReserve,
    AlerteErreur,
    Annonce,
    BOUTON_LIGNE,
    BOUTON_LIGNE_DANGER,
    BOUTON_PRIMAIRE,
    BOUTON_SECONDAIRE,
    CHAMP,
    Confirmation,
    ENTETE_TABLEAU,
    Pagination,
    Pastille,
} from "../components/referentiel/ReferentielUi";
import QuartierFormModal from "../components/referentiel/QuartierFormModal";
import FusionModal from "../components/referentiel/FusionModal";
import ImportModal from "../components/referentiel/ImportModal";
import {
    IMPORTS,
    libelleQuartiers,
    libelleStatut,
    nombrePages,
    STATUT_EN_ATTENTE,
    STATUT_VALIDE,
    tonStatut,
} from "../utils/referentiel";
import { libelleMembres, nomComplet } from "../utils/repartition";

// Quartiers du référentiel (admin) : liste filtrée, écran « En attente », ajout, fusion, import.

const VUE_ATTENTE = "en-attente";
const dateFr = (iso) => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "");

function Onglet({ actif, onClick, children, id, controle }) {
    return (
        <button
            type="button"
            role="tab"
            id={id}
            aria-selected={actif}
            aria-controls={controle}
            tabIndex={actif ? 0 : -1}
            onClick={onClick}
            className={`-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium ${actif ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800"} ${FOCUS}`}
        >
            {children}
        </button>
    );
}

export default function QuartiersPage() {
    const { user } = useAuth();
    const estAdmin = user?.role === "ADMIN";
    const [params, setParams] = useSearchParams();
    const enAttente = params.get("vue") === VUE_ATTENTE;
    // Filtres initiaux portés par le lien (depuis la liste des communes).
    const [paysId, setPaysId] = useState(() => params.get("paysId") ?? "");
    const [communeId, setCommuneId] = useState(() => params.get("communeId") ?? "");
    const [statut, setStatut] = useState("");
    const [recherche, setRecherche] = useState("");
    const [page, setPage] = useState(1);
    const q = useValeurRetardee(recherche);
    const paysApi = usePaysListe(estAdmin);
    const communesApi = useCommunesDuPays(estAdmin ? paysId : "");
    const { data, loading, error, interdit, recharger } = useQuartiers(
        { paysId, communeId, statut: enAttente ? STATUT_EN_ATTENTE : statut, q, page },
        estAdmin
    );
    // null = fermée, {} = création, quartier = modification.
    const [formulaire, setFormulaire] = useState(null);
    const [fusion, setFusion] = useState(null);
    const [importOuvert, setImportOuvert] = useState(false);
    const [suppression, setSuppression] = useState({ cible: null, enCours: false, erreur: "" });
    const [annonce, setAnnonce] = useState("");
    const [erreurAction, setErreurAction] = useState("");
    const [validation, setValidation] = useState(null);
    const idPays = useId();
    const idCommune = useId();
    const idStatut = useId();
    const idRecherche = useId();
    const idOnglets = useId();

    if ((user && !estAdmin) || interdit) {
        return <AccesReserve message="La gestion des quartiers est réservée aux administrateurs." />;
    }

    const quartiers = data?.quartiers ?? [];
    const total = data?.total ?? 0;
    const nbAttente = data?.enAttente ?? 0;
    const communeHorsListe =
        communeId !== "" && !communesApi.loading && !communesApi.communes.some((c) => String(c.id) === communeId);
    const filtre = paysId !== "" || communeId !== "" || q.trim() !== "" || (!enAttente && statut !== "");

    const changer = (setter) => (valeur) => {
        setter(valeur);
        setPage(1);
    };

    // Les filtres du lien d'origine quittent l'URL dès qu'ils sont modifiés.
    const oublierLien = () => {
        if (!params.has("paysId") && !params.has("communeId")) return;
        const suite = new URLSearchParams(params);
        suite.delete("paysId");
        suite.delete("communeId");
        setParams(suite, { replace: true });
    };

    // Dernière ligne d'une page : retour à la page précédente, sinon rechargement.
    const apresRetrait = (message) => {
        setAnnonce(message);
        setErreurAction("");
        if (quartiers.length === 1 && page > 1) setPage(page - 1);
        else recharger();
    };

    const choisirVue = (vue) => {
        const suite = new URLSearchParams(params);
        if (vue) suite.set("vue", vue);
        else suite.delete("vue");
        setParams(suite, { replace: true });
        setPage(1);
    };

    // Flèches gauche / droite : passe d'un onglet à l'autre.
    const surToucheOnglets = (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        choisirVue(enAttente ? "" : VUE_ATTENTE);
        const autre = e.currentTarget.querySelector('[role="tab"][aria-selected="false"]');
        autre?.focus();
    };

    const succes = (message) => {
        setAnnonce(message);
        setErreurAction("");
        recharger();
    };

    const valider = async (quartier) => {
        if (validation !== null) return;
        setValidation(quartier.id);
        setErreurAction("");
        try {
            await validerQuartier(quartier.id);
            if (enAttente) apresRetrait(`Quartier « ${quartier.nom} » validé.`);
            else succes(`Quartier « ${quartier.nom} » validé.`);
        } catch (err) {
            setAnnonce("");
            setErreurAction(err.message || "Validation impossible.");
        } finally {
            setValidation(null);
        }
    };

    const confirmerSuppression = async () => {
        const { cible } = suppression;
        setSuppression({ cible, enCours: true, erreur: "" });
        try {
            await supprimerQuartier(cible.id);
            setSuppression({ cible: null, enCours: false, erreur: "" });
            apresRetrait(`Quartier « ${cible.nom} » supprimé.`);
        } catch (err) {
            // Suppression bloquée (membres rattachés) : message du serveur.
            setSuppression({ cible, enCours: false, erreur: err.message || "Suppression impossible." });
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quartiers</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Quartiers de résidence des membres, par commune. Les quartiers proposés par les membres
                        restent « En attente » jusqu'à leur validation.
                    </p>
                </div>
                {/* Boutons sur une ligne, texte jamais coupé ; en colonne sur téléphone. */}
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <button type="button" className={`${BOUTON_SECONDAIRE} whitespace-nowrap`} onClick={() => setImportOuvert(true)}>
                        <Upload className="size-4" aria-hidden="true" />
                        {IMPORTS.quartiers.bouton}
                    </button>
                    <button type="button" className={`${BOUTON_PRIMAIRE} whitespace-nowrap`} onClick={() => setFormulaire({})}>
                        <Plus className="size-4" aria-hidden="true" />
                        Ajouter un quartier
                    </button>
                </div>
            </div>

            <div role="tablist" aria-label="Vue des quartiers" className="flex gap-2 border-b border-gray-200" onKeyDown={surToucheOnglets}>
                <Onglet id={`${idOnglets}-tous`} controle={`${idOnglets}-panneau`} actif={!enAttente} onClick={() => choisirVue("")}>
                    Tous les quartiers
                </Onglet>
                <Onglet id={`${idOnglets}-attente`} controle={`${idOnglets}-panneau`} actif={enAttente} onClick={() => choisirVue(VUE_ATTENTE)}>
                    En attente
                    {data && (
                        <span
                            className={`inline-flex min-w-6 justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${nbAttente > 0 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}`}
                        >
                            {nbAttente}
                            <span className="sr-only"> {nbAttente > 1 ? "quartiers" : "quartier"}</span>
                        </span>
                    )}
                </Onglet>
            </div>

            <div
                role="tabpanel"
                id={`${idOnglets}-panneau`}
                aria-labelledby={enAttente ? `${idOnglets}-attente` : `${idOnglets}-tous`}
                className="space-y-5"
            >
                <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${enAttente ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
                    <div>
                        <label htmlFor={idPays} className="mb-1 block text-sm text-gray-700">Pays</label>
                        <select
                            id={idPays}
                            className={CHAMP}
                            value={paysId}
                            onChange={(e) => {
                                changer(setPaysId)(e.target.value);
                                setCommuneId("");
                                oublierLien();
                            }}
                        >
                            <option value="">Tous les pays</option>
                            {paysApi.pays.map((p) => (
                                <option key={p.id} value={String(p.id)}>
                                    {p.nom}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor={idCommune} className="mb-1 block text-sm text-gray-700">Commune</label>
                        <select
                            id={idCommune}
                            className={CHAMP}
                            value={communeId}
                            onChange={(e) => {
                                changer(setCommuneId)(e.target.value);
                                oublierLien();
                            }}
                            disabled={(paysId === "" && !communeHorsListe) || communesApi.loading}
                            aria-describedby={paysId === "" && !communeHorsListe ? `${idCommune}-aide` : undefined}
                        >
                            <option value="">
                                {paysId === "" && !communeHorsListe ? "Choisissez d'abord un pays" : "Toutes les communes"}
                            </option>
                            {/* Commune du lien absente de la liste (sans pays) : elle reste visible et retirable. */}
                            {communeHorsListe && (
                                <option value={communeId}>{quartiers[0]?.commune?.nom ?? "Commune sélectionnée"}</option>
                            )}
                            {communesApi.communes.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.nom}
                                </option>
                            ))}
                        </select>
                        {paysId === "" && !communeHorsListe && (
                            <span id={`${idCommune}-aide`} className="sr-only">
                                Le filtre par commune demande de choisir un pays.
                            </span>
                        )}
                    </div>
                    {!enAttente && (
                        <div>
                            <label htmlFor={idStatut} className="mb-1 block text-sm text-gray-700">Statut</label>
                            <select
                                id={idStatut}
                                className={CHAMP}
                                value={statut}
                                onChange={(e) => changer(setStatut)(e.target.value)}
                            >
                                <option value="">Tous les statuts</option>
                                <option value={STATUT_VALIDE}>{libelleStatut(STATUT_VALIDE)}</option>
                                <option value={STATUT_EN_ATTENTE}>{libelleStatut(STATUT_EN_ATTENTE)}</option>
                            </select>
                        </div>
                    )}
                    <div>
                        <label htmlFor={idRecherche} className="mb-1 block text-sm text-gray-700">Recherche</label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                            <input
                                id={idRecherche}
                                type="search"
                                className={`${CHAMP} pl-9`}
                                value={recherche}
                                onChange={(e) => changer(setRecherche)(e.target.value)}
                                placeholder="Nom du quartier"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </div>

                {paysApi.error && <AlerteErreur>Liste des pays indisponible : {paysApi.error}</AlerteErreur>}
                <Annonce message={annonce} />
                <AlerteErreur>{erreurAction}</AlerteErreur>

                {loading && !data ? (
                    <Squelette lignes={6} />
                ) : error ? (
                    <EtatErreur message={error} onReessayer={recharger} />
                ) : !data ? null : total === 0 ? (
                    <EtatVide
                        titre={enAttente ? "Aucun quartier en attente" : filtre ? "Aucun quartier trouvé" : "Aucun quartier"}
                        message={
                            filtre
                                ? "Aucun quartier ne correspond à ces filtres."
                                : enAttente
                                  ? "Tous les quartiers proposés par les membres ont été traités."
                                  : "Ajoutez un quartier ou importez un fichier Excel ou CSV."
                        }
                    />
                ) : (
                    <section
                        className={`rounded-xl border border-gray-200 bg-white py-4 shadow-sm ${loading ? "opacity-60" : ""}`}
                        aria-busy={loading}
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <caption className="sr-only">
                                    {enAttente
                                        ? "Quartiers en attente de validation"
                                        : "Quartiers, avec leur commune, leur pays, leur statut et leur nombre de membres"}
                                </caption>
                                <thead>
                                    <tr className={ENTETE_TABLEAU}>
                                        <th scope="col" className="px-4 py-2">Quartier</th>
                                        <th scope="col" className="hidden px-3 py-2 md:table-cell">Commune</th>
                                        <th scope="col" className="hidden px-3 py-2 lg:table-cell">Pays</th>
                                        {enAttente ? (
                                            <th scope="col" className="hidden px-3 py-2 lg:table-cell">Proposé par</th>
                                        ) : (
                                            <th scope="col" className="hidden px-3 py-2 sm:table-cell">Statut</th>
                                        )}
                                        <th scope="col" className="hidden px-3 py-2 text-right sm:table-cell">Membres</th>
                                        <th scope="col" className="px-4 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {quartiers.map((z) => (
                                        <tr key={z.id} className="align-top hover:bg-gray-50">
                                            <th scope="row" className="px-4 py-2 text-left font-medium text-gray-900">
                                                <span className="break-words">{z.nom}</span>
                                                {/* Téléphone : statut et membres passent sous le nom pour que le tableau tienne dans l'écran. */}
                                                {!enAttente && (
                                                    <span className="mt-1 block sm:hidden">
                                                        <Pastille ton={tonStatut(z.statut)}>{libelleStatut(z.statut)}</Pastille>
                                                    </span>
                                                )}
                                                <span className="block text-xs font-normal text-gray-500 md:hidden">
                                                    {z.commune?.nom}
                                                    {z.pays?.nom ? `, ${z.pays.nom}` : ""}
                                                </span>
                                                <span className="hidden text-xs font-normal text-gray-500 md:block lg:hidden">
                                                    {z.pays?.nom}
                                                </span>
                                                <span className="block text-xs font-normal tabular-nums text-gray-500 sm:hidden">
                                                    {libelleMembres(z.membres)}
                                                </span>
                                                {enAttente && (
                                                    <span className="block text-xs font-normal text-gray-500 lg:hidden">
                                                        Proposé par {z.creePar ? nomComplet(z.creePar) || "un membre" : "—"}
                                                        {z.createdAt ? `, le ${dateFr(z.createdAt)}` : ""}
                                                    </span>
                                                )}
                                            </th>
                                            <td className="hidden px-3 py-2 text-gray-700 md:table-cell">{z.commune?.nom}</td>
                                            <td className="hidden px-3 py-2 text-gray-700 lg:table-cell">
                                                {z.pays?.nom ?? <span className="italic text-gray-500">Non renseigné</span>}
                                            </td>
                                            {enAttente ? (
                                                <td className="hidden px-3 py-2 text-gray-700 lg:table-cell">
                                                    {z.creePar ? nomComplet(z.creePar) || "Membre" : "—"}
                                                    <span className="block text-xs text-gray-500">{dateFr(z.createdAt)}</span>
                                                </td>
                                            ) : (
                                                <td className="hidden px-3 py-2 sm:table-cell">
                                                    <Pastille ton={tonStatut(z.statut)}>{libelleStatut(z.statut)}</Pastille>
                                                </td>
                                            )}
                                            <td
                                                className="hidden px-3 py-2 text-right tabular-nums text-gray-800 sm:table-cell"
                                                aria-label={libelleMembres(z.membres)}
                                            >
                                                {z.membres}
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex justify-end gap-2">
                                                    {enAttente && (
                                                        <button
                                                            type="button"
                                                            className={BOUTON_LIGNE}
                                                            onClick={() => valider(z)}
                                                            disabled={validation !== null}
                                                            aria-busy={validation === z.id}
                                                            aria-label={`Valider le quartier ${z.nom}`}
                                                        >
                                                            <Check className="size-4 text-green-700" aria-hidden="true" />
                                                            <span className="hidden xl:inline">Valider</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className={BOUTON_LIGNE}
                                                        onClick={() => setFormulaire(z)}
                                                        aria-label={`${enAttente ? "Renommer" : "Modifier"} le quartier ${z.nom}`}
                                                    >
                                                        <Pencil className="size-4" aria-hidden="true" />
                                                        <span className="hidden xl:inline">{enAttente ? "Renommer" : "Modifier"}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={BOUTON_LIGNE}
                                                        onClick={() => setFusion(z)}
                                                        aria-label={`Fusionner le quartier ${z.nom}`}
                                                    >
                                                        <GitMerge className="size-4" aria-hidden="true" />
                                                        <span className="hidden xl:inline">Fusionner</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={BOUTON_LIGNE_DANGER}
                                                        onClick={() => setSuppression({ cible: z, enCours: false, erreur: "" })}
                                                        aria-label={`Supprimer le quartier ${z.nom}`}
                                                    >
                                                        <Trash2 className="size-4" aria-hidden="true" />
                                                        <span className="hidden xl:inline">Supprimer</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={data.page}
                            pages={nombrePages(total, data.limite)}
                            libelleTotal={enAttente ? `${libelleQuartiers(total)} en attente` : libelleQuartiers(total)}
                            onPage={setPage}
                            desactive={loading}
                        />
                    </section>
                )}
            </div>

            <QuartierFormModal
                cible={formulaire}
                titre={formulaire?.id && enAttente ? "Renommer le quartier" : undefined}
                paysParDefaut={paysId}
                communeParDefaut={communeId}
                onFermer={() => setFormulaire(null)}
                onEnregistre={(quartier, modifie) => {
                    setFormulaire(null);
                    succes(`Quartier « ${quartier.nom} » ${modifie ? "modifié" : "créé"}.`);
                }}
            />

            <FusionModal
                source={fusion}
                onFermer={() => setFusion(null)}
                onFusionne={(resultat, source) => {
                    setFusion(null);
                    succes(
                        `« ${source.nom} » fusionné dans « ${resultat.cible.nom} » : ${libelleMembres(resultat.membresDeplaces ?? 0)} déplacé${(resultat.membresDeplaces ?? 0) > 1 ? "s" : ""}.`
                    );
                }}
            />

            <ImportModal
                ouvert={importOuvert}
                type="quartiers"
                onFermer={() => setImportOuvert(false)}
                onImporte={(r) =>
                    succes(`Import terminé : ${libelleQuartiers(r.resume?.importes ?? 0)} créé${(r.resume?.importes ?? 0) > 1 ? "s" : ""}.`)
                }
            />

            <Confirmation
                ouvert={suppression.cible !== null}
                titre="Supprimer le quartier"
                libelle="Supprimer"
                danger
                enCours={suppression.enCours}
                erreur={suppression.erreur}
                onConfirmer={confirmerSuppression}
                onAnnuler={() => setSuppression({ cible: null, enCours: false, erreur: "" })}
            >
                <p>
                    Supprimer le quartier <span className="font-semibold">« {suppression.cible?.nom} »</span> (
                    {suppression.cible?.commune?.nom}) ? Cette action ne peut pas être annulée.
                </p>
                {suppression.cible?.membres > 0 && !suppression.erreur && (
                    <p className="text-amber-800">
                        {libelleMembres(suppression.cible.membres)} y {suppression.cible.membres > 1 ? "sont rattachés" : "est rattaché"} :
                        un quartier qui a des membres ne peut pas être supprimé. Fusionnez-le plutôt avec un autre quartier.
                    </p>
                )}
            </Confirmation>
        </div>
    );
}
