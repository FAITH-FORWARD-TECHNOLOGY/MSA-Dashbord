import React, { useState, useEffect } from "react";
import { X, Search, ChevronDown } from "lucide-react";
import { useCellules } from "../hooks/useCellules";
import { useAuth, useUsers } from "../hooks";

function CelluleFormModal({ onClose, onSuccess }) {
    const { createCellule } = useCellules();
    const { users } = useUsers();
    const { user } = useAuth();
    // useAuth expose l'objet de session complet ({ user: {...profil}, token }) :
    // l'identifiant de l'admin est donc imbrique. Sans ce deballage, l'URL
    // partait en /cellules/create/undefined et le backend repondait 500.
    const currentUserId = user?.user?.id ?? user?.id;
    const [formData, setFormData] = useState({
        name: "",
        leaderPersonId: "",
        locationDesc: "",
        locationLink: "",
        startTime: "",
        contactPhone: "",
        isActive: true,
        // Jours de réunion : ISO 8601 (1=lundi à 7=dimanche).
        // Default = mercredi + dimanche, comme l'ancien comportement hardcodé.
        meetingDays: [3, 7],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Filtrer les utilisateurs selon le terme de recherche
    const filteredUsers = users.filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user?.nom?.toLowerCase().includes(searchLower) ||
            user?.prenom?.toLowerCase().includes(searchLower) ||
            user?.email?.toLowerCase().includes(searchLower)
        );
    });

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setFormData((prev) => ({
            ...prev,
            leaderPersonId: user.id.toString(),
        }));
        setSearchTerm(`${user.nom} ${user.prenom} (${user.email})`);
        setIsDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.locationDesc.trim()) {
            setError(
                "Le nom et la description de localisation sont obligatoires"
            );
            return;
        }

        if (!formData.leaderPersonId) {
            setError("Veuillez sélectionner un leader pour la cellule");
            return;
        }

        if (formData.meetingDays.length === 0) {
            setError("Sélectionnez au moins un jour de réunion");
            return;
        }

        if (!currentUserId) {
            setError("Session invalide : reconnectez-vous pour créer une cellule.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await createCellule({
                ...formData,
                leaderPersonId: parseInt(formData.leaderPersonId),
            }, currentUserId);
            onSuccess();
        } catch (err) {
            setError(err.message || "Erreur lors de la création de la cellule");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Toggle un jour de la semaine (1=lundi à 7=dimanche) dans meetingDays.
    // Maintient le tableau trié pour un ordre d'affichage stable côté mobile.
    const toggleMeetingDay = (day) => {
        setFormData((prev) => {
            const has = prev.meetingDays.includes(day);
            const next = has
                ? prev.meetingDays.filter((d) => d !== day)
                : [...prev.meetingDays, day].sort((a, b) => a - b);
            return { ...prev, meetingDays: next };
        });
    };

    const clearUserSelection = () => {
        setSelectedUser(null);
        setSearchTerm("");
        setFormData((prev) => ({
            ...prev,
            leaderPersonId: "",
        }));
        setIsDropdownOpen(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-4">
            {/* Deux colonnes : le formulaire tenait sur ~1400 px de haut en
                colonne unique, ce qui obligeait a defiler pour atteindre les
                boutons. */}
            <div className="relative my-8 p-6 border w-full max-w-3xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            Créer une nouvelle cellule
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom de la cellule *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nom de la cellule"
                                required
                            />
                        </div>

                        <div className="relative sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Leader de la cellule *
                            </label>
                            <div className="relative">
                                <div className="flex">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setIsDropdownOpen(true);
                                            // Si l'utilisateur efface le texte, nettoyer la sélection
                                            if (!e.target.value) {
                                                clearUserSelection();
                                            }
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            selectedUser
                                                ? "border-green-300 bg-green-50"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Rechercher un utilisateur..."
                                        required
                                    />
                                    {selectedUser ? (
                                        <button
                                            type="button"
                                            onClick={clearUserSelection}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 hover:text-red-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    ) : (
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    )}
                                </div>

                                {/* Dropdown des utilisateurs */}
                                {isDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    onClick={() =>
                                                        handleUserSelect(user)
                                                    }
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {user.nom}{" "}
                                                                {user.prenom}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            ID: {user.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-gray-500">
                                                Aucun utilisateur trouvé
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Affichage de l'utilisateur sélectionné */}
                            {selectedUser && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-800">
                                                ✓ Leader sélectionné:{" "}
                                                {selectedUser.nom}{" "}
                                                {selectedUser.prenom}
                                            </p>
                                            <p className="text-xs text-green-600">
                                                {selectedUser.email}
                                            </p>
                                        </div>
                                        <p className="text-xs text-green-600">
                                            ID: {selectedUser.id}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Fermer le dropdown en cliquant ailleurs */}
                            {isDropdownOpen && (
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsDropdownOpen(false)}
                                />
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description localisation *
                            </label>
                            <textarea
                                name="locationDesc"
                                value={formData.locationDesc}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Description de la localisation"
                                rows="2"
                                required
                            />
                        </div>

                        <div className="sm:col-span-2">
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
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Heure de début
                            </label>
                            <input
                                type="text"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="18H30"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Téléphone de contact
                            </label>
                            <input
                                type="text"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="01 52 91 97 79"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours de réunion *
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 1, label: "Lun" },
                                    { value: 2, label: "Mar" },
                                    { value: 3, label: "Mer" },
                                    { value: 4, label: "Jeu" },
                                    { value: 5, label: "Ven" },
                                    { value: 6, label: "Sam" },
                                    { value: 7, label: "Dim" },
                                ].map((d) => {
                                    const active = formData.meetingDays.includes(d.value);
                                    return (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => toggleMeetingDay(d.value)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                                active
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {formData.meetingDays.length === 0 && (
                                <p className="text-xs text-red-600 mt-1">
                                    Sélectionne au moins un jour de réunion.
                                </p>
                            )}
                        </div>

                        <div className="flex items-center sm:col-span-2">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-700">
                                Cellule active
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3 mt-2 sm:col-span-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isLoading ? "Création..." : "Créer"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CelluleFormModal;
