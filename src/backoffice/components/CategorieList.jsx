import {
    PenIcon,
    Trash,
    X,
    Search,
    ChevronLeft,
    ChevronRight,
    Tag,
    Download,
} from "lucide-react";
import React, { useState } from "react";

function CategorieList({ categorie, onCategorieUpdate, onCategorieDelete }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategorie, setSelectedCategorie] = useState(null);
    const [editedNom, setEditedNom] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // États pour la recherche et pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Filtrer les catégories selon le terme de recherche
    const filteredCategories = categorie.filter(
        (cat) =>
            cat.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.id?.toString().includes(searchTerm)
    );

    // Calculer la pagination
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

    // Réinitialiser la page quand la recherche change
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // Fonction d'export Excel
    const exportToExcel = () => {
        // Préparer les données pour l'export
        const dataToExport = filteredCategories.map((cat) => {
            return {
                ID: cat.id,
                Nom: cat.nom || "N/A",
                "Date de création": cat.createdAt
                    ? new Date(cat.createdAt).toLocaleDateString("fr-FR")
                    : "N/A",
                "Date de mise à jour": cat.updatedAt
                    ? new Date(cat.updatedAt).toLocaleDateString("fr-FR")
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
            `categories_export_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openEditModal = (cat) => {
        setSelectedCategorie(cat);
        setEditedNom(cat.nom);
        setIsEditModalOpen(true);
        setError("");
    };

    const openDeleteModal = (cat) => {
        setSelectedCategorie(cat);
        setIsDeleteModalOpen(true);
        setError("");
    };

    const closeModals = () => {
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedCategorie(null);
        setEditedNom("");
        setError("");
    };

    const handleUpdate = async () => {
        if (!editedNom.trim()) {
            setError("Le nom de la catégorie ne peut pas être vide");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await onCategorieUpdate(selectedCategorie.id, {
                nom: editedNom.trim(),
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
            await onCategorieDelete(selectedCategorie.id);

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
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Rechercher une catégorie..."
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
                {searchTerm && (
                    <p className="mt-2 text-sm text-gray-500">
                        {filteredCategories.length} résultat(s) pour "
                        {searchTerm}"
                    </p>
                )}
            </div>

            {/* Liste des catégories ou message vide */}
            {categorie.length === 0 ? (
                <div className="text-center py-12">
                    <Tag className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucune catégorie
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Commencez par créer une nouvelle catégorie.
                    </p>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun résultat
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Aucune catégorie ne correspond à votre recherche.
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
                                        "Date de création",
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
                                {paginatedCategories.map((cat, idx) => (
                                    <tr
                                        key={cat.id}
                                        className={
                                            idx % 2 === 0
                                                ? "bg-white"
                                                : "bg-gray-50"
                                        }
                                    >
                                        <td className="px-3 py-2">{cat.id}</td>
                                        <td className="px-3 py-2">{cat.nom}</td>
                                        <td className="px-3 py-2">
                                            {cat.createdAt}
                                        </td>

                                        <td className="px-3 flex gap-2 py-2">
                                            <button
                                                onClick={() =>
                                                    openEditModal(cat)
                                                }
                                                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                                title="Modifier la catégorie"
                                            >
                                                <PenIcon
                                                    className="inline mr-1"
                                                    size={12}
                                                />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    openDeleteModal(cat)
                                                }
                                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                                title="Supprimer la catégorie"
                                            >
                                                <Trash
                                                    className="inline mr-1"
                                                    size={12}
                                                />
                                            </button>
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
                                            filteredCategories.length
                                        )}
                                    </span>{" "}
                                    sur{" "}
                                    <span className="font-medium">
                                        {filteredCategories.length}
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
                <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Modifier la catégorie
                            </h2>
                            <button
                                onClick={closeModals}
                                className="text-gray-500 hover:text-gray-700"
                                disabled={isLoading}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom de la catégorie
                            </label>
                            <input
                                type="text"
                                value={editedNom}
                                onChange={(e) => setEditedNom(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Entrez le nom de la catégorie"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModals}
                                className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                disabled={isLoading}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading || !editedNom.trim()}
                            >
                                {isLoading ? "Mise à jour..." : "Mettre à jour"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Confirmer la suppression
                            </h2>
                            <button
                                onClick={closeModals}
                                className="text-gray-500 hover:text-gray-700"
                                disabled={isLoading}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-600">
                                Êtes-vous sûr de vouloir supprimer la catégorie{" "}
                                <span className="font-semibold text-gray-800">
                                    "{selectedCategorie?.nom}"
                                </span>
                                ?
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                Cette action est irréversible.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModals}
                                className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                disabled={isLoading}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading}
                            >
                                {isLoading ? "Suppression..." : "Supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CategorieList;
