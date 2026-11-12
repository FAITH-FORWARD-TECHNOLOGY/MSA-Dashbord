import React, { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { FOCUS } from "../statistiques/StatsUi";
import { AlerteErreur, BOUTON_PRIMAIRE, BOUTON_SECONDAIRE, CHAMP, Champ, Modale, Pastille } from "./ReferentielUi";
import {
    creerQuartier,
    modifierQuartier,
    useCommunesDuPays,
    usePaysListe,
    useRessemblants,
    useValeurRetardee,
} from "../../hooks/useReferentiel";
import {
    erreurNom,
    libelleStatut,
    nettoyerNom,
    NOM_MAX,
    ressemblantIdentique,
    tonStatut,
} from "../../utils/referentiel";

// Création (pays, commune, nom) ou modification d'un quartier ; les ressemblants de la commune sont montrés avant.

function Ressemblants({ ressemblants, commune, chargement, onChoisir }) {
    const identique = ressemblantIdentique(ressemblants);
    return (
        <div aria-live="polite" aria-busy={chargement}>
            {ressemblants.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-900">
                        {identique
                            ? `Ce quartier existe déjà à ${commune}.`
                            : `Des quartiers de ${commune} ressemblent à ce nom.`}
                    </p>
                    <ul className="mt-2 space-y-1">
                        {ressemblants.map((r) => (
                            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                                <span className="inline-flex min-w-0 flex-wrap items-center gap-2 text-sm text-amber-900">
                                    <span className="break-words font-medium">{r.nom}</span>
                                    <Pastille ton={tonStatut(r.statut)}>{libelleStatut(r.statut)}</Pastille>
                                    {r.identique && <span className="text-xs">même quartier</span>}
                                </span>
                                {onChoisir && (
                                    <button
                                        type="button"
                                        onClick={() => onChoisir(r)}
                                        className={`rounded px-2 py-1 text-xs font-medium text-amber-900 underline hover:bg-amber-100 ${FOCUS}`}
                                        aria-label={`Utiliser le quartier ${r.nom}`}
                                    >
                                        Utiliser ce quartier
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function Formulaire({ quartier, paysParDefaut, communeParDefaut, onFermer, onEnregistre, onChoisirExistant }) {
    const [paysId, setPaysId] = useState(String(quartier?.pays?.id ?? paysParDefaut ?? ""));
    const [communeId, setCommuneId] = useState(String(quartier?.commune?.id ?? communeParDefaut ?? ""));
    const [nom, setNom] = useState(quartier?.nom ?? "");
    const [erreurs, setErreurs] = useState({});
    const [etat, setEtat] = useState({ envoi: false, erreur: "" });
    const paysApi = usePaysListe();
    const communesApi = useCommunesDuPays(paysId);
    const nomRetarde = useValeurRetardee(nom);
    // En modification, le quartier lui-même n'est pas un ressemblant.
    const recherche = useRessemblants({ communeId, nom: nomRetarde });
    const ressemblants = recherche.ressemblants.filter((r) => r.id !== quartier?.id);
    const identique = ressemblantIdentique(ressemblants);
    const idPays = useId();
    const idCommune = useId();
    const idNom = useId();
    const commune = communesApi.communes.find((c) => String(c.id) === communeId);
    // Commune d'origine absente de la liste (pays non renseigné) : elle reste proposée.
    const communeOrigine =
        quartier?.commune && !commune && String(quartier.commune.id) === communeId ? quartier.commune : null;

    const envoyer = async (e) => {
        e.preventDefault();
        // Ouverte depuis le formulaire d'un utilisateur : celui-ci ne doit pas être soumis.
        e.stopPropagation();
        const suite = {
            pays: paysId === "" && !communeOrigine ? "Choisissez un pays." : "",
            commune: communeId === "" ? "Choisissez une commune." : "",
            nom: erreurNom(nom),
        };
        setErreurs(suite);
        if (suite.pays || suite.commune || suite.nom || etat.envoi || identique) return;
        setEtat({ envoi: true, erreur: "" });
        try {
            const corps = { nom: nettoyerNom(nom), communeId: Number(communeId) };
            const resultat = quartier ? await modifierQuartier(quartier.id, corps) : await creerQuartier(corps);
            onEnregistre(resultat, Boolean(quartier));
        } catch (err) {
            setEtat({ envoi: false, erreur: err.message || "Enregistrement impossible." });
        }
    };

    return (
        <form onSubmit={envoyer} noValidate className="space-y-4">
            <Champ id={idPays} libelle="Pays" erreur={erreurs.pays || paysApi.error}>
                <select
                    id={idPays}
                    className={CHAMP}
                    value={paysId}
                    onChange={(e) => {
                        setPaysId(e.target.value);
                        setCommuneId("");
                    }}
                    aria-invalid={Boolean(erreurs.pays)}
                    aria-describedby={erreurs.pays ? `${idPays}-erreur` : undefined}
                >
                    <option value="">Choisir un pays…</option>
                    {paysApi.pays.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                            {p.nom}
                        </option>
                    ))}
                </select>
            </Champ>
            <Champ
                id={idCommune}
                libelle="Commune"
                erreur={erreurs.commune || communesApi.error}
                aide={
                    paysId === ""
                        ? "Choisissez d'abord le pays."
                        : !communesApi.loading && communesApi.communes.length === 0
                          ? "Aucune commune dans ce pays : ajoutez-la depuis le menu Communes."
                          : undefined
                }
            >
                <select
                    id={idCommune}
                    className={CHAMP}
                    value={communeId}
                    onChange={(e) => setCommuneId(e.target.value)}
                    disabled={(paysId === "" && !communeOrigine) || communesApi.loading}
                    aria-invalid={Boolean(erreurs.commune)}
                    aria-describedby={erreurs.commune || communesApi.error ? `${idCommune}-erreur` : undefined}
                >
                    <option value="">{communesApi.loading ? "Chargement…" : "Choisir une commune…"}</option>
                    {communeOrigine && <option value={String(communeOrigine.id)}>{communeOrigine.nom}</option>}
                    {communesApi.communes.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                            {c.nom}
                        </option>
                    ))}
                </select>
            </Champ>
            <Champ id={idNom} libelle="Nom du quartier" erreur={erreurs.nom}>
                <input
                    id={idNom}
                    type="text"
                    className={CHAMP}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    maxLength={NOM_MAX}
                    autoComplete="off"
                    disabled={communeId === ""}
                    aria-invalid={Boolean(erreurs.nom)}
                    aria-describedby={erreurs.nom ? `${idNom}-erreur` : undefined}
                />
            </Champ>
            <Ressemblants
                ressemblants={ressemblants}
                commune={commune?.nom ?? communeOrigine?.nom ?? "cette commune"}
                chargement={recherche.loading}
                onChoisir={
                    onChoisirExistant
                        ? (r) => onChoisirExistant({ ...r, commune: commune ?? communeOrigine ?? null })
                        : undefined
                }
            />
            <AlerteErreur>{etat.erreur}</AlerteErreur>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer} disabled={etat.envoi}>
                    Annuler
                </button>
                <button
                    type="submit"
                    className={BOUTON_PRIMAIRE}
                    disabled={etat.envoi || Boolean(identique)}
                    aria-busy={etat.envoi}
                >
                    {etat.envoi && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {quartier ? "Enregistrer" : ressemblants.length > 0 ? "Créer quand même" : "Créer le quartier"}
                </button>
            </div>
        </form>
    );
}

// `cible` : null (fermée), {} (création) ou quartier à modifier ; `onChoisirExistant` propose un ressemblant.
export default function QuartierFormModal({
    cible,
    titre,
    paysParDefaut,
    communeParDefaut,
    onFermer,
    onEnregistre,
    onChoisirExistant,
}) {
    const quartier = cible?.id ? cible : null;
    return (
        <Modale
            ouvert={cible !== null}
            titre={titre ?? (quartier ? "Modifier le quartier" : "Ajouter un quartier")}
            sousTitre={quartier ? `${quartier.nom}, ${quartier.commune?.nom ?? ""}` : "Pays, puis commune, puis nom du quartier."}
            onFermer={onFermer}
        >
            {cible !== null && (
                <Formulaire
                    key={quartier?.id ?? "nouveau"}
                    quartier={quartier}
                    paysParDefaut={paysParDefaut}
                    communeParDefaut={communeParDefaut}
                    onFermer={onFermer}
                    onEnregistre={onEnregistre}
                    onChoisirExistant={onChoisirExistant}
                />
            )}
        </Modale>
    );
}
