import React, { useState } from "react";
import { BIBLE_BOOKS } from "../config/bibleBooks";

const SCOPES = [
    { value: "WHOLE", label: "Toute la Bible" },
    { value: "OT", label: "Ancien Testament" },
    { value: "NT", label: "Nouveau Testament" },
    { value: "SPECIFIC", label: "Livres specifiques" },
];

const inputCls =
    "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1 mt-3";

// Modal de creation / edition d'un plan de lecture (back-office).
export default function ReadingPlanFormModal({ plan, onClose, onSubmit }) {
    const isEdit = !!plan;
    const [title, setTitle] = useState(plan?.title ?? "");
    const [imageUrl, setImageUrl] = useState(plan?.imageUrl ?? "");
    const [scope, setScope] = useState(plan?.scope ?? "WHOLE");
    const [books, setBooks] = useState(new Set(plan?.bookNumbers ?? []));
    const [durationDays, setDurationDays] = useState(plan?.durationDays ?? 365);
    const [isActive, setIsActive] = useState(plan?.isActive ?? true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const toggleBook = (nr) =>
        setBooks((prev) => {
            const s = new Set(prev);
            s.has(nr) ? s.delete(nr) : s.add(nr);
            return s;
        });

    const submit = async () => {
        setErr("");
        if (!title.trim()) return setErr("Le titre est requis.");
        if (!durationDays || Number(durationDays) < 1)
            return setErr("La duree doit etre superieure ou egale a 1.");
        if (scope === "SPECIFIC" && books.size === 0)
            return setErr("Choisis au moins un livre.");
        setBusy(true);
        try {
            await onSubmit({
                title: title.trim(),
                imageUrl: imageUrl.trim() || null,
                scope,
                bookNumbers: scope === "SPECIFIC" ? [...books] : [],
                durationDays: Number(durationDays),
                isActive,
            });
            onClose();
        } catch (e) {
            setErr(e.message || "Erreur");
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-5">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">
                        {isEdit ? "Modifier le plan" : "Nouveau plan de lecture"}
                    </h3>
                    {err && (
                        <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">
                            {err}
                        </div>
                    )}

                    <label className={labelCls}>Titre</label>
                    <input
                        className={inputCls}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="La Bible en 1 an"
                    />

                    <label className={labelCls}>Image (URL, optionnel)</label>
                    <input
                        className={inputCls}
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                    />

                    <label className={labelCls}>Type de lecture</label>
                    <select
                        className={inputCls}
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                    >
                        {SCOPES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>

                    {scope === "SPECIFIC" && (
                        <div className="mt-3 border border-gray-200 rounded p-2 max-h-48 overflow-y-auto grid grid-cols-2 gap-1">
                            {BIBLE_BOOKS.map((b) => (
                                <label
                                    key={b.nr}
                                    className="flex items-center gap-2 text-sm cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={books.has(b.nr)}
                                        onChange={() => toggleBook(b.nr)}
                                    />
                                    {b.name}
                                </label>
                            ))}
                        </div>
                    )}

                    <label className={labelCls}>Periode (jours)</label>
                    <input
                        type="number"
                        min="1"
                        className={inputCls}
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                    />

                    <label className="flex items-center gap-2 mt-4 text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                        Actif (visible sur l'application mobile)
                    </label>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                            onClick={onClose}
                            disabled={busy}
                        >
                            Annuler
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                            onClick={submit}
                            disabled={busy}
                        >
                            {busy ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
