import React, { useId, useState } from "react";
import { GitMerge, Loader2, Search } from "lucide-react";
import { EtatErreur, Squelette } from "../statistiques/StatsUi";
import { AlerteErreur, BOUTON_PRIMAIRE, BOUTON_SECONDAIRE, CHAMP, Modale, Pastille } from "./ReferentielUi";
import {
    apercuFusion,
    fusionnerQuartier,
    useQuartiers,
    useRessemblants,
    useValeurRetardee,
} from "../../hooks/useReferentiel";
import { candidatsFusion, libelleStatut, phraseFusion, tonStatut } from "../../utils/referentiel";
import { libelleMembres } from "../../utils/repartition";

// Fusion d'un quartier dans un autre de la même commune : choix du quartier conservé, puis confirmation.

const LIMITE = 100;

function Contenu({ source, onFermer, onFusionne }) {
    const [recherche, setRecherche] = useState("");
    const q = useValeurRetardee(recherche);
    const liste = useQuartiers({ communeId: source.commune.id, q, limite: LIMITE });
    const proches = useRessemblants({ communeId: source.commune.id, nom: source.nom });
    const [cibleId, setCibleId] = useState(null);
    // apercu : réponse du serveur, affichée avant la confirmation.
    const [apercu, setApercu] = useState(null);
    const [etat, setEtat] = useState({ action: "", erreur: "" });
    const idRecherche = useId();
    const nomGroupe = useId();
    const occupe = etat.action !== "";

    const idsProches = new Set(proches.ressemblants.map((r) => r.id));
    const candidats = candidatsFusion(liste.data?.quartiers, source);
    // Les quartiers qui ressemblent au nom passent en tête.
    const tries = [...candidats].sort((a, b) => Number(idsProches.has(b.id)) - Number(idsProches.has(a.id)));
    const tronquee = (liste.data?.total ?? 0) > LIMITE;
    // Un quartier masqué par la recherche ne peut pas être confirmé.
    const cibleVisible = tries.some((c) => c.id === cibleId);

    const lancer = async (action, operation) => {
        if (occupe) return;
        setEtat({ action, erreur: "" });
        try {
            await operation();
            setEtat({ action: "", erreur: "" });
        } catch (err) {
            setEtat({ action: "", erreur: err.message || "Fusion impossible." });
        }
    };

    const continuer = () => lancer("apercu", async () => setApercu(await apercuFusion(source.id, cibleId)));
    const fusionner = () =>
        lancer("fusion", async () => onFusionne(await fusionnerQuartier(source.id, apercu.cible.id), source));

    if (apercu) {
        return (
            <div className="space-y-4">
                <div className="space-y-2 text-sm text-gray-700">
                    <p>
                        <span className="font-semibold">« {apercu.source.nom} »</span> sera fusionné dans{" "}
                        <span className="font-semibold">« {apercu.cible.nom} »</span>, le quartier conservé.
                    </p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-gray-50 p-3">
                        <dt className="text-gray-500">Commune</dt>
                        <dd className="font-medium text-gray-900">{apercu.commune.nom}</dd>
                        <dt className="text-gray-500">Membres concernés</dt>
                        <dd className="font-medium tabular-nums text-gray-900">{apercu.membresDeplaces}</dd>
                        <dt className="text-gray-500">Quartier conservé</dt>
                        <dd className="font-medium text-gray-900">
                            {apercu.cible.nom} ({libelleMembres(apercu.cible.membres)} avant la fusion)
                        </dd>
                    </dl>
                    <p>{phraseFusion(apercu)}</p>
                    <p>
                        « {apercu.source.nom} » sera supprimé et son nom sera reconnu comme une variante de «{" "}
                        {apercu.cible.nom} ». Cette action ne peut pas être annulée.
                    </p>
                </div>
                <AlerteErreur>{etat.erreur}</AlerteErreur>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className={BOUTON_SECONDAIRE}
                        onClick={() => {
                            setApercu(null);
                            setEtat({ action: "", erreur: "" });
                        }}
                        disabled={occupe}
                    >
                        Retour
                    </button>
                    <button type="button" className={BOUTON_PRIMAIRE} onClick={fusionner} disabled={occupe} aria-busy={occupe}>
                        {occupe ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <GitMerge className="size-4" aria-hidden="true" />
                        )}
                        Confirmer la fusion
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-gray-50 p-3 text-sm">
                <dt className="text-gray-500">Quartier à fusionner</dt>
                <dd className="flex flex-wrap items-center gap-2 font-medium text-gray-900">
                    {source.nom}
                    <Pastille ton={tonStatut(source.statut)}>{libelleStatut(source.statut)}</Pastille>
                </dd>
                <dt className="text-gray-500">Commune</dt>
                <dd className="font-medium text-gray-900">{source.commune.nom}</dd>
                <dt className="text-gray-500">Membres</dt>
                <dd className="font-medium tabular-nums text-gray-900">{source.membres}</dd>
            </dl>

            <fieldset>
                <legend className="text-sm font-medium text-gray-700">
                    Quartier à conserver (commune {source.commune.nom} uniquement)
                </legend>
                <div className="relative mt-2">
                    <label htmlFor={idRecherche} className="sr-only">
                        Rechercher un quartier de {source.commune.nom}
                    </label>
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <input
                        id={idRecherche}
                        type="search"
                        className={`${CHAMP} pl-9`}
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder={`Rechercher dans ${source.commune.nom}`}
                        autoComplete="off"
                    />
                </div>
                <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-200" aria-busy={liste.loading}>
                    {liste.loading && !liste.data ? (
                        <Squelette lignes={3} />
                    ) : liste.error ? (
                        <EtatErreur message={liste.error} onReessayer={liste.recharger} />
                    ) : tries.length === 0 ? (
                        <p className="px-3 py-4 text-center text-sm text-gray-500">
                            {q.trim()
                                ? "Aucun quartier de cette commune ne correspond."
                                : "Cette commune n'a pas d'autre quartier."}
                        </p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {tries.map((c) => (
                                <li key={c.id}>
                                    <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 focus-within:bg-blue-50">
                                        <input
                                            type="radio"
                                            name={nomGroupe}
                                            checked={cibleId === c.id}
                                            onChange={() => setCibleId(c.id)}
                                            className="size-4 shrink-0 accent-blue-600"
                                        />
                                        <span className="min-w-0 flex-1 break-words text-gray-900">{c.nom}</span>
                                        {idsProches.has(c.id) && <Pastille ton="ambre">Ressemble</Pastille>}
                                        {c.statut !== "VALIDE" && <Pastille ton="ambre">{libelleStatut(c.statut)}</Pastille>}
                                        <span className="shrink-0 text-xs tabular-nums text-gray-500">
                                            {libelleMembres(c.membres)}
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {tronquee && (
                    <p className="mt-1 text-xs text-gray-500">
                        Seuls les {LIMITE} premiers quartiers sont affichés : précisez la recherche.
                    </p>
                )}
            </fieldset>

            <AlerteErreur>{etat.erreur}</AlerteErreur>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer} disabled={occupe}>
                    Annuler
                </button>
                <button
                    type="button"
                    className={BOUTON_PRIMAIRE}
                    onClick={continuer}
                    disabled={occupe || !cibleVisible}
                    aria-busy={occupe}
                >
                    {occupe && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    Continuer
                </button>
            </div>
        </div>
    );
}

// `source` : quartier qui sera supprimé (null = modale fermée).
export default function FusionModal({ source, onFermer, onFusionne }) {
    return (
        <Modale
            ouvert={source !== null}
            titre="Fusionner le quartier"
            sousTitre="Les membres passent au quartier conservé."
            onFermer={onFermer}
        >
            {source !== null && <Contenu key={source.id} source={source} onFermer={onFermer} onFusionne={onFusionne} />}
        </Modale>
    );
}
