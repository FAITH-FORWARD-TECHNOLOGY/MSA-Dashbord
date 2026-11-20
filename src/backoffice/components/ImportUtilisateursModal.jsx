import React, { useEffect, useId, useState } from "react";
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { CheckCircle2, Download, Loader2, Upload } from "lucide-react";
import { FOCUS } from "./statistiques/StatsUi";
import { AlerteErreur, BOUTON_EXPORT, BOUTON_PRIMAIRE, BOUTON_SECONDAIRE, CHAMP, Champ, ENTETE_TABLEAU, Modale } from "./referentiel/ReferentielUi";
import { usePays } from "../hooks/usePays";
import { useCellules } from "../hooks/useCellules";
import { envoyerImportUtilisateurs, telechargerModeleUtilisateurs } from "../hooks/useImportUtilisateurs";
import { telechargerRapport } from "../hooks/useReferentiel";
import {
    cellulesActives,
    erreurFichierUtilisateurs,
    filtrerCellules,
    formulaireImportValide,
    MESSAGE_MDP_FAIBLE,
    motDePasseCommunFaible,
    paysParDefaut,
} from "../utils/importUtilisateurs";
import { erreursMotDePasse } from "../utils/motDePasse";

// Fenêtre d'import : modèle, cellule et pays, mot de passe commun, fichier, puis rapport.

const COMPTEUR = "rounded-lg border px-3 py-2";

function Squelette() {
    return (
        <div className="space-y-3" role="status" aria-label="Chargement des cellules et des pays">
            {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-gray-100" />
            ))}
        </div>
    );
}

