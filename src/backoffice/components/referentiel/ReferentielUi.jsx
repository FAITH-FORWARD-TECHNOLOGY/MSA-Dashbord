import React from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, ShieldAlert, X } from "lucide-react";
import { FOCUS } from "../statistiques/StatsUi";

// Briques communes aux écrans Communes et Quartiers (mêmes gabarits que « Membres par quartier »).

export const CHAMP =
    "block w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

const BOUTON = `inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
export const BOUTON_PRIMAIRE = `${BOUTON} bg-blue-600 text-white hover:bg-blue-700`;
export const BOUTON_SECONDAIRE = `${BOUTON} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
export const BOUTON_DANGER = `${BOUTON} bg-red-600 text-white hover:bg-red-700`;
export const BOUTON_EXPORT = `${BOUTON} bg-green-600 text-white hover:bg-green-700`;
// Action d'une ligne de tableau (zone de clic de 36 px).
export const BOUTON_LIGNE = `inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
export const BOUTON_LIGNE_DANGER = `inline-flex h-9 items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;

export const ENTETE_TABLEAU =
    "border-y border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500";

// Page réservée aux administrateurs.
export function AccesReserve({ message }) {
    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <div role="alert" className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <ShieldAlert className="size-5 shrink-0" aria-hidden="true" />
                <p>{message}</p>
            </div>
        </div>
    );
}

// Champ de formulaire : libellé relié, aide et erreur annoncée.
export function Champ({ id, libelle, erreur, aide, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
                {libelle}
            </label>
            {children}
            {aide && !erreur && (
                <p id={`${id}-aide`} className="mt-1 text-xs text-gray-500">
                    {aide}
                </p>
            )}
            {erreur && (
                <p id={`${id}-erreur`} role="alert" className="mt-1 text-sm text-red-600">
                    {erreur}
                </p>
            )}
        </div>
    );
}

// Message d'erreur d'une action (texte du serveur affiché tel quel).
export function AlerteErreur({ children }) {
    if (!children) return null;
    return (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{children}</span>
        </div>
    );
}

// Confirmation d'une action réussie, annoncée aux lecteurs d'écran.
export function Annonce({ message }) {
    return (
        <div aria-live="polite" className="min-h-5 text-sm">
            {message && (
                <span className="inline-flex items-center gap-1.5 text-green-700">
                    <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                    {message}
                </span>
            )}
        </div>
    );
}

export function Pastille({ ton = "gris", children }) {
    const tons = {
        gris: "bg-gray-100 text-gray-700",
        vert: "bg-green-100 text-green-800",
        ambre: "bg-amber-100 text-amber-800",
        rouge: "bg-red-100 text-red-800",
    };
    return (
        <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${tons[ton] ?? tons.gris}`}>
            {children}
        </span>
    );
}

// Modale : focus piégé, Échap et clic extérieur ferment, le focus revient au déclencheur.
export function Modale({ ouvert, titre, sousTitre, onFermer, children, pied, large = false, bloquee = false }) {
    return (
        <Dialog open={ouvert} onClose={bloquee ? () => {} : onFermer} className="relative z-[60]">
            <DialogBackdrop className="fixed inset-0 bg-gray-900/50" />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPanel
                    className={`flex max-h-[90vh] w-full ${large ? "max-w-3xl" : "max-w-lg"} flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl`}
                >
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
                    {pied && (
                        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-3 sm:flex-row sm:justify-end">
                            {pied}
                        </div>
                    )}
                </DialogPanel>
            </div>
        </Dialog>
    );
}

// Demande de confirmation (suppression, fusion) ; l'erreur du serveur reste dans la modale.
export function Confirmation({
    ouvert,
    titre,
    children,
    libelle = "Confirmer",
    danger = false,
    enCours = false,
    erreur = "",
    onConfirmer,
    onAnnuler,
}) {
    return (
        <Modale
            ouvert={ouvert}
            titre={titre}
            onFermer={onAnnuler}
            bloquee={enCours}
            pied={
                <>
                    <button type="button" className={BOUTON_SECONDAIRE} onClick={onAnnuler} disabled={enCours}>
                        {erreur ? "Fermer" : "Annuler"}
                    </button>
                    {/* Action refusée : il ne reste qu'à fermer. */}
                    {!erreur && (
                        <button
                            type="button"
                            className={danger ? BOUTON_DANGER : BOUTON_PRIMAIRE}
                            onClick={onConfirmer}
                            disabled={enCours}
                            aria-busy={enCours}
                        >
                            {enCours && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                            {libelle}
                        </button>
                    )}
                </>
            }
        >
            <div className="space-y-3 text-sm text-gray-700">
                {children}
                <AlerteErreur>{erreur}</AlerteErreur>
            </div>
        </Modale>
    );
}

// Pagination d'une liste : « Page 2 sur 5 » et boutons Précédent / Suivant.
export function Pagination({ page, pages, total, libelleTotal, onPage, desactive = false }) {
    const bouton = `inline-flex h-9 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
    return (
        <div className="flex flex-col gap-2 px-4 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600" aria-live="polite">
                {libelleTotal ?? total}
                {pages > 1 && ` · page ${page} sur ${pages}`}
            </p>
            {pages > 1 && (
                <div className="flex items-center gap-2">
                    <button type="button" className={bouton} disabled={desactive || page <= 1} onClick={() => onPage(page - 1)}>
                        <ChevronLeft className="size-4" aria-hidden="true" />
                        Précédent
                    </button>
                    <button type="button" className={bouton} disabled={desactive || page >= pages} onClick={() => onPage(page + 1)}>
                        Suivant
                        <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
}
