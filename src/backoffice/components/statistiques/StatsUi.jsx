import React, { useState } from "react";
import {
    AlertTriangle,
    FileSpreadsheet,
    FileText,
    Inbox,
    ChartLine,
    Loader2,
    RefreshCw,
} from "lucide-react";

// Anneau de focus clavier commun aux contrôles de la page.
export const FOCUS =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

// Squelette de chargement : un bloc par ligne attendue.
export function Squelette({ lignes = 4, hauteur = "h-8" }) {
    return (
        <div
            className="bg-white rounded shadow p-4 space-y-3 animate-pulse"
            role="status"
            aria-live="polite"
        >
            <span className="sr-only">Chargement…</span>
            <div className="h-5 w-1/3 bg-gray-200 rounded" />
            {Array.from({ length: lignes }).map((_, i) => (
                <div key={i} className={`${hauteur} bg-gray-100 rounded`} />
            ))}
        </div>
    );
}

export function EtatVide({ titre, message }) {
    return (
        <div className="text-center py-12 bg-white rounded shadow">
            <Inbox className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{titre}</h3>
            {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
        </div>
    );
}

export function EtatErreur({ message, onReessayer }) {
    return (
        <div
            className="p-4 bg-red-50 border border-red-200 text-red-700 rounded flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
        >
            <p className="text-sm flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{message}</span>
            </p>
            {onReessayer && (
                <button
                    type="button"
                    onClick={onReessayer}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium ${FOCUS}`}
                >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Réessayer
                </button>
            )}
        </div>
    );
}

const LIBELLES = {
    xlsx: { texte: "Exporter Excel", Icone: FileSpreadsheet },
    pdf: { texte: "Exporter PDF", Icone: FileText },
};

// Carte « Régularité globale » posée à côté des boutons d'export.
export function CarteRegularite({ taux, detail, chargement }) {
    return (
        <div
            className="flex items-center gap-3 rounded-md border border-blue-100 bg-blue-50 px-4 py-2 basis-full sm:basis-auto"
            aria-busy={chargement}
        >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-600">
                <ChartLine className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">Régularité globale</p>
                {chargement ? (
                    <div className="mt-1 h-6 w-28 rounded bg-blue-100 animate-pulse">
                        <span className="sr-only">Chargement…</span>
                    </div>
                ) : (
                    <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-2xl font-bold leading-tight text-blue-800">{taux}</span>
                        <span className="text-xs text-gray-500">{detail}</span>
                    </p>
                )}
            </div>
        </div>
    );
}

// Boutons d'export d'un onglet ; onExport(format) télécharge le fichier.
// `avant` : élément affiché sur la même ligne, à la même hauteur que les boutons.
export function BarreExport({ formats, onExport, desactive, avant }) {
    const [enCours, setEnCours] = useState(null);
    const [erreur, setErreur] = useState("");

    const lancer = async (format) => {
        setEnCours(format);
        setErreur("");
        try {
            await onExport(format);
        } catch (err) {
            setErreur(err.message || "Échec de l'export");
        } finally {
            setEnCours(null);
        }
    };

    return (
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-wrap items-stretch gap-2">
                {avant}
                {formats.map((format) => {
                    const { texte, Icone } = LIBELLES[format];
                    const actif = enCours === format;
                    return (
                        <button
                            key={format}
                            type="button"
                            onClick={() => lancer(format)}
                            disabled={desactive || enCours !== null}
                            aria-busy={actif}
                            className={`inline-flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${FOCUS}`}
                        >
                            {actif ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Icone className="h-4 w-4" aria-hidden="true" />
                            )}
                            {texte}
                        </button>
                    );
                })}
            </div>
            {erreur && (
                <p className="text-sm text-red-600" role="alert">
                    {erreur}
                </p>
            )}
        </div>
    );
}
