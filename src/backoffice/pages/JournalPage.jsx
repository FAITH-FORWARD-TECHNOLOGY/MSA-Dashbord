import { useId, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { EtatErreur, EtatVide, Squelette } from "../components/statistiques/StatsUi";
import { CHAMP, ENTETE_TABLEAU, Pagination } from "../components/referentiel/ReferentielUi";
import { useActeursJournal, useJournal, useListeRoles } from "../hooks/useRoles";
import { ACTIONS_JOURNAL, alerteSuperAdmins, libelleAction } from "../utils/journalRoles";

const TAILLE = 20;

const dateHeure = (iso) =>
    new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

// Avant / après d'une ligne : JSON lisible, « — » quand rien n'est enregistré.
function Etat({ titre, valeur }) {
    const vide = valeur === null || valeur === undefined;
    return (
        <div className="min-w-0">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{titre}</h4>
            {vide ? (
                <p className="mt-1 text-sm text-gray-400">—</p>
            ) : (
                <pre className="mt-1 max-h-60 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-800">
                    {JSON.stringify(valeur, null, 2)}
                </pre>
            )}
        </div>
    );
}

function LigneJournal({ item }) {
    const [ouvert, setOuvert] = useState(false);
    const idDetail = useId();
    return (
        <>
            <tr>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{dateHeure(item.date)}</td>
                <td className="px-3 py-2 text-gray-900">{item.acteur?.nom ?? "—"}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{libelleAction(item.action)}</td>
                <td className="px-3 py-2 text-gray-700">{item.role?.nom ?? "—"}</td>
                <td className="px-3 py-2 text-gray-700">{item.cible?.nom ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                    <button
                        type="button"
                        onClick={() => setOuvert((o) => !o)}
                        aria-expanded={ouvert}
                        aria-controls={idDetail}
                        className="inline-flex items-center gap-1 rounded text-sm font-medium text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        {ouvert ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
                        Détail
                        <span className="sr-only"> de l'action du {dateHeure(item.date)}</span>
                    </button>
                </td>
            </tr>
            {ouvert && (
                <tr id={idDetail} className="bg-gray-50/50">
                    <td colSpan={6} className="px-4 py-3">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Etat titre="Avant" valeur={item.avant} />
                            <Etat titre="Après" valeur={item.apres} />
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function JournalPage() {
    const idFiltres = useId();
    const [page, setPage] = useState(1);
    const [filtres, setFiltres] = useState({ acteurId: "", action: "", du: "", au: "" });
    const roles = useListeRoles("BACKOFFICE");
    const acteurs = useActeursJournal(roles.data);
    const { data, loading, error, recharger } = useJournal({ page, taille: TAILLE, ...filtres });
    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / TAILLE));
    const filtreActif = Object.values(filtres).some(Boolean);
    const dateIncoherente = filtres.du && filtres.au && filtres.du > filtres.au;

    const changer = (cle) => (e) => {
        setFiltres((f) => ({ ...f, [cle]: e.target.value }));
        setPage(1);
    };

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Journal des rôles</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Chaque création, modification, attribution ou retrait de rôle est enregistré ici.
                </p>
            </div>

            {alerteSuperAdmins(roles.data) && (
                <div role="alert" className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
                    <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
                    <p className="text-sm">
                        <strong>Moins de 2 super admins.</strong> Il est recommandé d'en avoir au moins deux : si le seul
                        super admin perd l'accès, plus personne ne peut gérer les rôles.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 rounded bg-white p-4 shadow sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label htmlFor={`${idFiltres}-du`} className="mb-1 block text-sm text-gray-700">Du</label>
                    <input id={`${idFiltres}-du`} type="date" className={CHAMP} value={filtres.du} max={filtres.au || undefined} onChange={changer("du")} />
                </div>
                <div>
                    <label htmlFor={`${idFiltres}-au`} className="mb-1 block text-sm text-gray-700">Au</label>
                    <input id={`${idFiltres}-au`} type="date" className={CHAMP} value={filtres.au} min={filtres.du || undefined} onChange={changer("au")} />
                </div>
                <div>
                    <label htmlFor={`${idFiltres}-acteur`} className="mb-1 block text-sm text-gray-700">Acteur</label>
                    <select id={`${idFiltres}-acteur`} className={CHAMP} value={filtres.acteurId} onChange={changer("acteurId")}>
                        <option value="">Tous les acteurs</option>
                        {acteurs.map((a) => (
                            <option key={a.id} value={a.id}>{`${a.prenom ?? ""} ${a.nom ?? ""}`.trim() || a.email}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor={`${idFiltres}-action`} className="mb-1 block text-sm text-gray-700">Action</label>
                    <select id={`${idFiltres}-action`} className={CHAMP} value={filtres.action} onChange={changer("action")}>
                        <option value="">Toutes les actions</option>
                        {ACTIONS_JOURNAL.map((a) => (
                            <option key={a.code} value={a.code}>{a.libelle}</option>
                        ))}
                    </select>
                </div>
                {dateIncoherente && (
                    <p role="alert" className="text-sm text-red-600 sm:col-span-2 lg:col-span-4">
                        La date de début doit précéder la date de fin.
                    </p>
                )}
            </div>

            {loading && !data ? (
                <Squelette lignes={6} />
            ) : error ? (
                <EtatErreur message={error} onReessayer={recharger} />
            ) : items.length === 0 ? (
                <EtatVide
                    titre="Aucune entrée"
                    message={filtreActif ? "Aucune entrée ne correspond à ces filtres." : "Aucun changement de rôle n'a encore été enregistré."}
                />
            ) : (
                <div className={`rounded bg-white pb-3 shadow ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <caption className="sr-only">Journal d'audit des rôles</caption>
                            <thead className={ENTETE_TABLEAU}>
                                <tr>
                                    <th scope="col" className="px-4 py-2">Date</th>
                                    <th scope="col" className="px-3 py-2">Acteur</th>
                                    <th scope="col" className="px-3 py-2">Action</th>
                                    <th scope="col" className="px-3 py-2">Rôle</th>
                                    <th scope="col" className="px-3 py-2">Compte visé</th>
                                    <th scope="col" className="px-4 py-2 text-right">Détail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((it) => (
                                    <LigneJournal key={it.id} item={it} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        page={page}
                        pages={pages}
                        total={total}
                        libelleTotal={`${total} entrée${total > 1 ? "s" : ""}`}
                        onPage={setPage}
                        desactive={loading}
                    />
                </div>
            )}
        </div>
    );
}
