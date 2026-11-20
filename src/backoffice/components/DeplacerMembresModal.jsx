import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { Loader2, Search, X } from "lucide-react";
import { useCellules } from "../hooks/useCellules";
import { useDeplacerMembres } from "../hooks/useDeplacerMembres";
import { EtatErreur, EtatVide, FOCUS, Squelette } from "./statistiques/StatsUi";
import { cellulesCibles, corpsDeplacement, libelleRecap } from "../utils/deplacement";

// Confirmation du déplacement : choix de la cellule cible, récapitulatif, envoi ; Échap et clic extérieur ferment.

// Montée seulement une fois ouverte : pas d'appel GET /cellules/all avant.
export default function DeplacerMembresModal(props) {
    return props.ouvert ? <FenetreDeplacement {...props} /> : null;
}

function FenetreDeplacement({ ouvert, celluleId, celluleNom, nombre, ids, tous, onFermer, onTermine }) {
    const { cellules, loading, error, refetch } = useCellules();
    const { deplacer, enCours, erreur, effacerErreur } = useDeplacerMembres();
    const [recherche, setRecherche] = useState("");
    const [cibleId, setCibleId] = useState(null);

    // Remise à zéro à chaque ouverture.
    useEffect(() => {
        if (ouvert) {
            setRecherche("");
            setCibleId(null);
            effacerErreur();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ouvert]);

    const choix = useMemo(() => cellulesCibles(cellules, celluleId, recherche), [cellules, celluleId, recherche]);
    const cible = cellules.find((c) => c.id === cibleId) ?? null;

    const confirmer = async () => {
        if (!cible || enCours) return;
        try {
            const res = await deplacer(celluleId, corpsDeplacement({ celluleCibleId: cible.id, ids, tous }));
            onTermine(res);
        } catch {
            // Message déjà affiché via `erreur`.
        }
    };

    const fermer = () => {
        if (!enCours) onFermer();
    };

    return (
        <Dialog open={ouvert} onClose={fermer} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-gray-900/50" />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPanel className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl">
                    <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Déplacer {tous ? "tous les membres" : "la sélection"}
                        </DialogTitle>
                        <button
                            type="button"
                            onClick={fermer}
                            aria-label="Fermer"
                            className={`rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${FOCUS}`}
                        >
                            <X className="size-5" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                        <label htmlFor="deplacer-recherche" className="block text-sm font-medium text-gray-700">
                            Cellule de destination
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                            <input
                                id="deplacer-recherche"
                                type="text"
                                value={recherche}
                                onChange={(e) => setRecherche(e.target.value)}
                                placeholder="Rechercher une cellule…"
                                className={`w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm ${FOCUS}`}
                            />
                        </div>
                        {loading ? (
                            <Squelette lignes={3} />
                        ) : error ? (
                            <EtatErreur message={error} onReessayer={refetch} />
                        ) : choix.length === 0 ? (
                            <EtatVide titre="Aucune cellule" message="Aucune cellule active ne correspond." />
                        ) : (
                            <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200" role="radiogroup" aria-label="Cellule de destination">
                                {choix.map((c) => (
                                    <li key={c.id}>
                                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="cellule-cible"
                                                checked={cibleId === c.id}
                                                onChange={() => setCibleId(c.id)}
                                                className={FOCUS}
                                            />
                                            <span className="truncate text-gray-900">{c.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {cible && (
                            <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900" aria-live="polite">
                                {libelleRecap(nombre, celluleNom, cible.name)}
                            </p>
                        )}
                        {erreur && <EtatErreur message={erreur} />}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
                        <button
                            type="button"
                            onClick={fermer}
                            disabled={enCours}
                            className={`rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 ${FOCUS}`}
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={confirmer}
                            disabled={!cible || enCours}
                            className={`inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
                        >
                            {enCours && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                            {enCours ? "Déplacement…" : "Déplacer"}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
