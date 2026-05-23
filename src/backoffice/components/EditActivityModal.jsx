import React, { useEffect, useState } from "react";
import {
    X,
    Phone,
    Globe,
    Users,
    MapPin,
    DollarSign,
    Clock,
    Info,
    Building,
    MessageCircle,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";

// Modal d'édition d'une activité existante. Couvre les champs textuels
// (fonction, contact, tarif, disponibilité, réseaux, etc.). Le logo, les
// expertises et les photos restent gérés via leur flow dédié dans le profil
// utilisateur — on évite de tout entasser dans un seul modal.
export default function EditActivityModal({ activity, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        fonction: activity.fonction || "",
        region: activity.region || "",
        marque: activity.marque || "",
        description: activity.description || "",
        apropos: activity.apropos || "",
        telephone: activity.telephone || "",
        whatsapp: activity.whatsapp || "",
        tarif: activity.tarif || "",
        disponibilite: activity.disponibilite || "",
        siteWeb: activity.siteWeb || "",
        facebook: activity.facebook || "",
        instagram: activity.instagram || "",
        tiktok: activity.tiktok || "",
        paysId: activity.paysId || activity.pays?.id || "",
        categorieId: activity.categorieId || activity.categorie?.id || "",
    });

    const [paysOptions, setPaysOptions] = useState([]);
    const [categorieOptions, setCategorieOptions] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [paysRes, categorieRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/pays`).then((r) => r.json()),
                    fetch(`${API_BASE_URL}/categorie`).then((r) => r.json()),
                ]);
                setPaysOptions(paysRes);
                setCategorieOptions(categorieRes);
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors = {};
        const required = [
            "fonction",
            "region",
            "description",
            "telephone",
            "tarif",
            "disponibilite",
            "paysId",
            "categorieId",
        ];
        required.forEach((field) => {
            if (!formData[field] && formData[field] !== 0) {
                newErrors[field] = "Ce champ est requis.";
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const dataToSend = {
            ...formData,
            paysId: formData.paysId ? parseInt(formData.paysId, 10) : undefined,
            categorieId: formData.categorieId
                ? parseInt(formData.categorieId, 10)
                : undefined,
        };

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/activites/${activity.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });
            if (!res.ok) {
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Erreur lors de la modification:", error);
            setErrors({
                submit: "Une erreur est survenue. Veuillez réessayer.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fieldConfig = [
        { name: "fonction", label: "Fonction", icon: Users, type: "text", required: true },
        { name: "region", label: "Région", icon: MapPin, type: "text", required: true },
        { name: "marque", label: "Marque", icon: Building, type: "text" },
        { name: "telephone", label: "Téléphone", icon: Phone, type: "tel", required: true },
        { name: "whatsapp", label: "WhatsApp", icon: MessageCircle, type: "tel" },
        { name: "tarif", label: "Tarif", icon: DollarSign, type: "text", required: true },
        { name: "disponibilite", label: "Disponibilité", icon: Clock, type: "text", required: true },
        { name: "siteWeb", label: "Site Web", icon: Globe, type: "url" },
        { name: "facebook", label: "Facebook", icon: Globe, type: "url" },
        { name: "instagram", label: "Instagram", icon: Globe, type: "url" },
        { name: "tiktok", label: "TikTok", icon: Globe, type: "url" },
    ];

    if (isDataLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-gray-600">Chargement…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">
                            Modifier l'activité
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            {activity.user?.prenom} {activity.user?.nom}
                            {" • "}
                            {activity.fonction}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full"
                        disabled={isLoading}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                    {errors.submit && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{errors.submit}</p>
                        </div>
                    )}

                    {/* Description + À propos en pleine largeur */}
                    <div className="mb-4">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            <Info className="w-4 h-4 mr-1 text-blue-600" />
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.description && (
                            <p className="text-xs text-red-600 mt-1">{errors.description}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            <Info className="w-4 h-4 mr-1 text-blue-600" />
                            À propos
                        </label>
                        <textarea
                            name="apropos"
                            value={formData.apropos}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Pays + Catégorie (selects) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Pays *
                            </label>
                            <select
                                name="paysId"
                                value={formData.paysId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Choisir un pays…</option>
                                {paysOptions.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nom}
                                    </option>
                                ))}
                            </select>
                            {errors.paysId && (
                                <p className="text-xs text-red-600 mt-1">{errors.paysId}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Catégorie *
                            </label>
                            <select
                                name="categorieId"
                                value={formData.categorieId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Choisir une catégorie…</option>
                                {categorieOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nom}
                                    </option>
                                ))}
                            </select>
                            {errors.categorieId && (
                                <p className="text-xs text-red-600 mt-1">{errors.categorieId}</p>
                            )}
                        </div>
                    </div>

                    {/* Champs texte génériques */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fieldConfig.map((field) => {
                            const Icon = field.icon;
                            return (
                                <div key={field.name}>
                                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                                        <Icon className="w-4 h-4 mr-1 text-blue-600" />
                                        {field.label}
                                        {field.required && " *"}
                                    </label>
                                    <input
                                        name={field.name}
                                        type={field.type}
                                        value={formData[field.name]}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors[field.name] && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {errors[field.name]}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                        >
                            {isLoading && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            {isLoading ? "Enregistrement…" : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
