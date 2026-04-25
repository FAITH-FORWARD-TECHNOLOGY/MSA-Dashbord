import React, { useState } from "react";
import {
    X,
    Globe,
    Loader2,
    CheckCircle,
    AlertCircle,
    Plus,
    Flag,
    Hash,
} from "lucide-react";

const PaysFormModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        nom: "",
        code: "",
        flag: "",
    });
    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Formatage spécial pour le code pays (majuscules)
        const formattedValue = name === "code" ? value.toUpperCase() : value;

        setForm((prev) => ({ ...prev, [name]: formattedValue }));

        // Effacer les erreurs lors de la saisie
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (globalError) setGlobalError(null);
    };

    const validateForm = () => {
        const newErrors = {};

        // Validation du nom
        if (!form.nom.trim()) {
            newErrors.nom = "Le nom du pays est requis.";
        } else if (form.nom.trim().length < 2) {
            newErrors.nom = "Le nom doit contenir au moins 2 caractères.";
        } else if (form.nom.trim().length > 100) {
            newErrors.nom = "Le nom ne peut pas dépasser 100 caractères.";
        }

        // Validation du code pays
        if (!form.code.trim()) {
            newErrors.code = "Le code pays est requis.";
        } else if (!/^[1-9]{1,3}$/.test(form.code.trim())) {
            newErrors.code = "Le code doit contenir 1 ou 3 lettres caractere ";
        }

        // Validation du flag (optionnel mais si présent, doit être une URL ou emoji)
        if (form.flag.trim()) {
            const flagValue = form.flag.trim();
            // Vérifier si c'est une URL valide ou un emoji
            const isUrl = /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)$/i.test(
                flagValue
            );
            const isEmoji =
                /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(flagValue) ||
                /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u.test(
                    flagValue
                );

            if (!isUrl && !isEmoji) {
                newErrors.flag =
                    "Le drapeau doit être une URL d'image valide ou un emoji.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalError(null);
        setErrors({});

        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                nom: form.nom.trim(),
                code: form.code.trim(),
                ...(form.flag.trim() && { flag: form.flag.trim() }),
            };

            const res = await fetch("https://api-msa.mydigifinance.com/pays", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(
                    errorData.message ||
                        `Erreur ${res.status}: ${res.statusText}`
                );
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Erreur lors de la création:", err);
            setGlobalError(
                err.message || "Une erreur inattendue s'est produite"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape" && !loading) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) =>
                e.target === e.currentTarget && !loading && onClose()
            }
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-full">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">
                                    Nouveau pays
                                </h3>
                                <p className="text-indigo-100 text-sm">
                                    Ajouter un pays à la liste
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200 disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Global Error Message */}
                    {globalError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-700 font-medium">
                                    Erreur
                                </p>
                                <p className="text-red-600 text-sm">
                                    {globalError}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nom du pays */}
                        <div className="space-y-2">
                            <div className="flex items-center text-sm font-semibold text-gray-700">
                                <Globe
                                    size={16}
                                    className="mr-2 text-indigo-500"
                                />
                                Nom du pays
                                <span className="text-red-500 ml-1">*</span>
                            </div>
                            <div className="relative">
                                <input
                                    name="nom"
                                    type="text"
                                    placeholder="Ex: France, Côte d'Ivoire, Sénégal..."
                                    value={form.nom}
                                    onChange={handleChange}
                                    disabled={loading}
                                    maxLength={100}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        errors.nom
                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                                            : "border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                                    }`}
                                    autoFocus
                                />
                                {form.nom && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                                        {form.nom.length}/100
                                    </div>
                                )}
                            </div>
                            {errors.nom && (
                                <div className="flex items-center space-x-2 mt-2">
                                    <AlertCircle
                                        size={14}
                                        className="text-red-500"
                                    />
                                    <p className="text-red-600 text-sm">
                                        {errors.nom}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Code pays */}
                        <div className="space-y-2">
                            <div className="flex items-center text-sm font-semibold text-gray-700">
                                <Hash
                                    size={16}
                                    className="mr-2 text-indigo-500"
                                />
                                Indicattif pays (ISO)
                                <span className="text-red-500 ml-1">*</span>
                            </div>
                            <div className="relative">
                                <input
                                    name="code"
                                    type="text"
                                    placeholder="Ex: 225..."
                                    value={form.code}
                                    onChange={handleChange}
                                    disabled={loading}
                                    maxLength={3}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase ${
                                        errors.code
                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                                            : "border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                                    }`}
                                />
                                {form.code && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                                        {form.code.length}/3
                                    </div>
                                )}
                            </div>
                            {errors.code && (
                                <div className="flex items-center space-x-2 mt-2">
                                    <AlertCircle
                                        size={14}
                                        className="text-red-500"
                                    />
                                    <p className="text-red-600 text-sm">
                                        {errors.code}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Drapeau */}
                        <div className="space-y-2">
                            <div className="flex items-center text-sm font-semibold text-gray-700">
                                <Flag
                                    size={16}
                                    className="mr-2 text-indigo-500"
                                />
                                Drapeau
                                <span className="text-gray-400 ml-1">
                                    (optionnel)
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    name="flag"
                                    type="text"
                                    placeholder="🇫🇷 ou https://example.com/flag.png"
                                    value={form.flag}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        errors.flag
                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                                            : "border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                                    }`}
                                />
                                {form.flag && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-lg">
                                        {/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(
                                            form.flag
                                        )
                                            ? form.flag
                                            : "🏴"}
                                    </div>
                                )}
                            </div>
                            {errors.flag && (
                                <div className="flex items-center space-x-2 mt-2">
                                    <AlertCircle
                                        size={14}
                                        className="text-red-500"
                                    />
                                    <p className="text-red-600 text-sm">
                                        {errors.flag}
                                    </p>
                                </div>
                            )}
                            <div className="text-xs text-gray-500">
                                Vous pouvez utiliser un emoji drapeau (🇫🇷, 🇨🇮)
                                ou une URL d'image
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    !form.nom.trim() ||
                                    !form.code.trim()
                                }
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Création en cours...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <Plus className="w-5 h-5 mr-2" />
                                        Créer le pays
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer avec info */}
                <div className="px-6 pb-4">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>
                            Le pays sera disponible immédiatement après création
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaysFormModal;
