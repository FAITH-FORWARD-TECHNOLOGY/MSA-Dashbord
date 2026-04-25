import React, { useState } from "react";
import { X, Tag, Loader2, CheckCircle, AlertCircle, Plus } from "lucide-react";

const CategorieFormModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        nom: "",
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fieldError, setFieldError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));

        // Effacer les erreurs lors de la saisie
        if (fieldError) setFieldError("");
        if (error) setError(null);
    };

    const validateForm = () => {
        if (!form.nom.trim()) {
            setFieldError("Le nom de la catégorie est requis.");
            return false;
        }

        if (form.nom.trim().length < 2) {
            setFieldError("Le nom doit contenir au moins 2 caractères.");
            return false;
        }

        if (form.nom.trim().length > 50) {
            setFieldError("Le nom ne peut pas dépasser 50 caractères.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setFieldError("");

        if (!validateForm()) return;

        setLoading(true);
        try {
            const res = await fetch(
                "https://api-msa.mydigifinance.com/categorie",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nom: form.nom.trim() }),
                }
            );

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
            setError(err.message || "Une erreur inattendue s'est produite");
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
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-full">
                                <Tag size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">
                                    Nouvelle catégorie
                                </h3>
                                <p className="text-indigo-100 text-sm">
                                    Ajouter une catégorie d'activité
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
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-700 font-medium">
                                    Erreur
                                </p>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center text-sm font-semibold text-gray-700">
                                <Tag
                                    size={16}
                                    className="mr-2 text-indigo-500"
                                />
                                Nom de la catégorie
                                <span className="text-red-500 ml-1">*</span>
                            </div>
                            <div className="relative">
                                <input
                                    name="nom"
                                    type="text"
                                    placeholder="Ex: Restaurant, Hôtel, Transport..."
                                    value={form.nom}
                                    onChange={handleChange}
                                    disabled={loading}
                                    maxLength={50}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        fieldError
                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                                            : "border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                                    }`}
                                    autoFocus
                                />
                                {form.nom && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                                        {form.nom.length}/50
                                    </div>
                                )}
                            </div>
                            {fieldError && (
                                <div className="flex items-center space-x-2 mt-2">
                                    <AlertCircle
                                        size={14}
                                        className="text-red-500"
                                    />
                                    <p className="text-red-600 text-sm">
                                        {fieldError}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
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
                                disabled={loading || !form.nom.trim()}
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
                                        Créer la catégorie
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
                            La catégorie sera disponible immédiatement après
                            création
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategorieFormModal;
