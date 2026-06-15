import React, { useState } from "react";
import { X, Tag, Loader2, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { API_BASE_URL } from "../config/api";

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
                `${API_BASE_URL}/categorie`,
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
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header sobre — aligné sur EditUserModal */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Tag className="w-5 h-5 mr-2 text-blue-600" />
                        Nouvelle catégorie
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
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
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !form.nom.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Création en cours…
                                    </>
                                ) : (
                                    "Créer la catégorie"
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
