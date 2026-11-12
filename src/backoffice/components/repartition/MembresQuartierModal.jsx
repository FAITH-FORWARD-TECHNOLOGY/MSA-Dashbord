import React, { useEffect, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { EtatErreur, EtatVide, FOCUS, Squelette } from "../statistiques/StatsUi";
import { useMembresRepartition } from "../../hooks/useRepartition";
import { libelleMembres, nomComplet, parametresMembres } from "../../utils/repartition";

// Liste paginée des membres d'un quartier (ou sans quartier) ; Échap et clic extérieur ferment.

const BOUTON_PAGE = `inline-flex h-9 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;

export default function MembresQuartierModal({ cible, paysId, celluleIds, lienProfil = true, onFermer }) {
    const [page, setPage] = useState(1);
    // Nouvelle cible : retour à la première page.
    useEffect(() => setPage(1), [cible]);
    const params = cible ? parametresMembres(cible, { paysId, celluleIds, page }) : null;
    const { data, loading, error, interdit, recharger } = useMembresRepartition(params);
    const total = data?.total ?? 0;
    const pages = data ? Math.max(1, Math.ceil(total / data.limite)) : 1;

    return (
        <Dialog open={cible !== null} onClose={onFermer} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-gray-900/50" />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPanel className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl">
                    <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                        <div className="min-w-0">
                            <DialogTitle className="text-lg font-semibold text-gray-900">
                                {cible?.titre}
                            </DialogTitle>
                            <p className="mt-0.5 text-sm text-gray-500" aria-live="polite">
                                {data ? libelleMembres(total) : "Chargement…"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onFermer}
                            aria-label="Fermer"
                            className={`rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${FOCUS}`}
                        >
                            <X className="size-5" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        {loading && !data ? (
                            <Squelette lignes={5} />
                        ) : interdit ? (
                            <EtatErreur message="Vous n'avez pas accès à ces membres." />
                        ) : error ? (
                            <EtatErreur message={error} onReessayer={recharger} />
                        ) : total === 0 ? (
                            <EtatVide titre="Aucun membre" message="Personne n'est rattaché à ce lieu." />
                        ) : (
                            <ul className={`divide-y divide-gray-100 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
                                {data.membres.map((m) => (
                                    <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">{nomComplet(m)}</p>
                                            <p className="truncate text-xs text-gray-500">
                                                {m.cellules.length > 0
                                                    ? m.cellules.map((c) => c.name).join(", ")
                                                    : "Sans cellule"}
                                                {" · "}
                                                {m.quartier
                                                    ? `${m.quartier}, ${m.commune}`
                                                    : m.commune
                                                      ? `${m.commune} (commune seule)`
                                                      : "Aucun lieu renseigné"}
                                            </p>
                                        </div>
                                        {lienProfil && (
                                            <Link
                                                to={`/users/${m.id}`}
                                                className={`shrink-0 rounded px-2 py-1 text-xs font-medium text-blue-700 hover:underline ${FOCUS}`}
                                                aria-label={`Voir le profil de ${nomComplet(m)}`}
                                            >
                                                Voir
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {data && pages > 1 && (
                        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-5 py-3">
                            <button
                                type="button"
                                className={BOUTON_PAGE}
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <ChevronLeft className="size-4" aria-hidden="true" />
                                Précédent
                            </button>
                            <span className="text-sm text-gray-600" aria-live="polite">
                                Page {page} sur {pages}
                            </span>
                            <button
                                type="button"
                                className={BOUTON_PAGE}
                                disabled={page >= pages || loading}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Suivant
                                <ChevronRight className="size-4" aria-hidden="true" />
                            </button>
                        </div>
                    )}
                </DialogPanel>
            </div>
        </Dialog>
    );
}
