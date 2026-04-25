import {
    PenIcon,
    Trash,
    X,
    ExternalLink,
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Users,
    Download,
} from "lucide-react";
import React, { useState } from "react";
import { useUsers } from "../hooks/useUsers";

function CelluleList({ cellules, onUpdate, onDelete }) {
    const { users } = useUsers();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCellule, setSelectedCellule] = useState(null);
    const [editedCellule, setEditedCellule] = useState({
        name: "",
        leaderPersonId: "",
        locationDesc: "",
        locationLink: "",
        startTime: "",
        contactPhone: "",
        isActive: true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // États pour la recherche globale et pagination
    const [globalSearchTerm, setGlobalSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Filtrer les cellules selon le terme de recherche globale
    const filteredCellules = cellules.filter(
        (cellule) =>
            cellule.name
                ?.toLowerCase()
                .includes(globalSearchTerm.toLowerCase()) ||
            cellule.leader?.nom
                ?.toLowerCase()
                .includes(globalSearchTerm.toLowerCase()) ||
            cellule.leader?.prenom
                ?.toLowerCase()
                .includes(globalSearchTerm.toLowerCase()) ||
            cellule.locationDesc
                ?.toLowerCase()
                .includes(globalSearchTerm.toLowerCase()) ||
            cellule.contactPhone?.includes(globalSearchTerm) ||
            cellule.id?.toString().includes(globalSearchTerm)
    );

    // Calculer la pagination
    const totalPages = Math.ceil(filteredCellules.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCellules = filteredCellules.slice(startIndex, endIndex);

    // Réinitialiser la page quand la recherche change
    const handleGlobalSearchChange = (value) => {
        setGlobalSearchTerm(value);
        setCurrentPage(1);
    };

    // Filtrer les utilisateurs selon le terme de recherche (pour les modales)
    const filteredUsers = users.filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.nom.toLowerCase().includes(searchLower) ||
            user?.prenom?.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
    });

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setEditedCellule((prev) => ({
            ...prev,
            leaderPersonId: user.id,
        }));
        setSearchTerm(`${user.nom} ${user.prenom} (${user.email})`);
        setIsDropdownOpen(false);
    };

    const clearUserSelection = () => {
        setSelectedUser(null);
        setSearchTerm("");
        setEditedCellule((prev) => ({
            ...prev,
            leaderPersonId: "",
        }));
        setIsDropdownOpen(false);
    };

    const openEditModal = (cellule) => {
        setSelectedCellule(cellule);
        setEditedCellule({
            name: cellule.name,
            leaderPersonId: cellule.leaderPersonId,
            locationDesc: cellule.locationDesc || "",
            locationLink: cellule.locationLink || "",
            startTime: cellule.startTime || "",
            contactPhone: cellule.contactPhone || "",
            isActive: cellule.isActive,
        });

        // Trouver et pré-sélectionner l'utilisateur actuel
        const currentUser = users.find(
            (user) => user.id === cellule.leaderPersonId
        );
        if (currentUser) {
            setSelectedUser(currentUser);
            setSearchTerm(
                `${currentUser.nom} ${currentUser.prenom} (${currentUser.email})`
            );
        } else {
            setSelectedUser(null);
            setSearchTerm("");
        }

        setIsEditModalOpen(true);
        setError("");
    };

    const openDeleteModal = (cellule) => {
        setSelectedCellule(cellule);
        setIsDeleteModalOpen(true);
        setError("");
    };

    const closeModals = () => {
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedCellule(null);
        setSelectedUser(null);
        setSearchTerm("");
        setIsDropdownOpen(false);
        setEditedCellule({
            name: "",
            leaderPersonId: "",
            locationDesc: "",
            locationLink: "",
            startTime: "",
            contactPhone: "",
            isActive: true,
        });
        setError("");
    };

    const handleUpdate = async () => {
        if (!editedCellule.name.trim() || !editedCellule.locationDesc.trim()) {
            setError(
                "Le nom et la description de localisation sont obligatoires"
            );
            return;
        }

        if (!editedCellule.leaderPersonId) {
            setError("Veuillez sélectionner un leader pour la cellule");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await onUpdate(selectedCellule.id, {
                ...editedCellule,
                leaderPersonId: parseInt(editedCellule.leaderPersonId),
            });

            closeModals();
        } catch (err) {
            setError(
                err.message ||
                    "Une erreur s'est produite lors de la mise à jour"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        setError("");

        try {
            await onDelete(selectedCellule.id);

            closeModals();
        } catch (err) {
            setError(
                err.message ||
                    "Une erreur s'est produite lors de la suppression"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction d'export Excel
    const exportToExcel = () => {
        // Préparer les données pour l'export
        const dataToExport = filteredCellules.map((cellule) => {
            const leader = users.find(
                (user) => user.id === cellule.leaderPersonId
            );
            return {
                ID: cellule.id,
                "Nom de la cellule": cellule.name,
                "Leader - Nom": leader?.nom || "N/A",
                "Leader - Prénom": leader?.prenom || "N/A",
                "Leader - Email": leader?.email || "N/A",
                Localisation: cellule.locationDesc || "N/A",
                "Lien de localisation": cellule.locationLink || "N/A",
                "Heure de début": cellule.startTime || "N/A",
                "Téléphone de contact": cellule.contactPhone || "N/A",
                Statut: cellule.isActive ? "Actif" : "Inactif",
                "Date de création": cellule.createdAt
                    ? new Date(cellule.createdAt).toLocaleDateString("fr-FR")
                    : "N/A",
            };
        });

        // Créer le contenu CSV
        if (dataToExport.length === 0) {
            alert("Aucune donnée à exporter");
            return;
        }

        const headers = Object.keys(dataToExport[0]);
        const csvContent = [
            headers.join(","),
            ...dataToExport.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        // Échapper les virgules et guillemets dans les valeurs
                        return typeof value === "string" && value.includes(",")
                            ? `"${value.replace(/"/g, '""')}"`
                            : value;
                    })
                    .join(",")
            ),
        ].join("\n");

        // Créer et télécharger le fichier
        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `cellules_export_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            {/* Barre de recherche et bouton d'export */}
            <div className="mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={globalSearchTerm}
                            onChange={(e) =>
                                handleGlobalSearchChange(e.target.value)
                            }
                            placeholder="Rechercher une cellule..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>

                    {/* Bouton d'export Excel */}
                    <button
                        onClick={exportToExcel}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                        title="Exporter vers Excel"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Excel
                    </button>
                </div>
                {globalSearchTerm && (
                    <p className="mt-2 text-sm text-gray-500">
                        {filteredCellules.length} résultat(s) pour "
                        {globalSearchTerm}"
                    </p>
                )}
            </div>

            {/* Liste des cellules ou message vide */}
            {cellules.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucune cellule
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Commencez par créer une nouvelle cellule.
                    </p>
                </div>
            ) : filteredCellules.length === 0 ? (
                <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun résultat
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Aucune cellule ne correspond à votre recherche.
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded shadow">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr>
                                    {[
                                        "Id",
                                        "Nom",
                                        "Leader",
                                        "Localisation",
                                        "Heure de début",
                                        "Téléphone",
                                        "Statut",
                                        "Actions",
                                    ].map((header) => (
                                        <th
                                            key={header}
                                            className="px-3 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-700"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCellules.map((cellule, idx) => (
                                    <tr
                                        key={cellule.id}
                                        className={
                                            idx % 2 === 0
                                                ? "bg-white"
                                                : "bg-gray-50"
                                        }
                                    >
                                        <td className="px-3 py-2">
                                            {cellule.id}
                                        </td>
                                        <td className="px-3 py-2 font-medium">
                                            {cellule.name}
                                        </td>
                                        <td className="px-3 py-2">
                                            {(() => {
                                                const leader = users.find(
                                                    (user) =>
                                                        user.id ===
                                                        cellule.leaderPersonId
                                                );
                                                return leader ? (
                                                    <div className="text-sm">
                                                        <p className="font-medium text-gray-900">
                                                            {leader.nom}{" "}
                                                            {leader.prenom}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {leader.email}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        ID:{" "}
                                                        {cellule.leaderPersonId}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">
                                                    {cellule.locationDesc}
                                                </span>
                                                {cellule.locationLink && (
                                                    <a
                                                        href={
                                                            cellule.locationLink
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <ExternalLink
                                                            size={16}
                                                        />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            {cellule.startTime}
                                        </td>
                                        <td className="px-3 py-2">
                                            {cellule.contactPhone}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    cellule.isActive
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {cellule.isActive
                                                    ? "Actif"
                                                    : "Inactif"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() =>
                                                        openEditModal(cellule)
                                                    }
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Modifier"
                                                >
                                                    <PenIcon size={16} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openDeleteModal(cellule)
                                                    }
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Supprimer"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-md shadow">
                            <div className="flex-1 flex justify-between items-center">
                                <div className="text-sm text-gray-700">
                                    Affichage de{" "}
                                    <span className="font-medium">
                                        {startIndex + 1}
                                    </span>{" "}
                                    à{" "}
                                    <span className="font-medium">
                                        {Math.min(
                                            endIndex,
                                            filteredCellules.length
                                        )}
                                    </span>{" "}
                                    sur{" "}
                                    <span className="font-medium">
                                        {filteredCellules.length}
                                    </span>{" "}
                                    résultats
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() =>
                                            setCurrentPage(currentPage - 1)
                                        }
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                        <span className="sr-only">
                                            Précédent
                                        </span>
                                    </button>

                                    <div className="flex space-x-1">
                                        {Array.from(
                                            { length: totalPages },
                                            (_, i) => i + 1
                                        ).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() =>
                                                    setCurrentPage(page)
                                                }
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    currentPage === page
                                                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() =>
                                            setCurrentPage(currentPage + 1)
                                        }
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                        <span className="sr-only">Suivant</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal d'édition */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60  overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Modifier la cellule
                                </h3>
                                <button
                                    onClick={closeModals}
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

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom de la cellule *
                                    </label>
                                    <input
                                        type="text"
                                        value={editedCellule.name}
                                        onChange={(e) =>
                                            setEditedCellule({
                                                ...editedCellule,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nom de la cellule"
                                    />
                                </div>

                                <div className="relative">
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
                                                    setSearchTerm(
                                                        e.target.value
                                                    );
                                                    setIsDropdownOpen(true);
                                                    // Si l'utilisateur efface le texte, nettoyer la sélection
                                                    if (!e.target.value) {
                                                        clearUserSelection();
                                                    }
                                                }}
                                                onFocus={() =>
                                                    setIsDropdownOpen(true)
                                                }
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
                                                    filteredUsers.map(
                                                        (user) => (
                                                            <div
                                                                key={user.id}
                                                                onClick={() =>
                                                                    handleUserSelect(
                                                                        user
                                                                    )
                                                                }
                                                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            {
                                                                                user.nom
                                                                            }{" "}
                                                                            {
                                                                                user.prenom
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {
                                                                                user.email
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-xs text-gray-400">
                                                                        ID:{" "}
                                                                        {
                                                                            user.id
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    )
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
                                            onClick={() =>
                                                setIsDropdownOpen(false)
                                            }
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description localisation *
                                    </label>
                                    <textarea
                                        value={editedCellule.locationDesc}
                                        onChange={(e) =>
                                            setEditedCellule({
                                                ...editedCellule,
                                                locationDesc: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Description de la localisation"
                                        rows="2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Lien localisation
                                    </label>
                                    <input
                                        type="url"
                                        value={editedCellule.locationLink}
                                        onChange={(e) =>
                                            setEditedCellule({
                                                ...editedCellule,
                                                locationLink: e.target.value,
                                            })
                                        }
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
                                        value={editedCellule.startTime}
                                        onChange={(e) =>
                                            setEditedCellule({
                                                ...editedCellule,
                                                startTime: e.target.value,
                                            })
                                        }
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
                                        value={editedCellule.contactPhone}
                                        onChange={(e) =>
                                            setEditedCellule({
                                                ...editedCellule,
                                                contactPhone: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="01 52 91 97 79"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={editedCellule.isActive}
                                        onChange={(e) =>
                                            setEditedCellule({
                                                ...editedCellule,
                                                isActive: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">
                                        Cellule active
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={closeModals}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {isLoading
                                        ? "Mise à jour..."
                                        : "Mettre à jour"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de suppression */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/60 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Supprimer la cellule
                                </h3>
                                <button
                                    onClick={closeModals}
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

                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <Trash className="h-6 w-6 text-red-600" />
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Êtes-vous sûr de vouloir supprimer la cellule "
                                {selectedCellule?.name}" ?
                                <br />
                                Cette action est irréversible.
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={closeModals}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                    {isLoading ? "Suppression..." : "Supprimer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CelluleList;
