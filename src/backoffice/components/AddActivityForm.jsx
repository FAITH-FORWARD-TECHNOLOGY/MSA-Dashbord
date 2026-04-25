import React, { useEffect, useState } from "react";
import {
    X,
    Upload,
    Phone,
    Globe,
    Users,
    Tag,
    MapPin,
    DollarSign,
    Clock,
    Info,
    Building,
    MessageCircle,
    Loader2,
    CheckCircle,
    AlertCircle,
    Image,
} from "lucide-react";

export default function AddActivityModal({ userId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        fonction: "",
        region: "",
        logo: "", // URL du logo après upload
        marque: "",
        description: "",
        telephone: "",
        whatsapp: "",
        tarif: "",
        disponibilite: "",
        siteWeb: "",
        facebook: "",
        instagram: "",
        tiktok: "",
        apropos: "",
        paysId: "",
        categorieId: "",
    });

    const [paysOptions, setPaysOptions] = useState([]);
    const [categorieOptions, setCategorieOptions] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [logoPreview, setLogoPreview] = useState(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [paysRes, categorieRes] = await Promise.all([
                    fetch("https://api-msa.mydigifinance.com/pays").then((r) =>
                        r.json()
                    ),
                    fetch("https://api-msa.mydigifinance.com/categorie").then(
                        (r) => r.json()
                    ),
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

    const validate = () => {
        const newErrors = {};
        const requiredFields = [
            "fonction",
            "region",
            "marque",
            "description",
            "telephone",
            "tarif",
            "disponibilite",
            "paysId",
            "categorieId",
        ];

        requiredFields.forEach((field) => {
            if (!formData[field]) {
                newErrors[field] = "Ce champ est requis.";
            }
        });

        // Validation spécifique pour les URLs
        const urlFields = ["siteWeb", "facebook", "instagram", "tiktok"];
        urlFields.forEach((field) => {
            if (formData[field] && !isValidUrl(formData[field])) {
                newErrors[field] = "Veuillez entrer une URL valide.";
            }
        });

        // Validation pour les numéros de téléphone
        if (formData.telephone && !isValidPhone(formData.telephone)) {
            newErrors.telephone =
                "Veuillez entrer un numéro de téléphone valide.";
        }
        if (formData.whatsapp && !isValidPhone(formData.whatsapp)) {
            newErrors.whatsapp = "Veuillez entrer un numéro WhatsApp valide.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const isValidPhone = (phone) => {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        return phoneRegex.test(phone);
    };

    // Fonction pour uploader le fichier vers l'API
    const uploadFile = async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        try {
            const response = await fetch(
                "https://api-pp.mydigifinance.com/api/v1/file-upload/single",
                {
                    method: "POST",
                    body: formDataUpload,
                    // Pas de Content-Type header - le navigateur le définit automatiquement pour FormData
                }
            );

            // L'API retourne un status 201 pour le succès
            if (response.status !== 201) {
                throw new Error("Erreur lors de l'upload du fichier");
            }

            const result = await response.json();
            console.log("Réponse API upload:", result);

            // Selon votre exemple Dart, l'URL est dans body["url"]
            return result.url;
        } catch (error) {
            console.error("Erreur upload:", error);
            throw error;
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation du fichier
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
            setErrors((prev) => ({
                ...prev,
                logo: "Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.",
            }));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            // 5MB
            setErrors((prev) => ({
                ...prev,
                logo: "Le fichier est trop volumineux. Taille maximale : 5MB.",
            }));
            return;
        }

        // Effacer les erreurs précédentes
        if (errors.logo) {
            setErrors((prev) => ({ ...prev, logo: "" }));
        }

        setSelectedFile(file);
        setIsUploadingLogo(true);

        // Créer un aperçu local
        const reader = new FileReader();
        reader.onload = (e) => {
            setLogoPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        try {
            // Uploader le fichier vers l'API
            const fileUrl = await uploadFile(file);

            // Mettre à jour le formData avec l'URL du fichier
            setFormData((prev) => ({ ...prev, logo: fileUrl }));

            console.log("✅ Image téléchargée avec succès !", fileUrl);
        } catch (error) {
            console.error("❌ Erreur du téléchargement:", error);
            setErrors((prev) => ({
                ...prev,
                logo: "Erreur lors de l'upload du fichier. Veuillez réessayer.",
            }));
            // Réinitialiser en cas d'erreur
            setLogoPreview(null);
            setSelectedFile(null);
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const removeLogo = () => {
        setFormData((prev) => ({ ...prev, logo: "" }));
        setLogoPreview(null);
        setSelectedFile(null);
        // Reset le input file
        const fileInput = document.getElementById("logo-upload");
        if (fileInput) fileInput.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const dataToSend = {
            ...formData,
            paysId: formData.paysId ? parseInt(formData.paysId, 10) : null,
            categorieId: formData.categorieId
                ? parseInt(formData.categorieId, 10)
                : null,
        };

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://api-msa.mydigifinance.com/users/${userId}/activities`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(dataToSend),
                }
            );

            if (!response.ok) {
                throw new Error("Erreur lors de l'ajout de l'activité");
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Erreur lors de l'ajout:", error);
            setErrors({
                submit: "Une erreur est survenue. Veuillez réessayer.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Effacer l'erreur du champ modifié
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const fieldConfig = [
        {
            name: "fonction",
            label: "Fonction",
            icon: Users,
            type: "text",
            placeholder: "Ex: Développeur, Designer, Chef...",
            required: true,
        },
        {
            name: "region",
            label: "Région",
            icon: MapPin,
            type: "text",
            placeholder: "Ex: Abidjan, Dakar, Lomé...",
            required: true,
        },

        {
            name: "apropos",
            label: "À propos",
            icon: Info,
            type: "textarea",
            placeholder: "Parlez-nous de votre parcours, vos valeurs...",
            required: false,
        },

        {
            name: "description",
            label: "Description",
            icon: Info,
            type: "textarea",
            placeholder: "Décrivez brièvement votre activité...",
            required: true,
        },
        {
            name: "marque",
            label: "Marque",
            icon: Building,
            type: "text",
            placeholder: "Nom de votre marque ou entreprise",
            required: false,
        },
        {
            name: "telephone",
            label: "Téléphone",
            icon: Phone,
            type: "tel",
            placeholder: "+225 XX XX XX XX XX",
            required: true,
        },
        {
            name: "whatsapp",
            label: "WhatsApp",
            icon: MessageCircle,
            type: "tel",
            placeholder: "+225 XX XX XX XX XX",
            required: false,
        },
        {
            name: "tarif",
            label: "Tarif",
            icon: DollarSign,
            type: "text",
            placeholder: "Ex: 50 000 FCFA, À partir de 25€...",
            required: true,
        },
        {
            name: "disponibilite",
            label: "Disponibilité",
            icon: Clock,
            type: "text",
            placeholder: "Ex: Lun-Ven 8h-18h, 24h/24...",
            required: true,
        },
        {
            name: "siteWeb",
            label: "Site Web",
            icon: Globe,
            type: "url",
            placeholder: "https://votresite.com",
            required: false,
        },
        {
            name: "facebook",
            label: "Facebook",
            icon: Globe,
            type: "url",
            placeholder: "https://facebook.com/votrepage",
            required: false,
        },
        {
            name: "instagram",
            label: "Instagram",
            icon: Globe,
            type: "url",
            placeholder: "https://instagram.com/votrepage",
            required: false,
        },
        {
            name: "tiktok",
            label: "TikTok",
            icon: Globe,
            type: "url",
            placeholder: "https://tiktok.com/@votrepage",
            required: false,
        },
    ];

    if (isDataLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-gray-600">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-br from-white to-gray-50 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 flex items-center">
                                Nouvelle activité
                            </h2>
                            <p className="text-indigo-100">
                                Associer une nouvelle activité à l'utilisateur
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200 flex-shrink-0"
                            disabled={isLoading}
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {errors.submit && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-red-700">{errors.submit}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Logo Upload Section */}
                        <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300">
                            <div className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                                <Upload
                                    size={16}
                                    className="mr-2 text-indigo-500"
                                />
                                Logo de l'entreprise
                                {isUploadingLogo && (
                                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                )}
                            </div>

                            {!logoPreview ? (
                                <div className="text-center">
                                    <div className="mx-auto w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
                                        <Image
                                            size={32}
                                            className="text-gray-400"
                                        />
                                    </div>
                                    <label
                                        htmlFor="logo-upload"
                                        className="cursor-pointer"
                                    >
                                        <div
                                            className={`inline-flex items-center px-6 py-3 rounded-xl transition-colors duration-200 ${
                                                isUploadingLogo
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                            }`}
                                        >
                                            <Upload
                                                size={16}
                                                className="mr-2"
                                            />
                                            {isUploadingLogo
                                                ? "Upload en cours..."
                                                : "Choisir un fichier"}
                                        </div>
                                        <input
                                            id="logo-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={isUploadingLogo}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">
                                        JPG, PNG, GIF ou WebP • Max 5MB
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img
                                            src={logoPreview}
                                            alt="Aperçu du logo"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedFile?.name ||
                                                "Logo uploadé"}
                                        </p>
                                        {selectedFile && (
                                            <p className="text-xs text-gray-500">
                                                {(
                                                    selectedFile.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(2)}{" "}
                                                MB
                                            </p>
                                        )}
                                        {formData.logo && (
                                            <p className="text-xs text-green-600 flex items-center mt-1">
                                                <CheckCircle
                                                    size={12}
                                                    className="mr-1"
                                                />
                                                ✅ Image téléchargée avec succès
                                                !
                                            </p>
                                        )}
                                        <div className="flex space-x-2 mt-2">
                                            <label
                                                htmlFor="logo-upload"
                                                className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                            >
                                                Changer
                                                <input
                                                    id="logo-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    disabled={isUploadingLogo}
                                                    className="hidden"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={removeLogo}
                                                disabled={isUploadingLogo}
                                                className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {errors.logo && (
                                <div className="mt-3 flex items-center space-x-2">
                                    <AlertCircle
                                        size={14}
                                        className="text-red-500"
                                    />
                                    <p className="text-sm text-red-600">
                                        {errors.logo}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Main Fields Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {fieldConfig.map((field) => {
                                const Icon = field.icon;
                                return (
                                    <div key={field.name} className="group">
                                        <div className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                            <Icon
                                                size={16}
                                                className="mr-2 text-indigo-500"
                                            />
                                            {field.label}
                                            {field.required && (
                                                <span className="text-red-500 ml-1">
                                                    *
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            {field.type === "textarea" ? (
                                                <textarea
                                                    name={field.name}
                                                    value={formData[field.name]}
                                                    onChange={handleChange}
                                                    placeholder={
                                                        field.placeholder
                                                    }
                                                    rows={3}
                                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none ${
                                                        errors[field.name]
                                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                                                            : "border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                                                    }`}
                                                />
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    name={field.name}
                                                    value={formData[field.name]}
                                                    onChange={handleChange}
                                                    placeholder={
                                                        field.placeholder
                                                    }
                                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                                        errors[field.name]
                                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                                                            : "border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                                                    }`}
                                                />
                                            )}
                                        </div>
                                        {errors[field.name] && (
                                            <div className="mt-2 flex items-center space-x-2">
                                                <AlertCircle
                                                    size={14}
                                                    className="text-red-500"
                                                />
                                                <p className="text-sm text-red-600">
                                                    {errors[field.name]}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Select Fields */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                            <div className="group">
                                <div className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                    <Globe
                                        size={16}
                                        className="mr-2 text-indigo-500"
                                    />
                                    Pays
                                    <span className="text-red-500 ml-1">*</span>
                                </div>
                                <select
                                    name="paysId"
                                    value={formData.paysId}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white ${
                                        errors.paysId
                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                                            : "border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                                    }`}
                                >
                                    <option value="">Choisir un pays</option>
                                    {paysOptions.map((pays) => (
                                        <option key={pays.id} value={pays.id}>
                                            {pays.nom}
                                        </option>
                                    ))}
                                </select>
                                {errors.paysId && (
                                    <div className="mt-2 flex items-center space-x-2">
                                        <AlertCircle
                                            size={14}
                                            className="text-red-500"
                                        />
                                        <p className="text-sm text-red-600">
                                            {errors.paysId}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="group">
                                <div className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                    <Tag
                                        size={16}
                                        className="mr-2 text-indigo-500"
                                    />
                                    Catégorie
                                    <span className="text-red-500 ml-1">*</span>
                                </div>
                                <select
                                    name="categorieId"
                                    value={formData.categorieId}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white ${
                                        errors.categorieId
                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                                            : "border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                                    }`}
                                >
                                    <option value="">
                                        Choisir une catégorie
                                    </option>
                                    {categorieOptions.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nom}
                                        </option>
                                    ))}
                                </select>
                                {errors.categorieId && (
                                    <div className="mt-2 flex items-center space-x-2">
                                        <AlertCircle
                                            size={14}
                                            className="text-red-500"
                                        />
                                        <p className="text-sm text-red-600">
                                            {errors.categorieId}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading || isUploadingLogo}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Ajout en cours...
                                    </div>
                                ) : isUploadingLogo ? (
                                    <div className="flex items-center">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Upload en cours...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Ajouter l'activité
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
