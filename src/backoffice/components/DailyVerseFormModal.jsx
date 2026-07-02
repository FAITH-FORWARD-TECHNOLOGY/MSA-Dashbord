import React, { useState } from "react";
import { BIBLE_BOOKS } from "../config/bibleBooks";

const inputCls =
    "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1 mt-3";

// yyyy-mm-dd a partir d'une valeur ISO (ou vide).
function toDateInput(v) {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

export default function DailyVerseFormModal({ verse, onClose, onSubmit }) {
    const isEdit = !!verse;
    const [book, setBook] = useState(verse?.book ?? 43);
    const [chapter, setChapter] = useState(verse?.chapter ?? 3);
    const [verseNum, setVerseNum] = useState(verse?.verse ?? 16);
    const [theme, setTheme] = useState(verse?.theme ?? "");
    const [pinnedDate, setPinnedDate] = useState(toDateInput(verse?.pinnedDate));
    const [isActive, setIsActive] = useState(verse?.isActive ?? true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async () => {
        setErr("");
        if (!chapter || !verseNum) return setErr("Chapitre et verset requis.");
        if (!pinnedDate)
            return setErr(
                "Choisissez la date a laquelle ce verset doit remplacer celui du calendrier."
            );
        setBusy(true);
        try {
            await onSubmit({
                book: Number(book),
                chapter: Number(chapter),
                verse: Number(verseNum),
                theme: theme.trim() || null,
                isActive,
                pinnedDate: pinnedDate ? pinnedDate : null,
            });
            onClose();
        } catch (e) {
            setErr(e.message || "Erreur");
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-5">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">
                        {isEdit
                            ? "Modifier l'override"
                            : "Epingler un verset a une date"}
                    </h3>
                    {err && (
                        <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">
                            {err}
                        </div>
                    )}

                    <label className={labelCls}>Livre</label>
                    <select
                        className={inputCls}
                        value={book}
                        onChange={(e) => setBook(e.target.value)}
                    >
                        {BIBLE_BOOKS.map((b) => (
                            <option key={b.nr} value={b.nr}>
                                {b.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className={labelCls}>Chapitre</label>
                            <input
                                type="number"
                                min="1"
                                className={inputCls}
                                value={chapter}
                                onChange={(e) => setChapter(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className={labelCls}>Verset</label>
                            <input
                                type="number"
                                min="1"
                                className={inputCls}
                                value={verseNum}
                                onChange={(e) => setVerseNum(e.target.value)}
                            />
                        </div>
                    </div>

                    <label className={labelCls}>Theme (optionnel)</label>
                    <input
                        className={inputCls}
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="Esperance, Foi..."
                    />

                    <label className={labelCls}>Date a remplacer</label>
                    <input
                        type="date"
                        className={inputCls}
                        value={pinnedDate}
                        onChange={(e) => setPinnedDate(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Ce verset sera affiche a la place du verset du calendrier
                        ce jour-la.
                    </p>

                    <label className="flex items-center gap-2 mt-4 text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                        Actif
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
