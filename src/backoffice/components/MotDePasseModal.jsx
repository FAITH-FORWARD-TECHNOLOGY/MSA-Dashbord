import React, { useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertTriangle, Check, CheckCircle2, Copy, Eye, EyeOff, Loader2, Wand2, X } from "lucide-react";
import { FOCUS } from "./statistiques/StatsUi";
import { definirMotDePasse } from "../hooks/useUsers";
import { erreursMotDePasse, genererMotDePasse, MDP_OCTETS_MAX, reglesMotDePasse } from "../utils/motDePasse";

const CHAMP =
    "block w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const BOUTON = `inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
const BOUTON_PRIMAIRE = `${BOUTON} bg-blue-600 text-white hover:bg-blue-700`;
const BOUTON_SECONDAIRE = `${BOUTON} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
const PIED = "flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end";

// Modale minimale : focus piégé, Échap et clic extérieur ferment, le focus revient au déclencheur.
function Modale({ ouvert, titre, sousTitre, onFermer, bloquee, children }) {
    return (
        <Dialog open={ouvert} onClose={bloquee ? () => {} : onFermer} className="relative z-[60]">
            <DialogBackdrop className="fixed inset-0 bg-gray-900/50" />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPanel className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl">
                    <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                        <div className="min-w-0">
                            <DialogTitle className="text-lg font-semibold text-gray-900">{titre}</DialogTitle>
                            {sousTitre && <p className="mt-0.5 text-sm text-gray-500">{sousTitre}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={onFermer}
                            disabled={bloquee}
                            aria-label="Fermer"
                            className={`rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 ${FOCUS}`}
                        >
                            <X className="size-5" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

// Champ de formulaire : libellé relié et erreur annoncée.
function Champ({ id, libelle, erreur, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
                {libelle}
            </label>
            {children}
            {erreur && (
                <p id={`${id}-erreur`} role="alert" className="mt-1 text-sm text-red-600">
                    {erreur}
                </p>
            )}
        </div>
    );
}

// Message d'erreur du serveur, affiché tel quel.
function AlerteErreur({ children }) {
    if (!children) return null;
    return (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{children}</span>
        </div>
    );
}

// Avertissement affiché avant l'envoi.
function Avertissement() {
    return (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>Le membre sera déconnecté de tous ses appareils.</p>
        </div>
    );
}

// Champ mot de passe avec bouton Afficher / Masquer.
function ChampMotDePasse({
    id,
    libelle,
    valeur,
    onChange,
    visible,
    onBasculer,
    erreur,
    decritPar,
    champRef,
    autoFocus = false,
}) {
    const decrit = [erreur ? `${id}-erreur` : null, decritPar].filter(Boolean).join(" ") || undefined;
    return (
        <Champ id={id} libelle={libelle} erreur={erreur}>
            <div className="relative">
                <input
                    ref={champRef}
                    autoFocus={autoFocus}
                    data-autofocus={autoFocus || undefined}
                    id={id}
                    type={visible ? "text" : "password"}
                    className={`${CHAMP} pr-28 font-mono`}
                    value={valeur}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={MDP_OCTETS_MAX + 1}
                    autoComplete="new-password"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={Boolean(erreur)}
                    aria-describedby={decrit}
                />
                <button
                    type="button"
                    onClick={onBasculer}
                    aria-controls={id}
                    aria-pressed={visible}
                    className={`absolute inset-y-0 right-0 inline-flex items-center gap-1.5 rounded-r-md px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${FOCUS}`}
                >
                    {visible ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                        <Eye className="size-4" aria-hidden="true" />
                    )}
                    {visible ? "Masquer" : "Afficher"}
                    <span className="sr-only"> {libelle.toLowerCase()}</span>
                </button>
            </div>
        </Champ>
    );
}

// Copie dans le presse-papiers ; l'état est annoncé aux lecteurs d'écran.
function BoutonCopier({ texte, libelle = "Copier" }) {
    const [etat, setEtat] = useState("");
    const copier = async () => {
        try {
            await navigator.clipboard.writeText(texte);
            setEtat("Copié");
        } catch {
            setEtat("Copie impossible : sélectionnez le texte.");
        }
    };
    return (
        <span className="inline-flex flex-wrap items-center gap-2">
            <button type="button" onClick={copier} className={BOUTON_SECONDAIRE}>
                {etat === "Copié" ? (
                    <Check className="size-4" aria-hidden="true" />
                ) : (
                    <Copy className="size-4" aria-hidden="true" />
                )}
                {libelle}
            </button>
            <span aria-live="polite" className="text-sm text-gray-600">
                {etat}
            </span>
        </span>
    );
}

function Contenu({ utilisateur, onFermer, setBloquee }) {
    const [etape, setEtape] = useState("saisie");
    const [mdp, setMdp] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [visibleMdp, setVisibleMdp] = useState(false);
    const [visibleConf, setVisibleConf] = useState(false);
    const [genere, setGenere] = useState("");
    const [erreurs, setErreurs] = useState({ mdp: "", confirmation: "" });
    const [envoi, setEnvoi] = useState(false);
    const [erreurServeur, setErreurServeur] = useState("");
    const idMdp = useId();
    const idConf = useId();
    const idRegles = useId();
    const refMdp = useRef(null);
    const refConf = useRef(null);
    const refConfirmer = useRef(null);
    const refFermer = useRef(null);
    const nom = [utilisateur.prenom, utilisateur.nom].filter(Boolean).join(" ") || utilisateur.email;
    const regles = reglesMotDePasse(mdp, confirmation);

    // Le focus suit l'étape affichée.
    useEffect(() => {
        if (etape === "confirmation") refConfirmer.current?.focus();
        if (etape === "succes") refFermer.current?.focus();
    }, [etape]);

    const generer = () => {
        const nouveau = genererMotDePasse();
        setMdp(nouveau);
        setConfirmation(nouveau);
        setGenere(nouveau);
        setVisibleMdp(true);
        setVisibleConf(true);
        setErreurs({ mdp: "", confirmation: "" });
    };

    const continuer = (e) => {
        e.preventDefault();
        const suite = erreursMotDePasse(mdp, confirmation);
        setErreurs(suite);
        if (suite.mdp) return refMdp.current?.focus();
        if (suite.confirmation) return refConf.current?.focus();
        setErreurServeur("");
        setEtape("confirmation");
    };

    const envoyer = async () => {
        if (envoi) return;
        setEnvoi(true);
        setBloquee(true);
        setErreurServeur("");
        try {
            await definirMotDePasse(utilisateur.id, mdp);
            setMdp("");
            setConfirmation("");
            setEtape("succes");
        } catch (err) {
            setErreurServeur(
                err.statut === 429
                    ? "Trop de modifications en peu de temps : réessayez dans une minute."
                    : err.message || "Modification impossible.",
            );
        } finally {
            setEnvoi(false);
            setBloquee(false);
        }
    };

    if (etape === "succes") {
        return (
            <div className="space-y-4">
                <div
                    role="status"
                    className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800"
                >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>
                        Mot de passe de <span className="font-medium">{nom}</span> modifié. Le membre a été déconnecté
                        de tous ses appareils : communiquez-lui son nouveau mot de passe par un moyen sûr.
                    </p>
                </div>
                {genere && <BoutonCopier texte={genere} libelle="Copier le mot de passe généré" />}
                <div className={PIED}>
                    <button ref={refFermer} type="button" className={BOUTON_PRIMAIRE} onClick={onFermer}>
                        Fermer
                    </button>
                </div>
            </div>
        );
    }

    if (etape === "confirmation") {
        return (
            <div className="space-y-4 text-sm text-gray-700">
                <p>
                    Confirmez-vous le changement du mot de passe de{" "}
                    <span className="font-medium text-gray-900">{nom}</span> ?
                </p>
                <Avertissement />
                <AlerteErreur>{erreurServeur}</AlerteErreur>
                <div className={PIED}>
                    <button
                        type="button"
                        className={BOUTON_SECONDAIRE}
                        onClick={() => setEtape("saisie")}
                        disabled={envoi}
                    >
                        Retour
                    </button>
                    <button
                        ref={refConfirmer}
                        type="button"
                        className={BOUTON_PRIMAIRE}
                        onClick={envoyer}
                        disabled={envoi}
                        aria-busy={envoi}
                    >
                        {envoi && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {envoi ? "Modification…" : "Modifier le mot de passe"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={continuer} noValidate className="space-y-4">
            <Avertissement />
            <ChampMotDePasse
                id={idMdp}
                libelle="Nouveau mot de passe"
                valeur={mdp}
                onChange={setMdp}
                visible={visibleMdp}
                onBasculer={() => setVisibleMdp((v) => !v)}
                erreur={erreurs.mdp}
                decritPar={idRegles}
                champRef={refMdp}
                autoFocus
            />
            <ChampMotDePasse
                id={idConf}
                libelle="Confirmation"
                valeur={confirmation}
                onChange={setConfirmation}
                visible={visibleConf}
                onBasculer={() => setVisibleConf((v) => !v)}
                erreur={erreurs.confirmation}
                champRef={refConf}
            />
            <div>
                <p className="text-sm font-medium text-gray-700">Règles</p>
                <ul id={idRegles} className="mt-1 space-y-1 text-sm">
                    {regles.map((r) => (
                        <li
                            key={r.id}
                            className={`flex items-center gap-1.5 ${r.ok ? "text-green-700" : "text-gray-600"}`}
                        >
                            {r.ok ? (
                                <Check className="size-4 shrink-0" aria-hidden="true" />
                            ) : (
                                <X className="size-4 shrink-0" aria-hidden="true" />
                            )}
                            <span>
                                {r.libelle}
                                <span className="sr-only">{r.ok ? " : respectée" : " : non respectée"}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="space-y-2">
                <button type="button" className={BOUTON_SECONDAIRE} onClick={generer}>
                    <Wand2 className="size-4" aria-hidden="true" />
                    Générer
                </button>
                {genere && genere === mdp && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-900">Mot de passe généré</p>
                        <p className="mt-1 break-all font-mono text-base text-gray-900 select-all">{genere}</p>
                        <div className="mt-2">
                            <BoutonCopier texte={genere} />
                        </div>
                    </div>
                )}
            </div>
            <div className={PIED}>
                <button type="button" className={BOUTON_SECONDAIRE} onClick={onFermer}>
                    Annuler
                </button>
                <button type="submit" className={BOUTON_PRIMAIRE}>
                    Continuer
                </button>
            </div>
        </form>
    );
}

// Modale « Modifier le mot de passe » d'un utilisateur (admin) ; rien n'est conservé à la fermeture.
export default function MotDePasseModal({ utilisateur, onFermer }) {
    const [bloquee, setBloquee] = useState(false);
    return (
        <Modale
            ouvert={utilisateur !== null}
            titre="Modifier le mot de passe"
            sousTitre={
                utilisateur
                    ? [utilisateur.prenom, utilisateur.nom].filter(Boolean).join(" ") || utilisateur.email
                    : undefined
            }
            onFermer={onFermer}
            bloquee={bloquee}
        >
            {utilisateur !== null && (
                <Contenu key={utilisateur.id} utilisateur={utilisateur} onFermer={onFermer} setBloquee={setBloquee} />
            )}
        </Modale>
    );
}
