import React, { useState } from "react";
import { X } from "lucide-react";

// Modal simple basique pour créer/éditer une destination de covoiturage.
// Reprise sur CelluleFormModal : fond sombre, carte blanche centrée,
// champs simples, pas de gradients ni de couleurs flashy.
function RideDestinationFormModal({ destination, onClose, onSubmit }) {
    const isEdit = Boolean(destination);
    // Formate une date ISO (venant de l'API) en string "YYYY-MM-DD"
    // pour les inputs HTML type="date" qui attendent ce format précis.
    const toDateInput = (d) => {
        if (!d) return "";
        const date = new Date(d);
        return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
    };

    const [formData, setFormData] = useState({
        name: destination?.name ?? "",
        type: destination?.type ?? "lieu_de_culte",
        locationLink: (() => {
            if (destination?.latitude != null && destination?.longitude != null) {
                return `https://maps.google.com/?q=${destination.latitude},${destination.longitude}`;
            }
            return "";
        })(),
        isActive: destination?.isActive ?? true,
        // Dates début/fin pour les événements
        startDate: toDateInput(destination?.startDate),
        endDate: toDateInput(destination?.endDate),
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        if (error) setError("");
    };

    // Extrait lat/lng d'un lien Google Maps (si possible).
    // Supporte les formats : ?q=5.36,-4.00  /  @5.36,-4.00  /  place/5.36,-4.00
    // Extrait lat/lng d'un lien Google Maps.
    // Supporte : ?q=lat,lng  @lat,lng  place/lat,lng
    // Note : les liens raccourcis (maps.app.goo.gl) ne marchent pas,
    // il faut coller le lien complet avec les coordonnées visibles.
    const parseCoordsFromLink = (link) => {
        if (!link) return { latitude: null, longitude: null };
        const patterns = [
            /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
            /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
            /place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        ];
        for (const regex of patterns) {
            const m = link.match(regex);
            if (m) {
                return {
                    latitude: parseFloat(m[1]),
                    longitude: parseFloat(m[2]),
                };
            }
        }
        return { latitude: null, longitude: null };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError("Le nom de la destination est obligatoire");
            return;
        }

        // Pour les événements la date de fin est obligatoire : c'est elle qui
        // déclenche la désactivation automatique côté backend une fois passée.
        if (formData.type === "evenement" && !formData.endDate) {
            setError("La date de fin est obligatoire pour un événement");
            return;
        }

        setIsLoading(true);
        setError("");

        const { latitude, longitude } = parseCoordsFromLink(formData.locationLink);

        // On n'envoie startDate/endDate que pour les événements.
        // Pour les autres types ces champs sont ignorés côté backend.
        const payload = {
            name: formData.name.trim(),
            type: formData.type,
            isActive: formData.isActive,
            latitude,
            longitude,
        };
        // Pour les événements on ajoute les dates au payload.
        // endDate est réglée à 23:59:59 du jour choisi pour que l'événement
        // reste actif toute la journée de fin (et pas seulement jusqu'à minuit).
        if (formData.type === "evenement") {
            payload.startDate = formData.startDate
                ? new Date(formData.startDate).toISOString()
                : null;
            payload.endDate = formData.endDate
                ? new Date(formData.endDate + "T23:59:59").toISOString()
                : null;
        }

        try {
            await onSubmit(payload);
            onClose();
        } catch (err) {
            setError(err.message || "Erreur lors de l'enregistrement");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            {isEdit
                                ? "Modifier la destination"
                                : "Créer une nouvelle destination"}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={isLoading}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom de la destination *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Eglise Centrale Abidjan"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type *
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                disabled={isLoading}
                            >
                                <option value="lieu_de_culte">
                                    Lieu de culte
                                </option>
                                <option value="evenement">Événement</option>
                                <option value="cellule">Cellule</option>
                            </select>
                        </div>

                        {/* Champs date début/fin, affichés uniquement
                            quand le type est "evenement". La date de fin
                            est obligatoire pour permettre l'auto-désactivation. */}
                        {formData.type === "evenement" && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de début
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de fin *
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lien localisation
                            </label>
                            <input
                                type="url"
                                name="locationLink"
                                value={formData.locationLink}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://maps.google.com/..."
                                disabled={isLoading}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Les coordonnées GPS seront extraites
                                automatiquement du lien Google Maps.
                            </p>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={isLoading}
                            />
                            <label className="ml-2 block text-sm text-gray-700">
                                Destination active
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !formData.name.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isLoading
                                    ? isEdit
                                        ? "Enregistrement..."
                                        : "Création..."
                                    : isEdit
                                      ? "Enregistrer"
                                      : "Créer"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RideDestinationFormModal;
