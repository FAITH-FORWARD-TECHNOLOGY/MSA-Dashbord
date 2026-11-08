import React, { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Loader2, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { FOCUS } from "./StatsUi";
import { dateLongue, pluriel } from "./format";
import { corpsJourNa, erreursJourNa, estConflitPresences, MOTIF_MAX } from "./joursNa";

// Modales des jours NA : formulaire (création / modification) et détail.

const CHAMP =
    "block w-full px-3 py-2 border rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500";
const BORDURE = (erreur) => (erreur ? "border-red-500" : "border-gray-300");
const BOUTON =
    "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
const BOUTON_SECONDAIRE = `${BOUTON} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ${FOCUS}`;
const BOUTON_PRIMAIRE = `${BOUTON} bg-blue-600 text-white hover:bg-blue-700 ${FOCUS}`;
const BOUTON_DANGER = `${BOUTON} bg-red-600 text-white hover:bg-red-700 ${FOCUS}`;
const BOUTON_ALERTE = `${BOUTON} bg-amber-600 text-white hover:bg-amber-700 ${FOCUS}`;

const SELECTEUR_FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const focusables = (racine) =>
    racine ? [...racine.querySelectorAll(SELECTEUR_FOCUSABLE)] : [];

// Focus perdu : sur body, hors du panneau, sur le panneau lui-même ou sur un contrôle désactivé.
const focusPerdu = (racine) => {
    const actif = document.activeElement;
    return !racine || !actif || actif === racine || !racine.contains(actif) || actif.matches(":disabled");
};

// Coquille de modale : focus piégé (écoute au niveau du document), Échap ferme, focus rendu à l'appelant.
function Modale({ titre, onFermer, fermable = true, occupe = false, apresOccupe, origine, retourFocus, refPanneau, children }) {
    const panneauInterne = useRef(null);
    const panneau = refPanneau ?? panneauInterne;
    const titreId = useId();
    // Dernières valeurs lues par l'écouteur clavier et l'effet « occupé ».
    const etat = useRef({ onFermer, fermable, apresOccupe });
    useEffect(() => {
        etat.current = { onFermer, fermable, apresOccupe };
    });

    useEffect(() => {
        const precedent = origine ?? document.activeElement;
        const secours = retourFocus?.current;
        const cible =
            panneau.current?.querySelector("[data-autofocus]:not([disabled])") ??
            focusables(panneau.current)[0];
        cible?.focus();
        return () => {
            // L'élément d'origine peut avoir disparu (tableau rechargé).
            const garde = precedent?.isConnected && precedent !== document.body;
            (garde ? precedent : secours)?.focus?.();
        };
    }, [origine, retourFocus, panneau]);

    // Écoute sur le document : marche même si le focus est tombé sur body.
    useEffect(() => {
        const surTouche = (e) => {
            const racine = panneau.current;
            if (!racine) return;
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                if (etat.current.fermable) etat.current.onFermer();
                return;
            }
            if (e.key !== "Tab") return;
            const liste = focusables(racine);
            if (liste.length === 0) {
                e.preventDefault();
                racine.focus();
                return;
            }
            const premier = liste[0];
            const dernier = liste[liste.length - 1];
            const actif = document.activeElement;
            if (actif === racine || !racine.contains(actif)) {
                e.preventDefault();
                (e.shiftKey ? dernier : premier).focus();
            } else if (e.shiftKey && actif === premier) {
                e.preventDefault();
                dernier.focus();
            } else if (!e.shiftKey && actif === dernier) {
                e.preventDefault();
                premier.focus();
            }
        };
        document.addEventListener("keydown", surTouche, true);
        return () => document.removeEventListener("keydown", surTouche, true);
    }, [panneau]);

    // Contrôles désactivés : le focus se garde sur le panneau, puis revient sur la cible choisie.
    const etaitOccupe = useRef(false);
    useEffect(() => {
        const racine = panneau.current;
        if (occupe) {
            if (focusPerdu(racine)) racine?.focus();
        } else if (etaitOccupe.current && focusPerdu(racine)) {
            const cible = etat.current.apresOccupe?.();
            const valide = cible?.isConnected && !cible.matches(":disabled");
            (valide
                ? cible
                : racine?.querySelector("[data-autofocus]:not([disabled])") ?? focusables(racine)[0] ?? racine
            )?.focus();
        }
        etaitOccupe.current = occupe;
    }, [occupe, panneau]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && fermable) onFermer();
            }}
        >
            <div
                ref={panneau}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titreId}
                aria-busy={occupe}
                tabIndex={-1}
                className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl focus:outline-none"
            >
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                    <h3 id={titreId} className="text-lg font-bold text-gray-800">
                        {titre}
                    </h3>
                    <button
                        type="button"
                        onClick={onFermer}
                        disabled={!fermable}
                        aria-label="Fermer"
                        className={`rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 ${FOCUS}`}
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
}

