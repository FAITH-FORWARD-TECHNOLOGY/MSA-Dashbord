import React, { useState, useRef } from "react";

const ImageUploader = ({
    maxImages = 4,
    onImagesChange,
    initialImages = [],
    className = "",
    disabled = false,
}) => {
    const [images, setImages] = useState(initialImages);
    const [uploadingStates, setUploadingStates] = useState({});
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    // Fonction pour uploader un seul fichier
    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(
                "https://api-pp.mydigifinance.com/api/v1/file-upload/single",
                {
                    method: "POST",
                    body: formData,
                    // headers: {
                    //     'Authorization': 'Bearer YOUR_TOKEN_HERE'
                    // }
                }
            );

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();

            // Adapter selon la structure de réponse de votre API
            const imageUrl =
                result.url ||
                result.file_url ||
                result.data?.url ||
                result.link;

            if (!imageUrl) {
                throw new Error("URL de l'image non trouvée dans la réponse");
            }

            return imageUrl;
        } catch (error) {
            console.error("Erreur upload:", error);
            throw error;
        }
    };

    // Validation du fichier
    const validateFile = (file) => {
        const validTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
        ];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            return "Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.";
        }

        if (file.size > maxSize) {
            return "Fichier trop volumineux. Maximum 5MB.";
        }

        return null;
    };

    // Gestion de la sélection de fichiers
    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files);
        const remainingSlots = maxImages - images.length;

        if (files.length > remainingSlots) {
            alert(
                `Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s).`
            );
            return;
        }

        // Traitement de chaque fichier
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileId = `temp-${Date.now()}-${i}`;

            // Validation
            const validationError = validateFile(file);
            if (validationError) {
                setErrors((prev) => ({ ...prev, [fileId]: validationError }));
                continue;
            }

            // Créer un aperçu local immédiat
            const reader = new FileReader();
            reader.onload = (e) => {
                const tempImage = {
                    id: fileId,
                    url: e.target.result, // URL locale pour l'aperçu
                    isTemp: true,
                    file: file,
                };

                setImages((prev) => {
                    const newImages = [...prev, tempImage];
                    return newImages;
                });
            };
            reader.readAsDataURL(file);

            // Commencer l'upload
            setUploadingStates((prev) => ({ ...prev, [fileId]: true }));

            try {
                const uploadedUrl = await uploadFile(file);

                // Remplacer l'image temporaire par l'image uploadée
                setImages((prev) => {
                    const newImages = prev.map((img) =>
                        img.id === fileId
                            ? { id: fileId, url: uploadedUrl, isTemp: false }
                            : img
                    );

                    // Notifier le parent avec seulement les URLs finales
                    const finalUrls = newImages
                        .filter((img) => !img.isTemp)
                        .map((img) => img.url);
                    onImagesChange && onImagesChange(finalUrls);

                    return newImages;
                });

                // Nettoyer les états
                setUploadingStates((prev) => {
                    const newStates = { ...prev };
                    delete newStates[fileId];
                    return newStates;
                });
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[fileId];
                    return newErrors;
                });
            } catch (error) {
                setErrors((prev) => ({
                    ...prev,
                    [fileId]: `Erreur d'upload: ${error.message}`,
                }));
                setUploadingStates((prev) => {
                    const newStates = { ...prev };
                    delete newStates[fileId];
                    return newStates;
                });

                // Supprimer l'image temporaire en cas d'erreur
                setImages((prev) => prev.filter((img) => img.id !== fileId));
            }
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Supprimer une image
    const removeImage = (imageId) => {
        setImages((prev) => {
            const newImages = prev.filter((img) => img.id !== imageId);

            // Notifier le parent
            const finalUrls = newImages
                .filter((img) => !img.isTemp)
                .map((img) => img.url);
            onImagesChange && onImagesChange(finalUrls);

            return newImages;
        });

        // Nettoyer les états
        setUploadingStates((prev) => {
            const newStates = { ...prev };
            delete newStates[imageId];
            return newStates;
        });
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[imageId];
            return newErrors;
        });
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Zone d'upload */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Images ({images.length}/{maxImages})
                </label>

                {images.length < maxImages && (
                    <div
                        onClick={() =>
                            !disabled && fileInputRef.current?.click()
                        }
                        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            disabled
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:border-blue-400 hover:bg-blue-50"
                        }`}
                    >
                        <div className="space-y-2">
                            <div className="text-4xl">📷</div>
                            <p className="text-gray-600">
                                Cliquez pour ajouter des images
                            </p>
                            <p className="text-xs text-gray-500">
                                JPG, PNG, GIF, WebP - Max 5MB chacune
                            </p>
                            <p className="text-xs text-gray-500">
                                {maxImages - images.length} emplacement(s)
                                restant(s)
                            </p>
                        </div>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    disabled={disabled}
                    className="hidden"
                />
            </div>

            {/* Galerie des images */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image) => (
                        <div key={image.id} className="relative group">
                            <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                    src={image.url}
                                    alt="Upload preview"
                                    className="w-full h-full object-cover"
                                />

                                {/* Overlay de chargement */}
                                {uploadingStates[image.id] && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                                            <p className="text-xs">Upload...</p>
                                        </div>
                                    </div>
                                )}

                                {/* Badge de statut */}
                                {!uploadingStates[image.id] && (
                                    <div
                                        className={`absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded ${
                                            image.isTemp
                                                ? "bg-yellow-500 text-white"
                                                : "bg-green-500 text-white"
                                        }`}
                                    >
                                        {image.isTemp ? "En cours" : "OK"}
                                    </div>
                                )}

                                {/* Bouton de suppression */}
                                {!disabled && (
                                    <button
                                        onClick={() => removeImage(image.id)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-bold hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Erreur */}
                            {errors[image.id] && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors[image.id]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Résumé */}
            {images.length > 0 && (
                <div className="text-sm text-gray-500">
                    {images.filter((img) => !img.isTemp).length} image(s)
                    uploadée(s) avec succès
                    {Object.keys(uploadingStates).length > 0 && (
                        <span className="text-blue-600 ml-2">
                            • {Object.keys(uploadingStates).length} en cours
                            d'upload
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
