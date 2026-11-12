import { useId, useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronDown, RefreshCw, Search } from "lucide-react";
import { FOCUS } from "./StatsUi";
import {
    basculerCellule,
    filtrerCellules,
    LIBELLE_TOUTES,
    libelleCellules,
    MAX_CELLULES,
} from "./cellulesFiltre";

// Même gabarit que les champs de date voisins (hauteur, bordure, focus).
const BOUTON =
    "flex w-full h-10 items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

const LIGNE =
    "flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus-within:bg-blue-50";

const CASE = "h-4 w-4 shrink-0 accent-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1";

// Contenu de la liste ; monté à l'ouverture, donc la recherche repart de zéro.
function Panneau({ cellules, selection, onChange }) {
    const [recherche, setRecherche] = useState("");
    const idListe = useId();
    const visibles = filtrerCellules(cellules, recherche);
    const choisies = new Set(selection.map(Number));
    const pleine = selection.length >= MAX_CELLULES;

    // Flèches, Début et Fin déplacent le focus entre la recherche et les cases.
    const surTouche = (e) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
        const dansRecherche = e.target.type === "search";
        if (dansRecherche && e.key !== "ArrowDown") return;
        const champs = [...e.currentTarget.querySelectorAll("input:not(:disabled)")];
        const i = champs.indexOf(e.target);
        if (i === -1) return;
        let cible = i;
        if (e.key === "ArrowDown") cible = Math.min(i + 1, champs.length - 1);
        else if (e.key === "ArrowUp") cible = Math.max(i - 1, 0);
        else if (e.key === "Home") cible = Math.min(1, champs.length - 1);
        else cible = champs.length - 1;
        e.preventDefault();
        champs[cible]?.focus();
    };

    return (
        <div onKeyDown={surTouche}>
            <div className="relative border-b border-gray-200 p-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <input
                    type="search"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Rechercher une cellule"
                    aria-label="Rechercher une cellule"
                    aria-controls={idListe}
                    autoComplete="off"
                    className="block w-full h-9 rounded-md border border-gray-300 bg-white pl-8 pr-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div id={idListe} role="group" aria-label="Cellules à afficher" className="max-h-60 overflow-y-auto p-1">
                <label className={`${LIGNE} font-medium text-gray-800`}>
                    <input
                        type="checkbox"
                        checked={selection.length === 0}
                        onChange={() => onChange([])}
                        className={CASE}
                    />
                    {LIBELLE_TOUTES}
                </label>
                {visibles.map((c) => {
                    const cochee = choisies.has(Number(c.id));
                    return (
                        <label key={c.id} className={`${LIGNE} ${pleine && !cochee ? "opacity-50" : ""}`}>
                            <input
                                type="checkbox"
                                checked={cochee}
                                disabled={pleine && !cochee}
                                onChange={() => onChange(basculerCellule(selection, c.id, cellules))}
                                className={CASE}
                            />
                            <span className="min-w-0 break-words">{c.name}</span>
                        </label>
                    );
                })}
            </div>
            {/* Région toujours présente : résultat de la recherche et sélection annoncés. */}
            <div role="status" aria-live="polite" className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
                {visibles.length === 0 ? (
                    <p>Aucune cellule ne correspond à « {recherche.trim()} ».</p>
                ) : (
                    <p>
                        {selection.length === 0
                            ? `${LIBELLE_TOUTES} (${cellules.length})`
                            : `${selection.length} sur ${cellules.length} sélectionnée${selection.length > 1 ? "s" : ""}`}
                        {pleine && ` · ${MAX_CELLULES} cellules au plus`}
                    </p>
                )}
            </div>
        </div>
    );
}

// Filtre « Cellules » : liste déroulante à cases à cocher ; selection [] = toutes.
export default function CellulesMultiSelect({
    cellules,
    selection,
    onChange,
    libelle = "Cellules",
    classeLibelle = "block text-sm font-medium text-gray-700 mb-1",
    chargement = false,
    erreur = "",
    onReessayer,
    aide,
}) {
    const id = useId();
    const vide = !chargement && !erreur && cellules.length === 0;
    const resume = chargement
        ? "Chargement des cellules…"
        : vide
          ? "Aucune cellule"
          : libelleCellules(selection, cellules);

    return (
        <div>
            <label id={`${id}-libelle`} htmlFor={`${id}-bouton`} className={classeLibelle}>
                {libelle}
            </label>
            <Popover className="relative">
                {({ open }) => (
                    <>
                        <PopoverButton
                            id={`${id}-bouton`}
                            disabled={chargement || vide || Boolean(erreur)}
                            aria-labelledby={`${id}-libelle ${id}-resume`}
                            aria-describedby={aide ? `${id}-aide` : undefined}
                            aria-busy={chargement}
                            // Flèche bas ouvre la liste, comme un menu déroulant natif.
                            onKeyDown={(e) => {
                                if (e.key === "ArrowDown" && !open) {
                                    e.preventDefault();
                                    e.currentTarget.click();
                                }
                            }}
                            className={BOUTON}
                        >
                            <span id={`${id}-resume`} className="min-w-0 truncate">
                                {resume}
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
                                aria-hidden="true"
                            />
                        </PopoverButton>
                        <PopoverPanel
                            focus
                            className="absolute right-0 z-20 mt-1 w-full min-w-64 max-w-[calc(100vw-2rem)] rounded-md border border-gray-200 bg-white shadow-lg focus:outline-none"
                        >
                            <Panneau cellules={cellules} selection={selection} onChange={onChange} />
                        </PopoverPanel>
                    </>
                )}
            </Popover>
            {aide && (
                <p id={`${id}-aide`} className="mt-1 text-xs text-gray-500">
                    {aide}
                </p>
            )}
            {erreur && (
                <div role="alert" className="mt-1 flex flex-wrap items-center gap-2 text-sm text-red-600">
                    <span>{erreur}</span>
                    {onReessayer && (
                        <button
                            type="button"
                            onClick={() => onReessayer()}
                            className={`inline-flex items-center gap-1 rounded font-medium underline ${FOCUS}`}
                        >
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                            Réessayer
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
