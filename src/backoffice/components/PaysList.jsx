import {
    Trash,
    Search,
    ChevronLeft,
    ChevronRight,
    Globe,
    Download,
} from "lucide-react";
import React, { useState } from "react";

function PaysList({ pays }) {
    // États pour la recherche et pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Filtrer les pays selon le terme de recherche
    const filteredPays = pays.filter(
        (p) =>
            p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id?.toString().includes(searchTerm)
    );

    // Calculer la pagination
    const totalPages = Math.ceil(filteredPays.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPays = filteredPays.slice(startIndex, endIndex);

    // Réinitialiser la page quand la recherche change
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // Fonction d'export Excel
    const exportToExcel = () => {
        // Préparer les données pour l'export
        const dataToExport = filteredPays.map((p) => {
            return {
                ID: p.id,
                Nom: p.nom || "N/A",
                Code: p.code || "N/A",
                Flag: p.flag || "N/A",
                "Date de création": p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString("fr-FR")
                    : "N/A",
                "Date de mise à jour": p.updatedAt
                    ? new Date(p.updatedAt).toLocaleDateString("fr-FR")
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
            `pays_export_${new Date().toISOString().split("T")[0]}.csv`
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
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Rechercher un pays..."
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
                        {filteredPays.length} résultat(s) pour "{searchTerm}"
                    </p>
                )}
            </div>

            {/* Liste des pays ou message vide */}
            {pays.length === 0 ? (
                <div className="text-center py-12">
                    <Globe className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun pays
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Commencez par créer un nouveau pays.
                    </p>
                </div>
            ) : filteredPays.length === 0 ? (
                <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun résultat
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Aucun pays ne correspond à votre recherche.
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded shadow">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr>
                                    {["Id", "Nom", "Indicatif", "Actions"].map(
                                        (header) => (
                                            <th
                                                key={header}
                                                className="px-3 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-700"
                                            >
                                                {header}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPays.map((p, idx) => (
                                    <tr
                                        key={p.id}
                                        className={
                                            idx % 2 === 0
                                                ? "bg-white"
                                                : "bg-gray-50"
                                        }
                                    >
                                        <td className="px-3 py-2">{p.id}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                {p.flag && (
                                                    <img
                                                        src={p.flag}
                                                        alt={`Flag ${p.nom}`}
                                                        className="w-6 h-4 rounded"
                                                    />
                                                )}
                                                {p.nom}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">{p.code}</td>

                                        <td className="px-3 py-2">
                                            <button
                                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                                title="Supprimer le pays"
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
                                            filteredPays.length
                                        )}
                                    </span>{" "}
                                    sur{" "}
                                    <span className="font-medium">
                                        {filteredPays.length}
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
        </>
    );
}

export default PaysList;