// Avertissement 409 : cellules dont des présences sont déjà saisies.
function AvertissementPresences({ cellules }) {
    return (
        <div
            role="alert"
            className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
            <p className="flex items-start gap-2 font-medium">
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                Des présences sont déjà saisies ce jour-là :
            </p>
            <ul className="mt-2 ml-7 list-disc space-y-0.5">
                {cellules.map((c) => (
                    <li key={c.id}>
                        {c.name} — {pluriel(c.presents ?? 0, "présent")}
                    </li>
                ))}
            </ul>
            <p className="mt-2 ml-7">
                Ces cases passeront en NA (le nombre de présents reste visible) et
                sortiront du taux de régularité.
            </p>
        </div>
    );
}

// Formulaire de création (jour = null) ou de modification d'un jour NA.
export function JourNaFormModal({ jour, cellules, dateInitiale, onEnregistrer, onFermer, retourFocus }) {
    const edition = Boolean(jour);
    const ids = useId();
    const idsJour = (jour?.cellules ?? []).map((c) => c.id);
    const [date, setDate] = useState(jour?.date ?? dateInitiale ?? "");
    const [motif, setMotif] = useState(jour?.motif ?? "");
    const [portee, setPortee] = useState(
        !edition || jour.toutesMesCellules ? "toutes" : "choisies"
    );
    const [choix, setChoix] = useState(() => new Set(idsJour));
    const [erreurs, setErreurs] = useState({});
    const [erreurGlobale, setErreurGlobale] = useState("");
    const [conflit, setConflit] = useState(null);
    const [enCours, setEnCours] = useState(false);
    const refSoumettre = useRef(null);

    // Toute modification invalide l'avertissement et les erreurs du champ.
    const changer = (champ, maj) => {
        maj();
        setConflit(null);
        setErreurGlobale("");
        setErreurs((e) => ({ ...e, [champ]: "" }));
    };

    const basculer = (id) =>
        changer("cellules", () =>
            setChoix((prec) => {
                const s = new Set(prec);
                if (s.has(id)) s.delete(id);
                else s.add(id);
                return s;
            })
        );

    const idDate = `${ids}-date`;
    const idMotif = `${ids}-motif`;
    const idCompteur = `${ids}-compteur`;
    const idCellules = `${ids}-cellules`;

    // Focus sur le premier champ en erreur (ordre du formulaire).
    const focusErreur = (e) => {
        if (e.date) document.getElementById(idDate)?.focus();
        else if (e.motif) document.getElementById(idMotif)?.focus();
        else if (e.cellules) document.getElementById(idCellules)?.querySelector("input")?.focus();
    };

    const envoyer = async (confirmer) => {
        const e = erreursJourNa({ date, motif, portee, choix });
        setErreurs(e);
        if (Object.keys(e).length > 0) {
            focusErreur(e);
            return;
        }
        setEnCours(true);
        setErreurGlobale("");
        try {
            await onEnregistrer(
                corpsJourNa({ edition, date, motif, portee, choix, cellules, confirmer })
            );
            onFermer();
        } catch (err) {
            if (estConflitPresences(err)) setConflit(err.cellules);
            else setErreurGlobale(err.message || "Échec de l'enregistrement");
            setEnCours(false);
        }
    };

    return (
        <Modale
            titre={edition ? "Modifier le jour NA" : "Marquer un jour NA"}
            onFermer={onFermer}
            fermable={!enCours}
            occupe={enCours}
            apresOccupe={() => refSoumettre.current}
            retourFocus={retourFocus}
        >
            <form
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    envoyer(Boolean(conflit));
                }}
            >
                <p className="mb-4 text-sm text-gray-500">
                    Un jour NA est un jour de réunion remplacé par une autre activité :
                    il sort du taux de régularité.
                </p>

                <label htmlFor={idDate} className="mb-1 block text-sm font-medium text-gray-700">
                    Date
                </label>
                <input
                    id={idDate}
                    type="date"
                    value={date}
                    disabled={edition || enCours}
                    data-autofocus={edition ? undefined : true}
                    onChange={(e) => changer("date", () => setDate(e.target.value))}
                    aria-invalid={Boolean(erreurs.date)}
                    aria-describedby={erreurs.date ? `${idDate}-err` : edition ? `${idDate}-aide` : undefined}
                    className={`${CHAMP} ${BORDURE(erreurs.date)} h-10`}
                />
                {edition && (
                    <p id={`${idDate}-aide`} className="mt-1 text-xs text-gray-500">
                        La date ne se modifie pas : supprimez ce jour NA puis marquez-en un autre.
                    </p>
                )}
                {erreurs.date && (
                    <p id={`${idDate}-err`} className="mt-1 text-sm text-red-600">
                        {erreurs.date}
                    </p>
                )}

                <div className="mt-4 mb-1 flex items-baseline justify-between gap-2">
                    <label htmlFor={idMotif} className="block text-sm font-medium text-gray-700">
                        Description de l'autre activité
                    </label>
                    <span
                        id={idCompteur}
                        className={`text-xs ${motif.length >= MOTIF_MAX ? "text-red-600" : "text-gray-500"}`}
                    >
                        {motif.length}/{MOTIF_MAX}
                    </span>
                </div>
                <textarea
                    id={idMotif}
                    rows={3}
                    value={motif}
                    maxLength={MOTIF_MAX}
                    required
                    disabled={enCours}
                    data-autofocus={edition ? true : undefined}
                    placeholder="Ex. : Convention nationale à Yamoussoukro"
                    onChange={(e) => changer("motif", () => setMotif(e.target.value))}
                    aria-invalid={Boolean(erreurs.motif)}
                    aria-describedby={`${idCompteur}${erreurs.motif ? ` ${idMotif}-err` : ""}`}
                    className={`${CHAMP} ${BORDURE(erreurs.motif)} resize-y`}
                />
                {erreurs.motif && (
                    <p id={`${idMotif}-err`} className="mt-1 text-sm text-red-600">
                        {erreurs.motif}
                    </p>
                )}

                <fieldset className="mt-4" disabled={enCours}>
                    <legend className="mb-2 text-sm font-medium text-gray-700">Cellules concernées</legend>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                        {[
                            ["toutes", "Toutes mes cellules"],
                            ["choisies", "Cellules choisies"],
                        ].map(([valeur, libelle]) => (
                            <label key={valeur} className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="radio"
                                    name={`${ids}-portee`}
                                    value={valeur}
                                    checked={portee === valeur}
                                    onChange={() => changer("cellules", () => setPortee(valeur))}
                                    className="h-4 w-4 accent-blue-600"
                                />
                                {libelle}
                            </label>
                        ))}
                    </div>
                    {portee === "toutes" && (
                        <p className="mt-2 text-xs text-gray-500">
                            {edition
                                ? `Les ${pluriel(cellules.length, "cellule")} de votre périmètre.`
                                : `Les ${pluriel(cellules.length, "cellule")} actives de votre périmètre aujourd'hui ; une cellule créée plus tard ne sera pas couverte.`}
                        </p>
                    )}
                    {portee === "choisies" && (
                        <div
                            id={idCellules}
                            role="group"
                            aria-label="Cellules choisies"
                            aria-invalid={Boolean(erreurs.cellules)}
                            aria-describedby={erreurs.cellules ? `${ids}-cellules-err` : undefined}
                            className={`mt-2 grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2 ${BORDURE(erreurs.cellules)}`}
                        >
                            {cellules.map((c) => (
                                <label key={c.id} className="flex items-center gap-2 rounded px-1 py-0.5 text-sm text-gray-700 hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={choix.has(c.id)}
                                        onChange={() => basculer(c.id)}
                                        className="h-4 w-4 accent-blue-600"
                                    />
                                    {c.name}
                                </label>
                            ))}
                        </div>
                    )}
                    {erreurs.cellules && (
                        <p id={`${ids}-cellules-err`} className="mt-1 text-sm text-red-600">
                            {erreurs.cellules}
                        </p>
                    )}
                </fieldset>

                {conflit && <AvertissementPresences cellules={conflit} />}

                {erreurGlobale && (
                    <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        {erreurGlobale}
                    </p>
                )}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onFermer} disabled={enCours} className={BOUTON_SECONDAIRE}>
                        Annuler
                    </button>
                    <button
                        ref={refSoumettre}
                        type="submit"
                        disabled={enCours}
                        aria-busy={enCours}
                        className={conflit ? BOUTON_ALERTE : BOUTON_PRIMAIRE}
                    >
                        {enCours && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                        {enCours ? "Enregistrement…" : conflit ? "Marquer quand même" : "Enregistrer"}
                    </button>
                </div>
            </form>
        </Modale>
    );
}

