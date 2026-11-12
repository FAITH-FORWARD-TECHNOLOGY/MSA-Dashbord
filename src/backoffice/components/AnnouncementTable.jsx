import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Trash2 } from "lucide-react";
import {
    ETAT_FILTERS,
    ETAT_LABELS,
    announcementEtat,
    announcementTypeLabel,
    countByEtat,
    filterByEtat,
    formatAnnouncementDate,
    formatWindowDate,
    isHttpUrl,
    moveWithin,
} from "../utils/announcements";

// Couleur du badge d'état (texte lisible sur fond clair).
const ETAT_BADGES = {
    ACTIVE: "bg-green-100 text-green-800",
    PROGRAMMEE: "bg-blue-100 text-blue-800",
    EXPIREE: "bg-amber-100 text-amber-900",
    DESACTIVEE: "bg-gray-200 text-gray-700",
};

const arrowClass =
    "p-1 rounded text-gray-600 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-30 disabled:hover:text-gray-600";

// Tableau des annonces, dans l'ordre d'affichage de l'application.
// Les flèches réécrivent l'ordre complet via `onReorder(ids)`.
function AnnouncementTable({ announcements, onEdit, onDelete, onReorder }) {
    const [moving, setMoving] = useState(false);
    const [orderError, setOrderError] = useState("");
    const [status, setStatus] = useState("");
    const [filter, setFilter] = useState("TOUTES");
    const counts = countByEtat(announcements);
    const visible = filterByEtat(announcements, filter);
    const currentFilter = ETAT_FILTERS.find((f) => f.key === filter);
    const focusAfterMove = useRef(null); // {id, direction}
    const busy = useRef(false); // verrou immédiat contre le double clic

    // Après un déplacement, le focus suit la ligne déplacée.
    useEffect(() => {
        const target = focusAfterMove.current;
        if (!target) return;
        focusAfterMove.current = null;
        const button = (direction) =>
            document.getElementById(`annonce-${target.id}-${direction}`);
        const same = button(target.direction);
        const other = button(target.direction === "monter" ? "descendre" : "monter");
        (same && !same.disabled ? same : other)?.focus();
    }, [announcements]);

    const move = async (row, delta) => {
        if (busy.current) return;
        // Dans un onglet filtré, la ligne change de place avec sa voisine visible.
        const visibleIds = visible.map((a) => a.id);
        const ids = moveWithin(
            announcements.map((a) => a.id),
            visibleIds,
            row.id,
            delta,
        );
        if (!ids) return;
        const position = visibleIds.indexOf(row.id) + delta + 1;
        busy.current = true;
        setMoving(true);
        setOrderError("");
        try {
            focusAfterMove.current = {
                id: row.id,
                direction: delta < 0 ? "monter" : "descendre",
            };
            await onReorder(ids);
            setStatus(
                `« ${row.title} » déplacée en position ${position} sur ${visibleIds.length}.`,
            );
        } catch (err) {
            focusAfterMove.current = null;
            setOrderError(
                err.message || "Impossible d’enregistrer le nouvel ordre.",
            );
        } finally {
            busy.current = false;
            setMoving(false);
        }
    };

    return (
        <>
            {orderError && (
                <div
                    role="alert"
                    className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm"
                >
                    {orderError}
                </div>
            )}
            <p className="sr-only" role="status" aria-live="polite">
                {status}
            </p>
            <div
                role="group"
                aria-label="Filtrer les annonces par état"
                className="flex flex-wrap gap-2 mb-3"
            >
                {ETAT_FILTERS.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        aria-pressed={filter === f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
                            filter === f.key
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        {f.label} ({counts[f.key]})
                    </button>
                ))}
            </div>
            {visible.length === 0 ? (
                <p role="status" className="text-gray-500">
                    {currentFilter?.empty}
                </p>
            ) : (
            <div className="overflow-x-auto bg-white rounded shadow">
                <table className="min-w-full text-sm" aria-busy={moving}>
                    <caption className="sr-only">
                        Annonces ({currentFilter?.label.toLowerCase()}), dans l’ordre
                        d’affichage de l’application
                    </caption>
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th scope="col" className="text-left p-3">Titre</th>
                            <th scope="col" className="text-left p-3">Date</th>
                            <th scope="col" className="text-left p-3">Rubrique</th>
                            <th scope="col" className="text-left p-3">Lien</th>
                            <th scope="col" className="text-left p-3">État</th>
                            <th scope="col" className="text-left p-3">Ordre</th>
                            <th scope="col" className="text-right p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((r, index) => {
                            const etat = announcementEtat(r);
                            return (
                            <tr key={r.id} className="border-t border-gray-100">
                                <td className="p-3 font-medium text-gray-800">
                                    {r.title}
                                    <span className="block text-xs font-normal text-gray-500">
                                        {announcementTypeLabel(r.type)}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-600">
                                    {formatAnnouncementDate(r.publishedAt) || "—"}
                                    {r.dateLabel && (
                                        <span className="block text-xs text-gray-500">
                                            {r.dateLabel}
                                        </span>
                                    )}
                                </td>
                                <td className="p-3 text-gray-600">
                                    {r.rubrique?.name ?? "—"}
                                </td>
                                <td className="p-3">
                                    {isHttpUrl(r.programUrl) ? (
                                        <a
                                            href={r.programUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                            aria-label={`Ouvrir le lien de « ${r.title} » (nouvel onglet)`}
                                        >
                                            Ouvrir <ExternalLink size={13} aria-hidden="true" />
                                        </a>
                                    ) : (
                                        <span className="text-gray-600">—</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${ETAT_BADGES[etat]}`}
                                    >
                                        {ETAT_LABELS[etat]}
                                    </span>
                                    {r.startsAt && (
                                        <span className="block mt-1 text-xs text-gray-500 whitespace-nowrap">
                                            Début : {formatWindowDate(r.startsAt)}
                                        </span>
                                    )}
                                    {r.endsAt && (
                                        <span className="block mt-1 text-xs text-gray-500 whitespace-nowrap">
                                            Fin : {formatWindowDate(r.endsAt)}
                                        </span>
                                    )}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                    <span className="inline-block w-6 text-gray-600">
                                        {index + 1}
                                    </span>
                                    <button
                                        type="button"
                                        id={`annonce-${r.id}-monter`}
                                        className={arrowClass}
                                        onClick={() => move(r, -1)}
                                        disabled={index === 0}
                                        aria-label={`Monter « ${r.title} »`}
                                        title="Monter"
                                    >
                                        <ArrowUp size={16} aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        id={`annonce-${r.id}-descendre`}
                                        className={arrowClass}
                                        onClick={() => move(r, 1)}
                                        disabled={index === visible.length - 1}
                                        aria-label={`Descendre « ${r.title} »`}
                                        title="Descendre"
                                    >
                                        <ArrowDown size={16} aria-hidden="true" />
                                    </button>
                                </td>
                                <td className="p-3 text-right whitespace-nowrap">
                                    <button
                                        type="button"
                                        className="p-2 text-gray-600 hover:text-blue-600"
                                        onClick={() => onEdit(r)}
                                        aria-label={`Modifier « ${r.title} »`}
                                        title="Modifier"
                                    >
                                        <Pencil size={16} aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        className="p-2 text-gray-600 hover:text-red-600"
                                        onClick={() => onDelete(r)}
                                        aria-label={`Supprimer « ${r.title} »`}
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} aria-hidden="true" />
                                    </button>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            )}
        </>
    );
}

export default AnnouncementTable;