function Rapport({ resultat, onFermer }) {
    const { total, crees, refuses, rejets = [], sansQuartier = [], rapport } = resultat;
    // La zone vivante est montée vide, puis remplie : sinon le lecteur d'écran ne l'annonce pas.
    const [annonce, setAnnonce] = useState("");
    useEffect(() => {
        setAnnonce("Import terminé.");
    }, []);
    return (
        <div className="space-y-4">
            <div aria-live="polite" className="flex items-start gap-2 text-sm font-medium text-green-700">
                {annonce && (
                    <>
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <p>{annonce}</p>
                    </>
                )}
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className={`${COMPTEUR} border-gray-200 bg-gray-50 text-gray-800`}>
                    <span className="block text-2xl font-bold tabular-nums">{total}</span>
                    <span className="block text-sm">{total > 1 ? "lignes lues" : "ligne lue"}</span>
                </div>
                <div className={`${COMPTEUR} border-green-200 bg-green-50 text-green-900`}>
                    <span className="block text-2xl font-bold tabular-nums">{crees}</span>
                    <span className="block text-sm">{crees > 1 ? "comptes créés" : "compte créé"}</span>
                </div>
                <div className={`${COMPTEUR} ${refuses ? "border-red-200 bg-red-50 text-red-900" : "border-gray-200 bg-gray-50 text-gray-800"}`}>
                    <span className="block text-2xl font-bold tabular-nums">{refuses}</span>
                    <span className="block text-sm">{refuses > 1 ? "refusés" : "refusé"}</span>
                </div>
            </div>
            {sansQuartier.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-800">
                        {sansQuartier.length} {sansQuartier.length > 1 ? "comptes créés" : "compte créé"} sans quartier (non reconnu)
                    </p>
                    <div className="max-h-48 overflow-auto rounded-md border border-amber-200">
                        <table className="min-w-full text-sm">
                            <caption className="sr-only">Comptes créés sans quartier</caption>
                            <thead className="sticky top-0">
                                <tr className={ENTETE_TABLEAU}>
                                    <th scope="col" className="px-3 py-2">Ligne</th>
                                    <th scope="col" className="px-3 py-2">Nom</th>
                                    <th scope="col" className="px-3 py-2">E-mail</th>
                                    <th scope="col" className="px-3 py-2">Quartier</th>
                                    <th scope="col" className="px-3 py-2">Raison</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sansQuartier.map((r) => (
                                    <tr key={r.ligne} className="align-top">
                                        <td className="px-3 py-2 tabular-nums text-gray-500">{r.ligne}</td>
                                        <td className="px-3 py-2 text-gray-800">{r.nom || "—"}</td>
                                        <td className="break-all px-3 py-2 text-gray-800">{r.email || "—"}</td>
                                        <td className="px-3 py-2 text-gray-800">{r.quartier || "—"}</td>
                                        <td className="px-3 py-2 text-amber-800">{r.raison === "ambigu" ? "Ambigu" : "Inconnu"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {rejets.length > 0 && (
                <div className="max-h-72 overflow-auto rounded-md border border-gray-200">
                    <table className="min-w-full text-sm">
                        <caption className="sr-only">Lignes refusées et motif</caption>
                        <thead className="sticky top-0">
                            <tr className={ENTETE_TABLEAU}>
                                <th scope="col" className="px-3 py-2">Ligne</th>
                                <th scope="col" className="px-3 py-2">Nom</th>
                                <th scope="col" className="px-3 py-2">E-mail</th>
                                <th scope="col" className="px-3 py-2">Téléphone</th>
                                <th scope="col" className="px-3 py-2">Motif</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rejets.map((r) => (
                                <tr key={r.ligne} className="align-top">
                                    <td className="px-3 py-2 tabular-nums text-gray-500">{r.ligne}</td>
                                    <td className="px-3 py-2 text-gray-800">{r.nom || "—"}</td>
                                    <td className="break-all px-3 py-2 text-gray-800">{r.email || "—"}</td>
                                    <td className="px-3 py-2 text-gray-800">{r.telephone || "—"}</td>
                                    <td className="px-3 py-2 text-red-700">{r.motif}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer}>
                    Fermer
                </button>
                {rapport && (
                    <button type="button" className={BOUTON_EXPORT} onClick={() => telechargerRapport(rapport)}>
                        <Download className="size-4" aria-hidden="true" />
                        Télécharger le rapport (lignes refusées et sans quartier)
                    </button>
                )}
            </div>
        </div>
    );
}

function Contenu({ onFermer, onImporte, onOccupe }) {
    const { pays, loading: paysEnCours, error: erreurPays } = usePays();
    const { cellules, loading: cellulesEnCours, error: erreurCellules } = useCellules();
    const actives = cellulesActives(cellules);
    const [celluleId, setCelluleId] = useState("");
    const [recherche, setRecherche] = useState("");
    const [paysId, setPaysId] = useState("");
    const [motDePasse, setMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [touche, setTouche] = useState(false);
    const [fichier, setFichier] = useState(null);
    const [erreur, setErreur] = useState("");
    const [action, setAction] = useState("");
    const [resultat, setResultat] = useState(null);
    const idCellule = useId();
    const idPays = useId();
    const idMdp = useId();
    const idConf = useId();
    const idFichier = useId();
    const occupe = action !== "";
    const chargement = paysEnCours || cellulesEnCours;

    // Pays par défaut une fois la liste reçue.
    useEffect(() => {
        if (paysId === "" && pays.length > 0) setPaysId(paysParDefaut(pays));
    }, [pays, paysId]);

    const celluleChoisie = actives.find((c) => c.id === celluleId) ?? null;
    const propositions = filtrerCellules(actives, recherche);
    const erreursMdp = erreursMotDePasse(motDePasse, confirmation);
    if (!erreursMdp.mdp && motDePasseCommunFaible(motDePasse)) erreursMdp.mdp = MESSAGE_MDP_FAIBLE;
    const valide = formulaireImportValide({ celluleId, paysId, motDePasse, confirmation, fichier });

    const modele = async () => {
        if (occupe) return;
        setAction("modele");
        setErreur("");
        try {
            await telechargerModeleUtilisateurs();
        } catch (err) {
            setErreur(err.message || "Téléchargement impossible.");
        } finally {
            setAction("");
        }
    };

    const importer = async () => {
        setTouche(true);
        if (!valide || occupe) return;
        setAction("import");
        onOccupe(true);
        setErreur("");
        try {
            const r = await envoyerImportUtilisateurs(fichier, { celluleId, paysId, motDePasse });
            // Le mot de passe n'est plus gardé une fois l'envoi fait.
            setMotDePasse("");
            setConfirmation("");
            setResultat(r);
            onImporte(r);
        } catch (err) {
            setErreur(err.message || "Import impossible.");
        } finally {
            setAction("");
            onOccupe(false);
        }
    };

    if (resultat) return <Rapport resultat={resultat} onFermer={onFermer} />;
    if (chargement) return <Squelette />;
    if (erreurPays || erreurCellules) {
        return (
            <div className="space-y-4">
                <AlerteErreur>{erreurPays || erreurCellules}</AlerteErreur>
                <div className="flex justify-end">
                    <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer}>
                        Fermer
                    </button>
                </div>
            </div>
        );
    }
    if (actives.length === 0) {
        return (
            <div className="space-y-4">
                <p className="rounded-md bg-gray-50 px-3 py-4 text-center text-sm text-gray-600">
                    Aucune cellule active : créez ou activez une cellule avant d'importer des utilisateurs.
                </p>
                <div className="flex justify-end">
                    <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer}>
                        Fermer
                    </button>
                </div>
            </div>
        );
    }

    const erreurFichier = touche ? erreurFichierUtilisateurs(fichier) : "";
    return (
        <form
            className="space-y-4"
            noValidate
            onSubmit={(e) => {
                e.preventDefault();
                importer();
            }}
        >
            <p className="text-sm text-gray-700">
                Colonnes du fichier : <span className="font-medium">nom, prenom, email, telephone, quartier</span> (nom, e-mail et
                téléphone obligatoires). Les comptes déjà existants sont refusés et listés à la fin.
            </p>
            <button type="button" className={BOUTON_SECONDAIRE} onClick={modele} disabled={occupe} aria-busy={action === "modele"}>
                {action === "modele" ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                    <Download className="size-4" aria-hidden="true" />
                )}
                Télécharger le modèle
            </button>

            <Champ id={idCellule} libelle="Cellule" erreur={touche && !celluleId ? "Choisissez une cellule." : ""} aide="Cellules actives uniquement.">
                <Combobox
                    value={celluleChoisie}
                    onChange={(c) => setCelluleId(c?.id ?? "")}
                    onClose={() => setRecherche("")}
                    disabled={occupe}
                >
                    <ComboboxInput
                        id={idCellule}
                        className={CHAMP}
                        placeholder="Rechercher une cellule"
                        displayValue={(c) => c?.name ?? ""}
                        onChange={(e) => setRecherche(e.target.value)}
                        autoComplete="off"
                    />
                    <ComboboxOptions
                        anchor="bottom start"
                        className="z-[70] max-h-60 w-[var(--input-width)] overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg empty:invisible"
                    >
                        {propositions.map((c) => (
                            <ComboboxOption
                                key={c.id}
                                value={c}
                                className="cursor-pointer px-3 py-2 text-sm text-gray-800 data-[focus]:bg-blue-50 data-[selected]:font-semibold"
                            >
                                {c.name}
                            </ComboboxOption>
                        ))}
                    </ComboboxOptions>
                </Combobox>
                {propositions.length === 0 && (
                    <p role="status" className="mt-1 text-sm text-gray-500">
                        Aucune cellule trouvée.
                    </p>
                )}
            </Champ>

            <Champ id={idPays} libelle="Pays" erreur={touche && !paysId ? "Choisissez un pays." : ""}>
                <select id={idPays} className={CHAMP} value={paysId} onChange={(e) => setPaysId(Number(e.target.value))} disabled={occupe}>
                    {pays.length === 0 && <option value="">Aucun pays</option>}
                    {pays.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.nom}
                        </option>
                    ))}
                </select>
            </Champ>

            <fieldset className="space-y-3 rounded-md border border-gray-200 p-3">
                <legend className="px-1 text-sm font-medium text-gray-700">Mot de passe commun</legend>
                <p className="text-xs text-gray-500">
                    Appliqué à tous les comptes créés. À communiquer aux membres ; ils pourront le changer.
                </p>
                <Champ id={idMdp} libelle="Mot de passe" erreur={touche ? erreursMdp.mdp : ""} aide="10 caractères au moins, avec une lettre et un chiffre, sans suite évidente ni mot comme msa ou jesus.">
                    <input
                        id={idMdp}
                        type="password"
                        autoComplete="new-password"
                        className={CHAMP}
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        disabled={occupe}
                        aria-invalid={touche && Boolean(erreursMdp.mdp)}
                    />
                </Champ>
                <Champ id={idConf} libelle="Confirmer le mot de passe" erreur={touche ? erreursMdp.confirmation : ""}>
                    <input
                        id={idConf}
                        type="password"
                        autoComplete="new-password"
                        className={CHAMP}
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        disabled={occupe}
                        aria-invalid={touche && Boolean(erreursMdp.confirmation)}
                    />
                </Champ>
            </fieldset>

            <Champ id={idFichier} libelle="Fichier CSV" erreur={erreurFichier} aide="2 Mo et 5 000 lignes au plus. CSV en UTF-8, séparateur « ; » ou « , »">
                <input
                    id={idFichier}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                    disabled={occupe}
                    className={`block w-full rounded-md border border-gray-300 bg-white text-sm text-gray-800 file:mr-3 file:h-10 file:border-0 file:bg-gray-100 file:px-3 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 ${FOCUS}`}
                />
            </Champ>

            <AlerteErreur>{erreur}</AlerteErreur>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer} disabled={occupe}>
                    Annuler
                </button>
                <button type="submit" className={BOUTON_PRIMAIRE} disabled={occupe || (touche && !valide)} aria-busy={action === "import"}>
                    {action === "import" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <Upload className="size-4" aria-hidden="true" />
                    )}
                    {action === "import" ? "Import en cours…" : "Importer"}
                </button>
            </div>
        </form>
    );
}

// `onImporte` reçoit le résultat : la liste des utilisateurs se recharge.
export default function ImportUtilisateursModal({ ouvert, onFermer, onImporte }) {
    const [occupe, setOccupe] = useState(false);
    return (
        <Modale ouvert={ouvert} bloquee={occupe} titre="Importer des utilisateurs" sousTitre="Fichier CSV" onFermer={onFermer} large>
            {ouvert && <Contenu onFermer={onFermer} onImporte={onImporte} onOccupe={setOccupe} />}
        </Modale>
    );
}