// Détail d'une case NA : date, motif, cellules, puis Modifier / Supprimer.
export function JourNaDetailModal({
    infos,
    origine,
    jour,
    chargement,
    erreur,
    onRecharger,
    onModifier,
    onSupprimer,
    onFermer,
    retourFocus,
}) {
    const [confirmation, setConfirmation] = useState(false);
    const [enCours, setEnCours] = useState(false);
    const [erreurSuppr, setErreurSuppr] = useState("");
    const refPanneau = useRef(null);
    const refSupprimer = useRef(null);
    const refAnnulerSuppr = useRef(null);
    const refConfirmer = useRef(null);
    const refFermer = useRef(null);
    const dejaConfirme = useRef(false);
    // Confirmation visible tant que le groupe existe encore dans la liste.
    const enConfirmation = confirmation && Boolean(jour);

    // Le focus suit l'étape de confirmation (le bouton cliqué disparaît).
    useEffect(() => {
        if (enConfirmation) refAnnulerSuppr.current?.focus();
        else if (dejaConfirme.current && focusPerdu(refPanneau.current)) refSupprimer.current?.focus();
        dejaConfirme.current = enConfirmation;
    }, [enConfirmation]);

    const supprimer = async () => {
        setEnCours(true);
        setErreurSuppr("");
        try {
            await onSupprimer(jour);
            onFermer();
        } catch (err) {
            setErreurSuppr(err.message || "Échec de la suppression");
            setEnCours(false);
        }
    };

    const motif = jour?.motif ?? infos.motif;
    const nbCellules = jour?.cellules?.length ?? 0;

    return (
        <Modale
            titre="Jour NA"
            onFermer={onFermer}
            fermable={!enCours}
            occupe={enCours || chargement}
            apresOccupe={() =>
                enConfirmation ? refConfirmer.current : jour ? null : refFermer.current
            }
            origine={origine}
            retourFocus={retourFocus}
            refPanneau={refPanneau}
        >
            <dl className="space-y-3 text-sm">
                <div>
                    <dt className="font-medium text-gray-500">Date</dt>
                    <dd className="text-gray-800 first-letter:uppercase">{dateLongue(infos.date)}</dd>
                </div>
                <div>
                    <dt className="font-medium text-gray-500">Autre activité</dt>
                    <dd className={motif ? "text-gray-800 break-words" : "italic text-gray-500"}>
                        {motif || "Aucun motif saisi"}
                    </dd>
                </div>
                <div>
                    <dt className="font-medium text-gray-500">Cellules concernées</dt>
                    <dd className="text-gray-800">
                        {chargement ? (
                            <span role="status" className="mt-1 block h-5 w-2/3 animate-pulse rounded bg-gray-100">
                                <span className="sr-only">Chargement…</span>
                            </span>
                        ) : jour ? (
                            <>
                                {jour.toutesMesCellules && (
                                    <span className="font-medium">Toutes les cellules · </span>
                                )}
                                {jour.cellules.map((c) => c.name).join(", ")}
                            </>
                        ) : (
                            infos.nomCellule
                        )}
                    </dd>
                </div>
            </dl>

            {!chargement && erreur && (
                <div role="alert" className="mt-4 flex flex-col gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>{erreur}</span>
                    <button type="button" onClick={onRecharger} className={`${BOUTON_SECONDAIRE} shrink-0`}>
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Réessayer
                    </button>
                </div>
            )}
            {!chargement && !erreur && !jour && (
                <p className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                    Ce jour NA ne figure pas dans la liste de votre périmètre : il ne
                    peut pas être modifié ici.
                </p>
            )}

            {erreurSuppr && (
                <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">
                    {erreurSuppr}
                </p>
            )}

            {enConfirmation ? (
                <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-800">
                        Supprimer ce jour NA pour {pluriel(nbCellules, "cellule")} ? Les cases
                        redeviendront OK ou NOK selon les présences saisies.
                    </p>
                    <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            ref={refAnnulerSuppr}
                            type="button"
                            onClick={() => setConfirmation(false)}
                            disabled={enCours}
                            className={BOUTON_SECONDAIRE}
                        >
                            Annuler
                        </button>
                        <button
                            ref={refConfirmer}
                            type="button"
                            onClick={supprimer}
                            disabled={enCours}
                            aria-busy={enCours}
                            className={BOUTON_DANGER}
                        >
                            {enCours ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                            )}
                            {enCours ? "Suppression…" : "Confirmer la suppression"}
                        </button>
                    </div>
                </div>
            ) : !jour && !chargement ? (
                // Groupe absent de la liste : seule la fermeture reste possible.
                <div className="mt-6 flex justify-end">
                    <button ref={refFermer} type="button" onClick={onFermer} data-autofocus className={BOUTON_SECONDAIRE}>
                        Fermer
                    </button>
                </div>
            ) : (
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        ref={refSupprimer}
                        type="button"
                        onClick={() => setConfirmation(true)}
                        disabled={!jour || chargement}
                        className={`${BOUTON_SECONDAIRE} text-red-700`}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Supprimer
                    </button>
                    <button
                        type="button"
                        onClick={() => onModifier(jour)}
                        disabled={!jour || chargement}
                        data-autofocus
                        className={BOUTON_PRIMAIRE}
                    >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Modifier
                    </button>
                </div>
            )}
        </Modale>
    );
}
