import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supprimerCommune, useCommunes, usePaysListe, useValeurRetardee } from "../hooks/useReferentiel";
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
} from "../components/referentiel/ReferentielUi";
import CommuneFormModal from "../components/referentiel/CommuneFormModal";
import ImportModal from "../components/referentiel/ImportModal";
import { IMPORTS, libelleCommunes, libelleQuartiers, nombrePages } from "../utils/referentiel";

// Communes du référentiel (admin) : liste, filtres, création, modification, suppression, import.

export default function CommunesPage() {
    const { user } = useAuth();
    const estAdmin = user?.role === "ADMIN";
    const [paysId, setPaysId] = useState("");
    const [recherche, setRecherche] = useState("");
    const [page, setPage] = useState(1);
    const q = useValeurRetardee(recherche);
    const paysApi = usePaysListe(estAdmin);
    const { data, loading, error, interdit, recharger } = useCommunes({ paysId, q, page }, estAdmin);
    // null = fermée, {} = création, commune = modification.
    const [formulaire, setFormulaire] = useState(null);
    const [importOuvert, setImportOuvert] = useState(false);
    const [suppression, setSuppression] = useState({ cible: null, enCours: false, erreur: "" });
    const [annonce, setAnnonce] = useState("");
    const idPays = useId();
    const idRecherche = useId();

    if ((user && !estAdmin) || interdit) {
        return <AccesReserve message="La gestion des communes est réservée aux administrateurs." />;
    }

    const filtre = paysId !== "" || q.trim() !== "";
    const communes = data?.communes ?? [];
    const total = data?.total ?? 0;

    const confirmerSuppression = async () => {
        const { cible } = suppression;
        setSuppression({ cible, enCours: true, erreur: "" });
        try {
            await supprimerCommune(cible.id);
            setSuppression({ cible: null, enCours: false, erreur: "" });
            setAnnonce(`Commune « ${cible.nom} » supprimée.`);
            // Dernière ligne d'une page : retour à la page précédente.
            if (communes.length === 1 && page > 1) setPage(page - 1);
            else recharger();
        } catch (err) {
            // Suppression bloquée : le message du serveur dit pourquoi.
            setSuppression({ cible, enCours: false, erreur: err.message || "Suppression impossible." });
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Communes</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Communes de chaque pays, auxquelles les quartiers sont rattachés.
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" className={BOUTON_SECONDAIRE} onClick={() => setImportOuvert(true)}>
                        <Upload className="size-4" aria-hidden="true" />
                        {IMPORTS.communes.bouton}
                    </button>
                    <button type="button" className={BOUTON_PRIMAIRE} onClick={() => setFormulaire({})}>
                        <Plus className="size-4" aria-hidden="true" />
                        Ajouter une commune
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label htmlFor={idPays} className="mb-1 block text-sm text-gray-700">Pays</label>
                    <select
                        id={idPays}
                        className={CHAMP}
                        value={paysId}
                        onChange={(e) => {
                            setPaysId(e.target.value);
                            setPage(1);
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
                    <label htmlFor={idRecherche} className="mb-1 block text-sm text-gray-700">Recherche</label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                        <input
                            id={idRecherche}
                            type="search"
                            className={`${CHAMP} pl-9`}
                            value={recherche}
                            onChange={(e) => {
                                setRecherche(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Nom de la commune"
                            autoComplete="off"
                        />
                    </div>
                </div>
            </div>

            {paysApi.error && <AlerteErreur>Liste des pays indisponible : {paysApi.error}</AlerteErreur>}
            <Annonce message={annonce} />

            {loading && !data ? (
                <Squelette lignes={6} />
            ) : error ? (
                <EtatErreur message={error} onReessayer={recharger} />
            ) : !data ? null : total === 0 ? (
                <EtatVide
                    titre={filtre ? "Aucune commune trouvée" : "Aucune commune"}
                    message={
                        filtre
                            ? "Aucune commune ne correspond à ces filtres."
                            : "Ajoutez une commune ou importez un fichier Excel."
                    }
                />
            ) : (
                <section
                    className={`rounded-xl border border-gray-200 bg-white py-4 shadow-sm ${loading ? "opacity-60" : ""}`}
                    aria-busy={loading}
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <caption className="sr-only">Communes, avec leur pays et leur nombre de quartiers</caption>
                            <thead>
                                <tr className={ENTETE_TABLEAU}>
                                    <th scope="col" className="px-4 py-2">Commune</th>
                                    <th scope="col" className="hidden px-3 py-2 sm:table-cell">Pays</th>
                                    <th scope="col" className="px-3 py-2 text-right">Quartiers</th>
                                    <th scope="col" className="px-4 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {communes.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <th scope="row" className="px-4 py-2 text-left font-medium text-gray-900">
                                            {c.nom}
                                            <span className="block text-xs font-normal text-gray-500 sm:hidden">
                                                {c.pays?.nom ?? "Pays non renseigné"}
                                            </span>
                                        </th>
                                        <td className="hidden px-3 py-2 text-gray-700 sm:table-cell">
                                            {c.pays?.nom ?? <span className="italic text-gray-500">Non renseigné</span>}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Link
                                                to={`/quartiers?paysId=${c.pays?.id ?? ""}&communeId=${c.id}`}
                                                className={`rounded font-medium tabular-nums text-blue-700 hover:underline ${FOCUS}`}
                                                aria-label={`${libelleQuartiers(c.quartiers)} à ${c.nom} : voir la liste`}
                                            >
                                                {c.quartiers}
                                            </Link>
                                            {c.quartiersEnAttente > 0 && (
                                                <span className="block text-xs text-amber-700">
                                                    dont {c.quartiersEnAttente} en attente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    className={BOUTON_LIGNE}
                                                    onClick={() => setFormulaire(c)}
                                                    aria-label={`Modifier la commune ${c.nom}`}
                                                >
                                                    <Pencil className="size-4" aria-hidden="true" />
                                                    <span className="hidden md:inline">Modifier</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={BOUTON_LIGNE_DANGER}
                                                    onClick={() => setSuppression({ cible: c, enCours: false, erreur: "" })}
                                                    aria-label={`Supprimer la commune ${c.nom}`}
                                                >
                                                    <Trash2 className="size-4" aria-hidden="true" />
                                                    <span className="hidden md:inline">Supprimer</span>
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
                        libelleTotal={libelleCommunes(total)}
                        onPage={setPage}
                        desactive={loading}
                    />
                </section>
            )}

            <CommuneFormModal
                cible={formulaire}
                pays={paysApi.pays}
                erreurPays={paysApi.error}
                paysParDefaut={paysId}
                onFermer={() => setFormulaire(null)}
                onEnregistre={(commune, modifiee) => {
                    setFormulaire(null);
                    setAnnonce(`Commune « ${commune.nom} » ${modifiee ? "modifiée" : "créée"}.`);
                    recharger();
                }}
            />

            <ImportModal
                ouvert={importOuvert}
                type="communes"
                onFermer={() => setImportOuvert(false)}
                onImporte={(r) => {
                    setAnnonce(`Import terminé : ${libelleCommunes(r.resume?.importes ?? 0)} créée${(r.resume?.importes ?? 0) > 1 ? "s" : ""}.`);
                    recharger();
                }}
            />

            <Confirmation
                ouvert={suppression.cible !== null}
                titre="Supprimer la commune"
                libelle="Supprimer"
                danger
                enCours={suppression.enCours}
                erreur={suppression.erreur}
                onConfirmer={confirmerSuppression}
                onAnnuler={() => setSuppression({ cible: null, enCours: false, erreur: "" })}
            >
                <p>
                    Supprimer la commune <span className="font-semibold">« {suppression.cible?.nom} »</span>
                    {suppression.cible?.pays?.nom ? ` (${suppression.cible.pays.nom})` : ""} ? Cette action ne peut pas être annulée.
                </p>
                {suppression.cible?.quartiers > 0 && !suppression.erreur && (
                    <p className="text-amber-800">
                        Cette commune compte {libelleQuartiers(suppression.cible.quartiers)} : une commune qui a des
                        quartiers ne peut pas être supprimée.
                    </p>
                )}
            </Confirmation>
        </div>
    );
}
