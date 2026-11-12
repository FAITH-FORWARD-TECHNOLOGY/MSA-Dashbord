import React, { useId, useState } from "react";
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { Home, Plus, X } from "lucide-react";
import { FOCUS } from "../statistiques/StatsUi";
import { Pastille } from "./ReferentielUi";
import QuartierFormModal from "./QuartierFormModal";
import { useRechercheQuartiers, useValeurRetardee } from "../../hooks/useReferentiel";
import { useAuth } from "../../hooks/useAuth";
import {
    libelleFiltreQuartier,
    libelleStatut,
    MAX_RESULTATS,
    nettoyerNom,
    NOM_MIN,
    SANS_QUARTIER,
    STATUT_EN_ATTENTE,
} from "../../utils/referentiel";

// Champ « Quartier » avec recherche (8 résultats au plus) ; `value` : { id, nom, commune }, SANS_QUARTIER (filtre) ou null.

const OPTION =
    "flex cursor-pointer flex-col px-3 py-2 text-sm text-gray-800 data-[focus]:bg-blue-50 data-[selected]:font-semibold";

export default function QuartierResidenceField({
    value,
    onChange,
    libelle = "Quartier de résidence",
    classeLibelle = "block text-sm font-medium text-gray-700 mb-2",
    placeholder = "Rechercher un quartier",
    filtre = false,
    creation = false,
    aide,
    icone = true,
}) {
    const [saisie, setSaisie] = useState("");
    const [creationOuverte, setCreationOuverte] = useState(false);
    const propre = nettoyerNom(saisie);
    const q = useValeurRetardee(propre);
    const assezLong = propre.length >= NOM_MIN;
    const { user } = useAuth();
    const estAdmin = user?.role === "ADMIN";
    // Admin : liste admin, qui trouve aussi les quartiers en attente.
    const recherche = useRechercheQuartiers({ q }, q.length >= NOM_MIN, estAdmin);
    // Tant que la requête de la saisie courante n'est pas revenue, aucun ancien résultat n'est proposé.
    const loading = recherche.loading || q !== propre;
    const { quartiers, tronquee, error } = recherche;
    // La création d'un quartier passe par une route réservée aux admins.
    const peutCreer = creation && estAdmin;
    const id = useId();

    const message = !assezLong
        ? `Tapez au moins ${NOM_MIN} caractères.`
        : loading
          ? "Recherche…"
          : error
            ? error
            : quartiers.length === 0
              ? `Aucun quartier trouvé pour « ${q} ».`
              : tronquee
                ? `${MAX_RESULTATS} premiers résultats : précisez la recherche si besoin.`
                : "";

    return (
        <div>
            <label htmlFor={id} className={classeLibelle}>
                {icone && <Home className="mr-1 inline size-4" aria-hidden="true" />}
                {libelle}
            </label>
            <Combobox
                value={value}
                onChange={(choix) => onChange(choix ?? null)}
                onClose={() => setSaisie("")}
                by={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
                immediate
            >
                <div className="relative">
                    <ComboboxInput
                        id={id}
                        displayValue={(choix) => libelleFiltreQuartier(choix)}
                        onChange={(e) => setSaisie(e.target.value)}
                        placeholder={placeholder}
                        autoComplete="off"
                        aria-describedby={aide ? `${id}-aide` : undefined}
                        className="block h-10 w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            aria-label={filtre ? "Retirer le filtre par quartier" : "Retirer le quartier"}
                            className={`absolute right-1 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${FOCUS}`}
                        >
                            <X className="size-4" aria-hidden="true" />
                        </button>
                    )}
                </div>
                <ComboboxOptions
                    anchor="bottom start"
                    className="z-[70] max-h-72 w-[var(--input-width)] overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg [--anchor-gap:4px] empty:invisible"
                >
                    {filtre && !assezLong && (
                        <ComboboxOption value={SANS_QUARTIER} className={OPTION}>
                            <span className="italic">Sans quartier renseigné</span>
                            <span className="text-xs text-gray-500">Aucun lieu, ou commune seule</span>
                        </ComboboxOption>
                    )}
                    {assezLong &&
                        !loading &&
                        quartiers.map((z) => (
                            <ComboboxOption key={z.id} value={z} className={OPTION}>
                                <span className="flex flex-wrap items-center gap-2">
                                    <span className="break-words">{z.nom}</span>
                                    {z.statut === STATUT_EN_ATTENTE && (
                                        <Pastille ton="ambre">{libelleStatut(z.statut)}</Pastille>
                                    )}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {[z.commune?.nom, z.pays?.nom].filter(Boolean).join(", ")}
                                </span>
                            </ComboboxOption>
                        ))}
                    {message && (
                        <div role="presentation" className="px-3 py-2 text-xs text-gray-500">
                            {message}
                        </div>
                    )}
                </ComboboxOptions>
            </Combobox>
            <span className="sr-only" role="status" aria-live="polite">
                {saisie ? message : ""}
            </span>
            {value && value !== SANS_QUARTIER && value.statut === STATUT_EN_ATTENTE && (
                <p className="mt-1">
                    <Pastille ton="ambre">{libelleStatut(value.statut)}</Pastille>
                </p>
            )}
            {aide && (
                <p id={`${id}-aide`} className="mt-1 text-xs text-gray-500">
                    {aide}
                </p>
            )}
            {peutCreer && (
                <>
                    <button
                        type="button"
                        onClick={() => setCreationOuverte(true)}
                        className={`mt-2 inline-flex min-h-9 items-center gap-1.5 rounded text-sm font-medium text-blue-700 hover:underline ${FOCUS}`}
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        Créer un nouveau quartier
                    </button>
                    <QuartierFormModal
                        cible={creationOuverte ? {} : null}
                        titre="Créer un nouveau quartier"
                        onFermer={() => setCreationOuverte(false)}
                        onEnregistre={(quartier) => {
                            setCreationOuverte(false);
                            onChange(quartier);
                        }}
                        onChoisirExistant={(quartier) => {
                            setCreationOuverte(false);
                            onChange(quartier);
                        }}
                    />
                </>
            )}
        </div>
    );
}
