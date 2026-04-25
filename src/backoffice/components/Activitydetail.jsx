import React, { useEffect, useState } from "react";
import ImageUploader from "./ImageUpload";

// Modal pour afficher les détails de l'activité
export default function ActivityDetailModal({ activity, onClose, onUpdate }) {
    const [newExpertise, setNewExpertise] = useState("");
    const [addingExpertise, setAddingExpertise] = useState(false);
    const [showExpertiseForm, setShowExpertiseForm] = useState(false);
    const [expertises, setExpertises] = useState(activity?.expertise || []);
    const [newPhotoUrl, setNewPhotoUrl] = useState("");
    const [addingPhoto, setAddingPhoto] = useState(false);
    const [showPhotoForm, setShowPhotoForm] = useState(false);
    const [photos, setPhotos] = useState(activity?.Photo || []);
    const [imageUrls, setImageUrls] = useState([]);
    if (!activity) return null;

    const addPhoto = async () => {
        if (!imageUrls.length || addingPhoto) return;

        setAddingPhoto(true);

        try {
            const response = await fetch(
                `https://api-msa.mydigifinance.com/users/${activity.userId}/activities/${activity.id}/photos`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(imageUrls),
                }
            );

            if (response.ok) {
                const newPhoto = await response.json();
                setPhotos([...photos, newPhoto]);
                setNewPhotoUrl("");
                setShowPhotoForm(false);
                // Mettre à jour l'activité dans le composant parent
                if (onUpdate) onUpdate();
            } else {
                alert("Erreur lors de l'ajout de la photo");
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de l'ajout de la photo");
        } finally {
            setAddingPhoto(false);
        }
    };
    const handleImagesChange = (urls) => {
        console.log("URLs des images:", urls);
        setImageUrls(urls);
    };
    const handlePhotoKeyPress = (e) => {
        if (e.key === "Enter") {
            addPhoto();
        }
    };

    const addExpertise = async () => {
        if (!newExpertise.trim() || addingExpertise) return;

        setAddingExpertise(true);
        try {
            const response = await fetch(
                `https://api-msa.mydigifinance.com/users/${activity.userId}/activities/expertise`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nom: newExpertise.trim(),
                        activiteId: activity.id,
                    }),
                }
            );

            if (response.ok) {
                const newExp = await response.json();
                setExpertises([...expertises, newExp]);
                setNewExpertise("");
                setShowExpertiseForm(false);
                // Mettre à jour l'activité dans le composant parent
                if (onUpdate) onUpdate();
            } else {
                alert("Erreur lors de l'ajout de l'expertise");
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de l'ajout de l'expertise");
        } finally {
            setAddingExpertise(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            addExpertise();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header du modal */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {activity.fonction}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Contenu du modal */}
                <div className="p-6 space-y-6">
                    {/* Logo et infos principales */}
                    <div className="flex items-start gap-4">
                        {activity.logo && (
                            <img
                                src={activity.logo}
                                alt={activity.marque}
                                className="w-16 h-16 object-cover rounded-lg border"
                            />
                        )}
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {activity.marque}
                            </h3>
                            <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mt-1">
                                {activity.categorie?.nom}
                            </span>
                            <div className="flex items-center gap-2 mt-2">
                                <img
                                    src={activity.pays?.flag}
                                    alt={activity.pays?.nom}
                                    className="w-6 h-4 object-cover rounded"
                                />
                                <span className="text-gray-600">
                                    {activity.pays?.nom}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {activity.description && (
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Description
                            </h4>
                            <p className="text-gray-700">
                                {activity.description}
                            </p>
                        </div>
                    )}

                    {/* À propos */}
                    {activity.apropos && (
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                                À propos
                            </h4>
                            <p className="text-gray-700">{activity.apropos}</p>
                        </div>
                    )}

                    {/* Informations de contact */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                            Informations de contact
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 font-medium">
                                        📍 Région:
                                    </span>
                                    <span className="text-gray-900">
                                        {activity.region}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 font-medium">
                                        📞 Téléphone:
                                    </span>
                                    <a
                                        href={`tel:${activity.telephone}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {activity.telephone}
                                    </a>
                                </div>
                                {activity.whatsapp && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600 font-medium">
                                            💬 WhatsApp:
                                        </span>
                                        <a
                                            href={`https://wa.me/${activity.whatsapp.replace(
                                                /\D/g,
                                                ""
                                            )}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-green-600 hover:underline"
                                        >
                                            {activity.whatsapp}
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 font-medium">
                                        💰 Tarif:
                                    </span>
                                    <span className="text-gray-900">
                                        {activity.tarif}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 font-medium">
                                        ⏰ Disponibilité:
                                    </span>
                                    <span className="text-gray-900">
                                        {activity.disponibilite}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Photos */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-900">
                                Photos
                            </h4>
                            <button
                                onClick={() => setShowPhotoForm(!showPhotoForm)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                                <span>{showPhotoForm ? "−" : "+"}</span>
                                {showPhotoForm ? "Annuler" : "Ajouter"}
                            </button>
                        </div>

                        {/* Galerie de photos */}
                        {photos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                {photos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        className="relative group"
                                    >
                                        <img
                                            src={photo?.url}
                                            alt="Photo de l'activité"
                                            className="w-full h-32 object-cover rounded-lg border cursor-pointer transition-transform hover:scale-105"
                                            onClick={() =>
                                                window.open(photo.url, "_blank")
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm mb-4">
                                Aucune photo ajoutée pour cette activité.
                            </p>
                        )}

                        {/* Formulaire d'ajout de photo (conditionnel) */}
                        {showPhotoForm && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ajouter une nouvelle photo
                                </label>
                                <div className="flex item-center justify-center flex-col gap-2">
                                    <ImageUploader
                                        maxImages={4 - photos.length}
                                        onImagesChange={handleImagesChange}
                                        className="border border-gray-200 rounded-lg p-4"
                                    />
                                    <button
                                        onClick={addPhoto}
                                        disabled={
                                            !imageUrls.length || addingPhoto
                                        }
                                        className="bg-purple-600 hover:bg-purple-700 mx-auto disabled:bg-gray-400 md:w-[50%]  disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {addingPhoto ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Ajout...
                                            </>
                                        ) : (
                                            <>
                                                <span>📷</span>
                                                Ajouter
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Entrez l'URL complète d'une image (jpg, png,
                                    gif, etc.)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Expertises */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-900">
                                Expertises
                            </h4>
                            <button
                                onClick={() =>
                                    setShowExpertiseForm(!showExpertiseForm)
                                }
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                                <span>{showExpertiseForm ? "−" : "+"}</span>
                                {showExpertiseForm ? "Annuler" : "Ajouter"}
                            </button>
                        </div>

                        {/* Liste des expertises existantes */}
                        {expertises.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {expertises.map((exp) => (
                                    <span
                                        key={exp.id}
                                        className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                                    >
                                        {exp.nom}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm mb-4">
                                Aucune expertise ajoutée pour cette activité.
                            </p>
                        )}

                        {/* Formulaire d'ajout d'expertise (conditionnel) */}
                        {showExpertiseForm && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ajouter une nouvelle expertise
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newExpertise}
                                        onChange={(e) =>
                                            setNewExpertise(e.target.value)
                                        }
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ex: Maçonnerie, Plomberie, Design..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={addingExpertise}
                                        autoFocus
                                    />
                                    <button
                                        onClick={addExpertise}
                                        disabled={
                                            !newExpertise.trim() ||
                                            addingExpertise
                                        }
                                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {addingExpertise ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Ajout...
                                            </>
                                        ) : (
                                            <>
                                                <span>+</span>
                                                Ajouter
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Liens sociaux et web */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                            Liens
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {activity.siteWeb && (
                                <a
                                    href={activity.siteWeb}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    🌐 Site Web
                                </a>
                            )}
                            {activity.facebook && (
                                <a
                                    href={activity.facebook}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    📘 Facebook
                                </a>
                            )}
                            {activity.instagram && (
                                <a
                                    href={activity.instagram}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    📷 Instagram
                                </a>
                            )}
                            {activity.tiktok && (
                                <a
                                    href={activity.tiktok}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    🎵 TikTok
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
