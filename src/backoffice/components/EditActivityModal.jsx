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
    Upload,
    Image,
    Trash2,
} from "lucide-react";
import { API_BASE_URL, FILE_UPLOAD_URL } from "../config/api";

// Modal d'édition d'une activité existante. Couvre les champs textuels
// + le logo de l'entreprise + la galerie photos produit. Les photos
// existantes sont chargées au montage et peuvent être supprimées
// individuellement ; les nouvelles sont uploadées et rattachées au
// submit.
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
        logo: activity.logo || "",
    });

    const [paysOptions, setPaysOptions] = useState([]);
    const [categorieOptions, setCategorieOptions] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

    // Photos existantes : on garde la forme renvoyée par l'API (id + url).
    // Les nouvelles photos uploadées dans ce modal n'ont pas encore d'id ;
    // on les rattache à l'activité au submit via POST /users/.../photos.
    const [existingPhotos, setExistingPhotos] = useState(
        Array.isArray(activity.Photo) ? activity.Photo : [],
    );
    const [newPhotos, setNewPhotos] = useState([]); // [{ url, preview, name }]
    const [photosToDelete, setPhotosToDelete] = useState([]); // [photoId]

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

    // Upload helper — même endpoint que AddActivityForm.
    const uploadFile = async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        const res = await fetch(
            FILE_UPLOAD_URL,
            { method: "POST", body: formDataUpload },
        );
        if (res.status !== 201) throw new Error("Upload échoué");
        const body = await res.json();
        return body.url;
    };

    const handleLogoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";

        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!allowed.includes(file.type)) {
            setErrors((prev) => ({ ...prev, logo: "Format non supporté." }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors((prev) => ({ ...prev, logo: "Le logo dépasse 5MB." }));
            return;
        }
        if (errors.logo) setErrors((prev) => ({ ...prev, logo: "" }));

        setIsUploadingLogo(true);
        try {
            const url = await uploadFile(file);
            setFormData((prev) => ({ ...prev, logo: url }));
        } catch (err) {
            console.error("Erreur upload logo:", err);
            setErrors((prev) => ({ ...prev, logo: "Erreur upload logo." }));
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleProductPhotosChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        e.target.value = "";

        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        const wrongType = files.find((f) => !allowed.includes(f.type));
        const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
        if (wrongType) {
            setErrors((prev) => ({
                ...prev,
                photos: `Format non supporté pour "${wrongType.name}".`,
            }));
            return;
        }
        if (tooBig) {
            setErrors((prev) => ({
                ...prev,
                photos: `"${tooBig.name}" dépasse 5MB.`,
            }));
            return;
        }
        if (errors.photos) setErrors((prev) => ({ ...prev, photos: "" }));

        setIsUploadingPhotos(true);
        try {
            const uploaded = await Promise.all(
                files.map(async (file) => {
                    const url = await uploadFile(file);
                    return { url, preview: URL.createObjectURL(file), name: file.name };
                }),
            );
            setNewPhotos((prev) => [...prev, ...uploaded]);
        } catch (err) {
            console.error("Erreur upload photos:", err);
            setErrors((prev) => ({ ...prev, photos: "Erreur pendant l'upload." }));
        } finally {
            setIsUploadingPhotos(false);
        }
    };

    const removeExistingPhoto = (photoId) => {
        setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setPhotosToDelete((prev) => [...prev, photoId]);
    };

    const removeNewPhoto = (idx) => {
        setNewPhotos((prev) => {
            const next = [...prev];
            const removed = next.splice(idx, 1)[0];
            if (removed?.preview) URL.revokeObjectURL(removed.preview);
            return next;
        });
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
            // 1. Mise à jour des champs de l'activité (logo inclus).
            const res = await fetch(`${API_BASE_URL}/activites/${activity.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });
            if (!res.ok) {
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            }

            // 2. Suppression des photos marquées (non bloquant).
            await Promise.all(
                photosToDelete.map((photoId) =>
                    fetch(
                        `${API_BASE_URL}/activites/${activity.id}/photos/${photoId}`,
                        { method: "DELETE" },
                    ).catch((e) => console.error("Erreur suppression photo:", e)),
                ),
            );

            // 3. Ajout des nouvelles photos.
            if (newPhotos.length > 0 && activity.userId) {
                try {
                    await fetch(
                        `${API_BASE_URL}/users/${activity.userId}/activities/${activity.id}/photos`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(newPhotos.map((p) => p.url)),
                        },
                    );
                } catch (photoErr) {
                    console.error("Erreur ajout nouvelles photos:", photoErr);
                }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                {/* Header sobre — aligné sur EditUserModal */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-600" />
                        Modifier l'activité
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({activity.user?.prenom} {activity.user?.nom}
                            {" • "}
                            {activity.fonction})
                        </span>
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
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

                    {/* Logo entreprise */}
                    <div className="mb-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-sm font-medium text-gray-700">
                                <Building className="w-4 h-4 mr-1 text-blue-600" />
                                Logo de l'entreprise
                                {isUploadingLogo && (
                                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                )}
                            </div>
                            <label
                                htmlFor="logo-edit-upload"
                                className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                    isUploadingLogo
                                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            >
                                <Upload size={12} className="mr-1.5" />
                                {formData.logo ? "Remplacer" : "Téléverser"}
                                <input
                                    id="logo-edit-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    disabled={isUploadingLogo}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        {formData.logo ? (
                            <div className="flex items-center gap-3">
                                <img
                                    src={formData.logo}
                                    alt="Logo"
                                    className="w-20 h-20 object-cover rounded-md border border-gray-200"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 truncate">
                                        {formData.logo}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((p) => ({ ...p, logo: "" }))
                                        }
                                        className="mt-1 text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Retirer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">
                                Aucun logo. JPG, PNG, GIF, WebP — max 5MB.
                            </p>
                        )}
                        {errors.logo && (
                            <p className="text-xs text-red-600 mt-2">{errors.logo}</p>
                        )}
                    </div>

                    {/* Galerie photos produit */}
                    <div className="mb-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-sm font-medium text-gray-700">
                                <Image className="w-4 h-4 mr-1 text-blue-600" />
                                Photos du produit
                                {existingPhotos.length + newPhotos.length > 0 && (
                                    <span className="ml-2 text-xs text-gray-500">
                                        ({existingPhotos.length + newPhotos.length})
                                    </span>
                                )}
                                {isUploadingPhotos && (
                                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                )}
                            </div>
                            <label
                                htmlFor="photos-edit-upload"
                                className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                    isUploadingPhotos
                                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            >
                                <Upload size={12} className="mr-1.5" />
                                Ajouter
                                <input
                                    id="photos-edit-upload"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleProductPhotosChange}
                                    disabled={isUploadingPhotos}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {existingPhotos.length === 0 && newPhotos.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-3">
                                Aucune photo. Plusieurs photos peuvent être uploadées d'un coup.
                            </p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {existingPhotos.map((p) => (
                                    <div
                                        key={`existing-${p.id}`}
                                        className="relative group rounded-md overflow-hidden border border-gray-200"
                                    >
                                        <img
                                            src={p.url}
                                            alt={`Photo ${p.id}`}
                                            className="w-full h-20 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingPhoto(p.id)}
                                            className="absolute top-1 right-1 bg-white/90 hover:bg-red-500 hover:text-white text-red-600 rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Supprimer"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {newPhotos.map((p, idx) => (
                                    <div
                                        key={`new-${idx}-${p.url}`}
                                        className="relative group rounded-md overflow-hidden border-2 border-green-300"
                                        title="Nouveau (sera ajouté à l'enregistrement)"
                                    >
                                        <img
                                            src={p.preview || p.url}
                                            alt={p.name || `Nouvelle photo ${idx + 1}`}
                                            className="w-full h-20 object-cover"
                                        />
                                        <span className="absolute top-1 left-1 text-[10px] font-medium bg-green-500 text-white px-1.5 py-0.5 rounded">
                                            Nouveau
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeNewPhoto(idx)}
                                            className="absolute top-1 right-1 bg-white/90 hover:bg-red-500 hover:text-white text-red-600 rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Annuler"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {errors.photos && (
                            <p className="text-xs text-red-600 mt-2">{errors.photos}</p>
                        )}
                        {photosToDelete.length > 0 && (
                            <p className="text-xs text-amber-600 mt-2">
                                {photosToDelete.length} photo(s) seront supprimées à l'enregistrement.
                            </p>
                        )}
                    </div>

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
                            disabled={isLoading || isUploadingLogo || isUploadingPhotos}
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
