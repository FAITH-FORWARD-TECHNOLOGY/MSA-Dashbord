import React from "react";
import { MapPinOff } from "lucide-react";
import { FOCUS } from "../statistiques/StatsUi";
import { LIBELLE_AUCUN_LIEU, libelleMembres, libellePart } from "../../utils/repartition";

// Encart « Sans quartier renseigné » : total, aucun lieu et commune seule.

function Detail({ libelle, nombre, onVoir }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-amber-900">
                {libelle} : <span className="font-semibold tabular-nums">{nombre}</span>
            </span>
            {onVoir && nombre > 0 && (
                <button
                    type="button"
                    onClick={(e) => onVoir(e.currentTarget)}
                    aria-label={`Voir les membres : ${libelle}`}
                    className={`rounded px-2 py-1 text-xs font-medium text-amber-900 underline hover:bg-amber-100 ${FOCUS}`}
                >
                    Voir
                </button>
            )}
        </div>
    );
}

export default function EncartSansQuartier({ sansQuartier, total, onVoirMembres }) {
    const voir = (cible) => (onVoirMembres ? (origine) => onVoirMembres(cible, origine) : undefined);
    return (
        <section
            aria-labelledby="titre-sans-quartier"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
            <div className="flex items-start gap-3">
                <MapPinOff className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <h2 id="titre-sans-quartier" className="text-sm font-semibold text-amber-900">
                        Sans quartier renseigné
                    </h2>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                        <span className="text-2xl font-bold tabular-nums text-amber-900" aria-label={libelleMembres(sansQuartier.total)}>
                            {sansQuartier.total}
                        </span>
                        <span className="text-xs text-amber-800">
                            {libellePart(sansQuartier.total, total)} des membres
                        </span>
                    </p>
                    <div className="mt-2 space-y-1">
                        <Detail
                            libelle="Aucun lieu"
                            nombre={sansQuartier.aucunLieu}
                            onVoir={voir({ sansLieu: true, titre: LIBELLE_AUCUN_LIEU })}
                        />
                        <Detail
                            libelle="Commune seule"
                            nombre={sansQuartier.communeSeule}
                            onVoir={voir({ communeSeule: true, titre: "Commune seule, quartier non renseigné" })}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
