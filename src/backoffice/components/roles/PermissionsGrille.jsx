import { useId } from "react";
import { Lock } from "lucide-react";
import { Pastille } from "../referentiel/ReferentielUi";
import { FOCUS } from "../statistiques/StatsUi";
import {
    SA_CELLULE,
    TOUTES,
    basculer,
    caseDesactivee,
    changerPortee,
    decompteModule,
    toutCocher,
    toutDecocher,
} from "../../utils/rolesEdition";

const LIBELLE_PORTEE = { [TOUTES]: "Toutes les cellules", [SA_CELLULE]: "Sa cellule" };
const STYLE_PORTEE = {
    [TOUTES]: "border-indigo-600 bg-indigo-600 text-white",
    [SA_CELLULE]: "border-amber-600 bg-amber-500 text-white",
};

// Choix de la portée d'une permission de l'app : deux segments bien visibles.
function ChoixPortee({ libelle, valeur, onChange, desactive }) {
    const nom = useId();
    return (
        <div role="radiogroup" aria-label={`Portée de « ${libelle} »`} className="inline-flex overflow-hidden rounded-md border border-gray-300 text-xs font-semibold">
            {[TOUTES, SA_CELLULE].map((p) => {
                const actif = valeur === p;
                return (
                    <label
                        key={p}
                        className={`cursor-pointer px-2.5 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1 ${
                            actif ? STYLE_PORTEE[p] : "bg-white text-gray-600 hover:bg-gray-50"
                        } ${desactive ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                        <input
                            type="radio"
                            name={`${nom}-portee`}
                            value={p}
                            checked={actif}
                            disabled={desactive}
                            onChange={() => onChange(p)}
                            className="sr-only"
                        />
                        {LIBELLE_PORTEE[p]}
                    </label>
                );
            })}
        </div>
    );
}

// Une carte par module : cases, « Tout cocher / Tout décocher », portée des permissions de l'app.
export default function PermissionsGrille({ modules, selection, onChange, lectureSeule, porteeDefaut }) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {modules.map((m) => (
                <ModulePermissions
                    key={`${m.type}-${m.cle}`}
                    module={m}
                    selection={selection}
                    onChange={onChange}
                    lectureSeule={lectureSeule}
                    porteeDefaut={porteeDefaut}
                />
            ))}
        </div>
    );
}

function ModulePermissions({ module: m, selection, onChange, lectureSeule, porteeDefaut }) {
    const id = useId();
    const { coches, total, tout } = decompteModule(m, selection);
    const aPortee = m.permissions.some((p) => p.aPerimetre);
    const voir = m.permissions.find((p) => p.estVoir);
    const sansVoir = m.type === "BACKOFFICE" && voir && !(voir.code in selection);
    const lien = `inline-flex rounded px-1 text-sm font-medium text-blue-700 underline hover:text-blue-900 disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline ${FOCUS}`;

    return (
        <section aria-labelledby={`${id}-titre`} className="rounded bg-white p-4 shadow">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id={`${id}-titre`} className="text-base font-semibold text-gray-900">
                    {m.libelle}
                    <span className="ml-2 text-xs font-normal text-gray-500" aria-label={`${coches} sur ${total} cochées`}>
                        {coches}/{total}
                    </span>
                </h3>
                <div className="flex gap-2">
                    <button type="button" className={lien} disabled={lectureSeule || tout} onClick={() => onChange(toutCocher(selection, m, porteeDefaut))} aria-label={`Tout cocher dans ${m.libelle}`}>
                        Tout cocher
                    </button>
                    <button type="button" className={lien} disabled={lectureSeule || coches === 0} onClick={() => onChange(toutDecocher(selection, m))} aria-label={`Tout décocher dans ${m.libelle}`}>
                        Tout décocher
                    </button>
                </div>
            </div>
            {aPortee && (
                <p className="mt-2 rounded bg-indigo-50 px-2 py-1.5 text-xs text-indigo-900">
                    Pour chaque permission cochée, choisissez sa portée : <strong>Toutes les cellules</strong> ou{" "}
                    <strong>Sa cellule</strong> (uniquement la ou les cellules du compte).
                </p>
            )}
            {sansVoir && !lectureSeule && (
                <p className="mt-2 text-xs text-gray-600">Cochez « {voir.libelle} » pour activer les autres permissions du module.</p>
            )}
            <ul className="mt-3 divide-y divide-gray-100">
                {m.permissions.map((p) => {
                    const coche = p.code in selection;
                    const desactivee = lectureSeule || caseDesactivee(m, selection, p);
                    const idCase = `${id}-${p.code}`;
                    return (
                        <li key={p.code} className="flex flex-wrap items-center justify-between gap-2 py-2">
                            <label htmlFor={idCase} className={`flex min-w-0 items-center gap-2 text-sm ${desactivee ? "text-gray-400" : "text-gray-800"}`}>
                                <input
                                    id={idCase}
                                    type="checkbox"
                                    checked={coche}
                                    disabled={desactivee}
                                    onChange={() => onChange(basculer(selection, m, p, porteeDefaut))}
                                    className="size-4 shrink-0 accent-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                                />
                                <span className={p.estVoir ? "font-medium" : ""}>{p.libelle}</span>
                                {p.sensible && (
                                    <Pastille ton="ambre">
                                        <Lock className="mr-1 size-3" aria-hidden="true" />
                                        Sensible
                                    </Pastille>
                                )}
                            </label>
                            {p.aPerimetre && (
                                coche ? (
                                    <ChoixPortee
                                        libelle={p.libelle}
                                        valeur={selection[p.code]}
                                        desactive={lectureSeule}
                                        onChange={(portee) => onChange(changerPortee(selection, p.code, portee))}
                                    />
                                ) : (
                                    <span className="text-xs italic text-gray-400">Portée au moment de cocher</span>
                                )
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
