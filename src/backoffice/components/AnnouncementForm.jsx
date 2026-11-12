import React, { useEffect, useRef, useState } from "react";
import {
    DATE_LABEL_MAX,
    TITLE_MAX,
    announcementToForm,
    buildAnnouncementPayload,
    validateAnnouncementForm,
} from "../utils/announcements";

// Formulaire d'annonce (création et édition), dans une fenêtre modale.
// `announcement` = ligne à modifier, ou null pour une nouvelle annonce.
function AnnouncementForm({ announcement, rubriques, onSubmit, onCancel }) {
    const isEdit = Boolean(announcement);
    const [values, setValues] = useState(() => announcementToForm(announcement));
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const dialogRef = useRef(null);
    const titleRef = useRef(null);

    // Focus sur le titre à l'ouverture, rendu à l'élément d'origine à la fermeture.
    useEffect(() => {
        const previous = document.activeElement;
        titleRef.current?.focus();
        return () => previous?.focus?.();
    }, []);

    const set = (key, value) => {
        setValues((v) => ({ ...v, [key]: value }));
        setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape" && !saving) {
            e.stopPropagation();
            onCancel();
            return;
        }
        if (e.key !== "Tab") return;
        // Le focus reste dans la fenêtre.
        const focusable = dialogRef.current?.querySelectorAll(
            "input, textarea, select, button:not([disabled]), a[href]",
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        if (saving) return;
        const found = validateAnnouncementForm(values);
        setErrors(found);
        const firstInvalid = Object.keys(found)[0];
        if (firstInvalid) {
            dialogRef.current
                ?.querySelector(`#annonce-${firstInvalid}`)
                ?.focus();
            return;
        }
        setSaving(true);
        setSubmitError("");
        try {
            await onSubmit(buildAnnouncementPayload(values));
        } catch (err) {
            setSubmitError(err.message || "Échec de l'enregistrement");
            setSaving(false);
        }
    };

    // Attributs d'accessibilité d'un champ, selon son erreur et son aide.
    const describe = (key, hasHint) => ({
        id: `annonce-${key}`,
        "aria-invalid": errors[key] ? true : undefined,
        "aria-describedby":
            [
                errors[key] ? `annonce-${key}-erreur` : "",
                hasHint ? `annonce-${key}-aide` : "",
            ]
                .filter(Boolean)
                .join(" ") || undefined,
    });

    const fieldError = (key) =>
        errors[key] && (
            <p id={`annonce-${key}-erreur`} className="mt-1 text-sm text-red-700">
                {errors[key]}
            </p>
        );

    const hint = (key, text) => (
        <p id={`annonce-${key}-aide`} className="mt-1 text-xs text-gray-500">
            {text}
        </p>
    );

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <form
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="annonce-titre-fenetre"
                noValidate
                onSubmit={submit}
                onKeyDown={handleKeyDown}
                className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            >
                <h3
                    id="annonce-titre-fenetre"
                    className="text-lg font-bold mb-4 text-gray-800"
                >
                    {isEdit ? "Modifier l’annonce" : "Ajouter une annonce"}
                </h3>

                {submitError && (
                    <div
                        role="alert"
                        className="mb-3 p-3 bg-red-50 text-red-700 rounded text-sm"
                    >
                        {submitError}
                    </div>
                )}

                <div className="mb-3">
                    <label htmlFor="annonce-title" className="text-sm text-gray-700">
                        Titre
                    </label>
                    <input
                        {...describe("title")}
                        ref={titleRef}
                        required
                        maxLength={TITLE_MAX}
                        className="mt-1 w-full border rounded p-2"
                        value={values.title}
                        onChange={(e) => set("title", e.target.value)}
                    />
                    {fieldError("title")}
                </div>

                <div className="mb-3">
                    <label
                        htmlFor="annonce-description"
                        className="text-sm text-gray-700"
                    >
                        Description
                    </label>
                    <textarea
                        {...describe("description")}
                        rows={5}
                        className="mt-1 w-full border rounded p-2"
                        value={values.description}
                        onChange={(e) => set("description", e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="mb-3">
                        <label
                            htmlFor="annonce-eventDate"
                            className="text-sm text-gray-700"
                        >
                            Date de l’évènement
                        </label>
                        <input
                            {...describe("eventDate", true)}
                            type="date"
                            required
                            className="mt-1 w-full border rounded p-2"
                            value={values.eventDate}
                            onChange={(e) => set("eventDate", e.target.value)}
                        />
                        {fieldError("eventDate")}
                        {hint(
                            "eventDate",
                            "Classe l’annonce par mois dans l’application.",
                        )}
                    </div>
                    <div className="mb-3">
                        <label
                            htmlFor="annonce-dateLabel"
                            className="text-sm text-gray-700"
                        >
                            Libellé de date (facultatif)
                        </label>
                        <input
                            {...describe("dateLabel", true)}
                            maxLength={DATE_LABEL_MAX}
                            placeholder="Dimanche 16 nov. à 9h"
                            className="mt-1 w-full border rounded p-2"
                            value={values.dateLabel}
                            onChange={(e) => set("dateLabel", e.target.value)}
                        />
                        {fieldError("dateLabel")}
                        {hint(
                            "dateLabel",
                            "Affiché à la place de la date s’il est rempli.",
                        )}
                    </div>
                </div>

                <div className="mb-3">
                    <label
                        htmlFor="annonce-programUrl"
                        className="text-sm text-gray-700"
                    >
                        Lien vers l’information complète (facultatif)
                    </label>
                    <input
                        {...describe("programUrl")}
                        type="url"
                        inputMode="url"
                        placeholder="https://…"
                        className="mt-1 w-full border rounded p-2"
                        value={values.programUrl}
                        onChange={(e) => set("programUrl", e.target.value)}
                    />
                    {fieldError("programUrl")}
                </div>

                <div className="mb-3">
                    <label
                        htmlFor="annonce-rubriqueId"
                        className="text-sm text-gray-700"
                    >
                        Rubrique (facultative)
                    </label>
                    <select
                        {...describe("rubriqueId")}
                        className="mt-1 w-full border rounded p-2"
                        value={values.rubriqueId}
                        onChange={(e) => set("rubriqueId", e.target.value)}
                    >
                        <option value="">Sans rubrique</option>
                        {rubriques.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>

                <label className="flex items-center gap-2 mb-5">
                    <input
                        type="checkbox"
                        checked={values.isActive}
                        onChange={(e) => set("isActive", e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">
                        Active (visible dans l’application)
                    </span>
                </label>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 text-sm font-medium"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AnnouncementForm;
