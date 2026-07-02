import React, { useState } from "react";
import { useDailyVerses } from "../hooks/useDailyVerses";
import DailyVerseFormModal from "../components/DailyVerseFormModal";
import { bookName } from "../config/bibleBooks";

function fmtDate(v) {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

const DailyVersePage = () => {
    const { verses, loading, error, createVerse, updateVerse, setStatus, deleteVerse } =
        useDailyVerses();
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);

    const handleDelete = async (v) => {
        if (!window.confirm("Supprimer ce verset ?")) return;
        try {
            await deleteVerse(v.id);
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Verset du jour
            </h2>
            <p className="text-sm text-gray-500 mb-6">
                Le verset du jour est <strong>automatique</strong> : un calendrier
                de versets tourne chaque jour, sans aucune saisie. Utilisez cette
                page uniquement pour <strong>remplacer</strong> le verset d'un jour
                precis (occasion speciale) en l'epinglant a une date.
            </p>

            <button
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                onClick={() => setCreating(true)}
            >
                Epingler un verset a une date
            </button>

            {loading && <p className="text-blue-600">Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 text-left">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Reference</th>
                                <th className="px-4 py-3 font-semibold">Theme</th>
                                <th className="px-4 py-3 font-semibold">Type</th>
                                <th className="px-4 py-3 font-semibold">Statut</th>
                                <th className="px-4 py-3 font-semibold text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {verses.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-6 text-center text-gray-400"
                                    >
                                        Aucun override. Le verset du jour suit le
                                        calendrier automatique.
                                    </td>
                                </tr>
                            )}
                            {verses.map((v) => {
                                const pinned = fmtDate(v.pinnedDate);
                                return (
                                    <tr key={v.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {bookName(v.book)} {v.chapter}:{v.verse}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {v.theme || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {pinned ? (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                    Epingle {pinned}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-500" title="Sans date : ignore (le calendrier automatique s'applique)">
                                                    Sans date (ignore)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    v.isActive
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-200 text-gray-600"
                                                }`}
                                            >
                                                {v.isActive ? "Actif" : "Inactif"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    className="text-blue-600 hover:underline"
                                                    onClick={() => setEditing(v)}
                                                >
                                                    Editer
                                                </button>
                                                <button
                                                    className="text-gray-600 hover:underline"
                                                    onClick={() =>
                                                        setStatus(
                                                            v.id,
                                                            !v.isActive
                                                        ).catch((e) =>
                                                            alert(e.message)
                                                        )
                                                    }
                                                >
                                                    {v.isActive
                                                        ? "Desactiver"
                                                        : "Activer"}
                                                </button>
                                                <button
                                                    className="text-red-600 hover:underline"
                                                    onClick={() => handleDelete(v)}
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {creating && (
                <DailyVerseFormModal
                    verse={null}
                    onClose={() => setCreating(false)}
                    onSubmit={(payload) => createVerse(payload)}
                />
            )}
            {editing && (
                <DailyVerseFormModal
                    verse={editing}
                    onClose={() => setEditing(null)}
                    onSubmit={(payload) => updateVerse(editing.id, payload)}
                />
            )}
        </div>
    );
};

export default DailyVersePage;
