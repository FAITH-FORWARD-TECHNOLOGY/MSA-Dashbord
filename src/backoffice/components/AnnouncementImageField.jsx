import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { validateImageFile } from "../utils/announcements";

const buttonClass =
    "inline-flex items-center gap-2 px-3 py-2 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50";

// Image d'une annonce : envoi sur le backend MSA, aperçu, remplacement, retrait.
// `value` = URL renvoyée par le serveur ; `onUpload(file)` renvoie cette URL.
function AnnouncementImageField({
    value,
    onChange,
    onUpload,
    onBusyChange,
    invalid,
    describedBy,
    disabled,
}) {
    const [uploading, setUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState("");
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const inputRef = useRef(null);
    const chooseRef = useRef(null);

    // L'aperçu local est libéré dès qu'il n'est plus affiché.
    useEffect(() => () => localPreview && URL.revokeObjectURL(localPreview), [localPreview]);

    const setBusy = (busy) => {
        setUploading(busy);
        onBusyChange?.(busy);
    };

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // le même fichier peut être rechoisi
        if (!file) return;
        const problem = validateImageFile(file);
        if (problem) {
            setError(problem);
            return;
        }
        setError("");
        setStatus("Envoi de l’image en cours…");
        setLocalPreview(URL.createObjectURL(file));
        setBusy(true);
        try {
            onChange(await onUpload(file));
            setStatus("Image envoyée.");
        } catch (err) {
            setError(err.message || "Échec de l’envoi de l’image.");
            setStatus("");
        } finally {
            setLocalPreview("");
            setBusy(false);
        }
    };

    const remove = () => {
        onChange("");
        setError("");
        setStatus("Image retirée.");
        chooseRef.current?.focus();
    };

    const preview = localPreview || value;

    return (
        <div>
            {preview && (
                <div className="relative mt-1 mb-2 rounded border border-gray-200 bg-gray-50 overflow-hidden">
                    <img
                        src={preview}
                        alt="Aperçu de l’image de l’annonce"
                        className="w-full max-h-56 object-contain"
                    />
                    {uploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm text-gray-700">
                            Envoi en cours…
                        </div>
                    )}
                </div>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
                <button
                    type="button"
                    id="annonce-imageUrl"
                    ref={chooseRef}
                    className={buttonClass}
                    // aria-disabled pendant l'envoi : le bouton garde le focus clavier.
                    onClick={() => !uploading && inputRef.current?.click()}
                    disabled={disabled}
                    aria-disabled={uploading || undefined}
                    aria-invalid={invalid ? true : undefined}
                    aria-describedby={describedBy}
                >
                    <ImagePlus size={16} aria-hidden="true" />
                    {value ? "Remplacer l’image" : "Choisir une image"}
                </button>
                {value && !uploading && (
                    <button
                        type="button"
                        className={`${buttonClass} hover:text-red-700`}
                        onClick={remove}
                        disabled={disabled}
                    >
                        <Trash2 size={16} aria-hidden="true" />
                        Retirer l’image
                    </button>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={handleFile}
            />
            <p className="sr-only" role="status" aria-live="polite">
                {status}
            </p>
            {error && (
                <p role="alert" className="mt-1 text-sm text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
}

export default AnnouncementImageField;
